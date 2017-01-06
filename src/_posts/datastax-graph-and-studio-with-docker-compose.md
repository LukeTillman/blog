---
title: DataStax Graph and Studio with Docker Compose
date: 2017-01-06 08:17:55
updated: 2017-01-06 08:17:55
meta_image:
tags:
- datastax enterprise
- graph
- docker
- windows
---
Over the last year, Docker has quickly become my go-to way of spinning up infrastructure for 
development in my local Windows 10 environment. This is especially true of tools that don't 
otherwise support native Windows installation, for example, [DataStax Enterprise][dse] (DSE).

Tools like [Docker Compose][docker-compose] make it really easy to declare a whole suite of
infrastructure dependencies (by creating a `.yaml` file with the containers to run). That file
can then be checked into source control with your project and shared with other developers. I 
made heavy use of this in the [KillrVideo reference application][killrvideo] so that developers
trying out the code could easily spin up dependencies like the Web UI, DSE, and etcd.

Unfortunately, when I did the work on KillrVideo, DataStax didn't offer an official image for
DSE on Docker Hub (something that's still true as of the publishing of this article). As a 
result, I had to [roll my own][dse-docker-hub] image. Since doing that, I've gotten a number of
contributions and questions, including [one the other day][graph-issue] that basically asked,
*"How do I run this and connect DSE Graph with DataStax Studio?"*.

If you're not familiar, [DataStax Studio][studio] is a tool for querying and visualizing data
in DSE Graph using a notebook format (similar to Apache Zeppelin or Jupyter notebooks). After
quickly creating a [Docker image for DataStax Studio][studio-docker-hub], I thought it would be
pretty simple to just create a `docker-compose.yml` to spin up a node of DSE in Graph mode
along with an instance of Studio and start exploring. Unfortunately, it turned out to be a
little more complicated than that.

> **TL;DR**: If you're just interested in the final (working) example, you can find it on the 
> [GitHub repo][compose-example] of my DataStax Studio image. Please be sure to *read the comments*
> in that file for instructions.

## This will be easy!

Basically what we need in our `docker-compose.yml` is two services:

1. A node of DSE running in graph mode.
1. An instance of Studio with port `9091` exposed so we can connect to the web UI.

That seems pretty straightforward, so let's start with this:

```yaml
version: '2'

services:
  # One DSE node
  dse:
    image: luketillman/datastax-enterprise:5.0.4
    # Tell DSE to start a graph node
    command: [ -g ]
    cap_add:
    - IPC_LOCK
    ulimits:
      memlock: -1
      
  # One instance of DataStax Studio
  studio:
    image: luketillman/datastax-studio:1.0.2
    ports:
    # The Web UI exposed to our host
    - "9091:9091"
    depends_on:
    - dse
```

We can then start our containers by running:

```
> docker-compose up -d
```

If we open up a web browser and go to `http://localhost:9091` we're able to see the Studio web
UI. So far so good. Now if we go to the *Connections* tab, we can edit the connections to tell
it to use our DSE Graph node that's also running in Docker.

<figure>
  {% asset_img studio-connections.png Editing a connection in Studio %}
  <figcaption>
    <header>Editing the connection to use our DSE Graph node</header>
    Since we're using Docker Compose, we should be able to just use the service name from the 
    <code>yaml</code> file (dse) as the host name and Docker's networking will provide the
    proper DNS resolution.
  </figcaption>
</figure>

Then we'll use the handy *Test* button to actually try out the connection.

<figure>
  {% asset_img studio-connections-test-error.png Error when testing connection %}  
  <figcaption>
    <header>Test Failed</header>
    We get a cryptic <em>URI for host could not be constructed</em> error when trying to test
    the connection to our DSE Graph node.
  </figcaption>
</figure>

Wait, what?! Test failed? OK, time to try and figure out what's causing that error.

## Digging around in the Apache Tinkerpop source code

Judging by that error message, Studio is trying to construct a URI of some kind in order to 
connect to our DSE Graph node (and failing miserably). We know that DSE Graph is
[built with Apache Tinkerpop][dse-graph] so it stands to reason that maybe Studio is using a
Tinkerpop driver under the covers to try and connect to our node. If we go and check out the
[source code for Tinkerpop][github-tinkerpop] and do some searching for that error message
string, we come across [`Host.java`][tinkerpop-host-java] in the `gremlin-driver`.

Here's the interesting method in that class:

```java
private static URI makeUriFromAddress(final InetSocketAddress addy, final boolean ssl) {
  try {
    final String scheme = ssl ? "wss" : "ws";
    return new URI(scheme, null, addy.getHostName(), addy.getPort(), "/gremlin", null, null);
  } catch (URISyntaxException use) {
    throw new RuntimeException(String.format("URI for host could not be constructed from: %s", addy), use);
  }
}
```

It appears that while trying to construct a `URI`, we're getting a syntax exception. So why is 
that happening? Let's go back and look at the `InetSocketAddress` included in the error message
for some clues (with emphasis added):

> Unable to connect to gremlin server on the following ip addresses and ports: 
> (172.18.0.2:8182) - URI for host could not be constructed from: 
> **examples_dse_1.examples_default/172.18.0.2:8182**

We told Studio to connect using our service name (dse) as the hostname, so where is it getting
the hostname `examples_dse_1.examples_default` from? It looks like somewhere along the line, our
dse hostname is getting resolved to `examples_dse_1.examples_default`. We can test this theory
out real quick by doing an `nslookup dse` inside our running Studio container:

```
> docker-compose exec studio nslookup dse
nslookup: can't resolve '(null)': Name does not resolve

Name:      dse
Address 1: 172.18.0.2 examples_dse_1.examples_default
```

OK, so it looks like the hostname is coming from Docker's DNS. But why is it causing an error? 
Based on some experience from a bug at my previous company, I had an inkling that it might be 
the underscore characters (`_`) in the hostname. After some quick Googling, I came across 
[this StackOverflow question][stack-overflow] and a related [Java bug report][java-bug-report].

It looks like that Java `URI` constructor doesn't play well with underscores. So how do we get
rid of them?

## Removing the Underscores from Docker Compose

First, it's probably worth mentioning how that hostname returned from Docker's DNS is being
constructed. When Docker Compose started up our two services, it first created a network so
they could communicate. If you don't actually specify any networking setup in your `yaml` file,
Compose will create a network using the convention `$PROJECT_default` where `$PROJECT` is the 
name of your Docker Compose project. In my case, my project was called `examples`, so it was 
creating a network called `examples_default`.

The containers created by Docker Compose also follow a naming convention. The naming convention
for containers created is `$PROJECT_$SERVICE_$INSTANCE` where `$PROJECT` is still the name of 
your Docker Compose project, `$SERVICE` is the name of the service from your `yaml` file, and
`$INSTANCE` is the instance number of that service container. The instance number allows Docker
Compose to support "scaling" the number of instances of a running service. So for our single 
instance of the DSE service, we end up getting a container named `examples_dse_1`.

Put the container name and the network name together and you get the hostname we're getting from
Docker's DNS:

```
examples_dse_1.examples_default
```

Unfortunately, the underscores being added by Docker Compose's naming conventions aren't 
currently configurable (and the problems they cause as hostnames is a [known issue][compose-issue]
going back to 2014). However, we can work around the problem by taking explicit control of both
the network and the container names.

### Changing the Network Name

The `docker-compose.yml` file itself doesn't give us any way to explictly specify the network
name created by Compose. Instead, we have to resort to creating a network manually using the 
`docker network` command, then telling Compose to use that external network. Let's create a 
network called `graph`:

```
> docker network create graph
```

Then, we can update the `yaml` to tell Compose about our network and to tell our services to use
that network.

```yaml
version: '2'

# Our external network named 'graph'
networks:
  graph:
    external: true

services:
  # One DSE node
  dse:
    image: luketillman/datastax-enterprise:5.0.4
    # Tell DSE to start a graph node
    command: [ -g ]
    cap_add:
    - IPC_LOCK
    ulimits:
      memlock: -1
    # Use the externally created network
    networks:
    - graph

  # One instance of DataStax Studio
  studio:
    image: luketillman/datastax-studio:1.0.2
    ports:
    # The Web UI exposed to our host
    - "9091:9091"
    depends_on:
    - dse
    # Use the externally created network
    networks:
    - graph
```

Now if we start up our services and do an `nslookup dse` inside the Studio container, we can see
some progress:

```
> docker-compose exec studio nslookup dse
nslookup: can't resolve '(null)': Name does not resolve

Name:      dse
Address 1: 172.18.0.2 examples_dse_1.graph
```

Our container name still has underscores, but our network name `graph` is now good to go.

### Changing the DSE Container's Name

Overriding the container's name inside our `docker-compose.yml` file is actually a lot easier.
The syntax supports adding a `container_name` to a service to explictly specify it, with the
downside being that this will break the scaling feature of Compose. Since we don't care about
scaling in this case, we can go ahead and override the container name for our DSE service:

```yaml
version: '2'

# Our external network named 'graph'
networks:
  graph:
    external: true

services:
  # One DSE node
  dse:
    image: luketillman/datastax-enterprise:5.0.4
    # Tell DSE to start a graph node
    command: [ -g ]
    cap_add:
    - IPC_LOCK
    ulimits:
      memlock: -1
    # Use the externally created network
    networks:
    - graph
    # Specify the container name explicitly to avoid getting underscores
    container_name: dse

  # One instance of DataStax Studio
  studio:
    image: luketillman/datastax-studio:1.0.2
    ports:
    # The Web UI exposed to our host
    - "9091:9091"
    depends_on:
    - dse
    # Use the externally created network
    networks:
    - graph
```

We've explicitly named the container `dse`. Now if we do a `nslookup dse` inside of our Studio
container, we get the results we want:

```
> docker-compose exec studio nslookup dse
nslookup: can't resolve '(null)': Name does not resolve

Name:      dse
Address 1: 172.18.0.2 dse.graph
```

The hostname `dse.graph` should be good enough. If we go back to the browser and open the Studio
web UI again (`localhost:9091`), we find out that we're now able to successfully connect when
using the host `dse`.

## Turns out that wasn't so easy

The full working example [is available on GitHub][compose-example]. I'm not sure how I managed,
but somehow a task that I thought would take an hour tops turned into a multi-day slog through
source code, documentation, Stack Overflow, and trying multiple workarounds. While this turned
out to be a weird confluence of long-standing Java and Docker Compose issues, I have hope that
maybe one of them will get fixed, removing the need for complicated workarounds in the future.


[dse]: http://www.datastax.com/products/datastax-enterprise
[docker-compose]: https://docs.docker.com/compose/overview/
[studio]: http://www.datastax.com/products/datastax-devcenter-and-development-tools#DataStax-Studio
[killrvideo]: https://killrvideo.github.io/
[dse-docker-hub]: https://hub.docker.com/r/luketillman/datastax-enterprise/
[graph-issue]: https://github.com/LukeTillman/dse-docker/issues/2
[studio-docker-hub]: https://hub.docker.com/r/luketillman/datastax-studio/
[compose-example]: https://github.com/LukeTillman/ds-studio-docker/blob/master/examples/docker-compose.yml
[dse-graph]: http://www.datastax.com/products/datastax-enterprise-graph
[github-tinkerpop]: https://github.com/apache/tinkerpop
[tinkerpop-host-java]: https://github.com/apache/tinkerpop/blob/3.2.3/gremlin-driver/src/main/java/org/apache/tinkerpop/gremlin/driver/Host.java
[stack-overflow]: http://stackoverflow.com/questions/25993225/uri-gethost-returns-null-why
[java-bug-report]: http://bugs.java.com/view_bug.do?bug_id=6587184
[compose-issue]: https://github.com/docker/compose/issues/229