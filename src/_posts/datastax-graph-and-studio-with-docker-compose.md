---
title: DataStax Graph and Studio with Docker Compose
date: 2017-01-09 08:17:55
updated: 2017-01-09 08:17:55
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






[dse]: http://www.datastax.com/products/datastax-enterprise
[docker-compose]: https://docs.docker.com/compose/overview/
[studio]: http://www.datastax.com/products/datastax-devcenter-and-development-tools#DataStax-Studio
[killrvideo]: https://killrvideo.github.io/
[dse-docker-hub]: https://hub.docker.com/r/luketillman/datastax-enterprise/
[graph-issue]: https://github.com/LukeTillman/dse-docker/issues/2
[studio-docker-hub]: https://hub.docker.com/r/luketillman/datastax-studio/
[compose-example]: https://github.com/LukeTillman/ds-studio-docker/blob/master/examples/docker-compose.yml
