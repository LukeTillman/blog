---
title: Showing Off Cassandra on Azure
date: 2014-09-15T23:07:14.376Z
tags:
- cassandra
- azure
- cassandra summit
- killrvideo
---
One of the cool things about the evangelist team at DataStax is that we're encouraged to spend time writing code to
contribute back to the community.  For example, [Helena's](http://helenaedelson.com/) work on the [Spark Cassandra
connector](https://github.com/datastax/spark-cassandra-connector), [Jon's](http://rustyrazorblade.com/) work on
[cqlengine](https://github.com/cqlengine/cqlengine), or even my latest foray into OSS,
[CqlPoco](https://github.com/LukeTillman/cqlpoco).  At Cassandra Summit 2014 last week, many of us got the opportunity
to connect with members of the Cassandra community about some of that work and in my case, I even got the opportunity to
give a talk about it.

My talk was entitled "Highly Scalable Web Application in the Cloud with Cassandra, C#, and Azure" and was great because
I got the chance to show off Cassandra running live in Azure.  And I got to do it while co-presenting with [Jeremiah
Talkar](https://twitter.com/JST2Cents), an Azure Evangelist at Microsoft.  Showing up at an OSS conference like
Cassandra Summit with a guy from Microsoft might seem a bit like bringing Darth Vader to a summit for the Rebel
Alliance, but Microsoft has really started [embracing open source](http://msopentech.com/), so I don't feel like it was
too much of a stretch.  (The example I use a lot recently is the ASP.NET vNext web stack being [available on
GitHub](https://github.com/aspnet) under the Apache 2 license--my mind is blown.)  And let's be honest, a better fit for
the Darth Vader analogy would have been bringing Larry Ellison to the Summit.

<figure>
  {% asset_img Vader-Elevator.jpg Darth Vader in Elevator %}
  <figcaption>
    <header>Microsoft is at Cassandra Summit?</header>
    How I imagine some attendees reacted to Microsoft being a sponsor at Cassandra Summit 2014.  (h/t 
    <a href="http://nerdreactor.com/2010/11/15/darth-vader-approves-the-samsung-galaxy-s/">Nerd Reactor</a>
    for the image)
  </figcaption>
</figure>

## KillrVideo Demo
My talk was all about [KillrVideo](http://www.killrvideo.com), a demo video sharing application built in C# and running
on top of Cassandra with a live copy of the demo running in Azure.  All the code, including the data model, is available
on [my GitHub](https://github.com/luketillman/killrvideo-csharp) and anyone with an Azure account should be able to get
it up and running locally pretty easily.  The application  tries to show off some of the capabilities of the DataStax
.NET driver for Cassandra, as well as some data modelling techniques for Cassandra.  It also uses some Azure services,
like Media Services and Storage to support video uploads, re-encoding of source videos to something that's web streaming
compatible, thumbnail generation, etc.

Here's a slide from my presentation at the Summit showing off the basic logical architecture of the site.

{% asset_img KillrVideo-LogicalArchitecture.png KillrVideo logical architecture slide %}

I think the boxes on the slide do a pretty good job summarizing what's going on within the app, and the arrows represent
how data flows and what components are talking to each other as you move down the stack from the app tier (in yellow) to
some of the infrastructure components along the bottom of the slide.  Architectually, it's a pretty good place to be
because every component you see on that slide is able to be scaled horizontally with pretty minimal effort (whether
that's adding more reserved video encoding power with Azure Media Services, adding more workers in the two app tier
roles, or adding more nodes to my DataStax Enterprise Cassandra cluster).

#### Side Note About that Arrow from the Web UI to Azure Storage

One interesting side note about that slide--you may have noticed that we have an arrow going directly from the Web UI
tier (i.e. the browser) back to Azure Storage.  This is to represent what we do when users upload videos to the site.
In that scenario, we upload their video files directly to the Azure Storage account associated with our Media Services
account so we don't put unnecessary load on our web tier just to stream data into Azure Storage.  We can do this (even
though Azure Storage and our demo site are on different domains and thus subject to browser [cross-domain
restrictions](http://en.wikipedia.org/wiki/Same-origin_policy)) by taking advantage of some of the new HTML5 File APIs
and [CORS-enabled
uploads](http://www.mono-software.com/blog/post/Mono/237/Building-Windows-Azure-Media-Services-async-CORS-enabled-upload/)
directly to Azure Storage.

## Setting up Cassandra on Azure

I'm hoping that in the very near future we (DataStax) will be making public some documentation and scripts we've been
working on with the team at Microsoft that includes recommendations on how to setup and configure Cassandra in Azure.
(Huge props to [Matt Kennedy](https://twitter.com/thetweetofmatt), [Rustam Aliyev](https://twitter.com/rstml), and all
the others involved at both DataStax and Microsoft in testing Cassandra on Azure).  But until that GitHub repo becomes
public, I'll quickly mention how I setup KillrVideo there.  This is a just a very high level overview of the steps
involved:

1.  Create an affinity group for your application that will be using Cassandra.
2.  Create a virtual network for your Cassandra cluster.  Since vnets are no longer associated with affinity groups,
    just make sure it's in the same data center as your affinity group.
3.  Create some Azure Storage accounts to hold the data disks for your Cassandra nodes.  Our performance testing seemed
    to indicate that you'll need **1** storage account for every **2** Cassandra nodes in your cluster, as 2 nodes seem
    to be able to use 80-90% of the IOPS limit on a single storage account.
4.  Create a Cloud Service that can be used to expose an HTTP Endpoint for OpsCenter for management/provisioning of your
    cluster.
5.  Spin up some Linux VMs in your Cloud Service for your Cassandra Nodes, as well as one for OpsCenter.  I deployed 3
    VMs for Cassandra nodes plus 1 VM to run OpsCenter:
  *  _VM image used:_ 5112500ae3b842c8b9c604889f8753c3\_\_OpenLogic-CentOS-65-20140606
  *  _Size:_ A4 for Cassandra nodes (but we recommend using A7s for a real production cluster), A2 for OpsCenter
  *  _Data Disks:_  16 disks x 64 GB each on each Cassandra node VM
  *  _Subnet / IP:_ The VM should use the Subnet and Set a static IP inside the virtual network you created
  *  _SSH access:_ Add an Azure endpoint and your SSH key to the VM if you want to be able to access the VM via SSH (and
     you'll want to)
6.  Setup the data disks on each Linux VM.  This basically came down to:
  *  Using `mdadm` to stripe the 16 data disks into a RAID0 setup and a single device
  *  Create a filesystem on that device using `mkfs.ext4`
  *  Create a `/var/lib/cassandra` directory
  *  Edit `/etc/fstab` to point `/var/lib/cassandra` at the new device we created with `mdadm`
  *  Mount `/var/lib/cassandra`

At this point, I was ready to [install OpsCenter](http://www.datastax.com/documentation/opscenter/5.0/opsc/about_c.html)
on its designated VM and expose it via a Cloud Service HTTP endpoint in Azure.  You'll definitely want to [turn on
HTTPS](http://www.datastax.com/documentation/opscenter/5.0/opsc/configure/opscConfiguringEnablingHttps_t.html) and
[authentication](http://www.datastax.com/documentation/opscenter/5.0/opsc/configure/opscConfigureUserAccess_c.html) in
OpsCenter since you'll be exposing it via a public endpoint in Azure.  Once I had OpsCenter running and I could login
via the web UI (exposed as an Azure endpoint), provisioning a DataStax Enterprise cluster was a simple point and click
affair where all I had to provide was the IP addresses (on my Azure vnet) for the node VMs.

## The Future of Azure Deployments
The steps above were deliberately a bit vague and without scripts to automate the VM setup.  This is because I want to
wait until DataStax and Microsoft make this information public so you can go directly to the source for it.  So a
disclaimer:  hopefully the steps above will get you started with setting things up if you're interested, but stay tuned
for the official guidance on not only how to set things up, but also how to automate that setup.

I'm really hoping that KillrVideo will help other .NET developers looking to get started with Cassandra see some of
what's possible.  And with the live demo in Azure, along with the cooperation happening between the teams at Microsoft
and DataStax I'm also hoping that Cassandra in Azure is a real option for developers of all languages going forward.
And if things don't work out, maybe I can get Oracle to tag along for next year's Summit.

<figure>
  {% asset_img Vader-AddressingCrowd.jpg Darth Vader addresses the crowd %}
  <figcaption>
    <header>Cassandra Summit 2015?</header>
    Larry Ellison addresses the crowd at Cassandra Summit 2015.  (h/t 
    <a href="https://www.facebook.com/Darth.Vader.IPU">Ukranian Internet Party</a> for the image)
  </figcaption>
</figure>
