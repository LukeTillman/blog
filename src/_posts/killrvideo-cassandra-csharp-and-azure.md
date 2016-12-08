---
title: "KillrVideo: Cassandra, C#, and Azure"
date: 2015-01-21T22:27:00.000Z
updated: 2015-01-21T22:27:00.000Z
tags:
- cassandra
- azure
- killrvideo
- c#
- microservices
- software architecture
---
When I started at DataStax 11 months ago, I was a total Cassandra newb.  Sure, I'd been writing code for a number of
years (with most of the last 10 years spent in the world of .NET), but the applications I was building were typically
built using a RDBMS for storage.  At most of the .NET shops where I worked, this meant SQL Server, but at my last job we
were purveyors of the unholy alliance of technology vendors, [Oracle and
.NET](/how-my-favorite-oracle-error-led-me-to-datastax-and-cassandra).

As a way to get up to speed, my boss suggested writing a demo web application using Cassandra and C#.  He already had a
[sample CQL schema](https://github.com/pmcfadin/cassandra-videodb-sample-schema) for a video sharing web site (like
YouTube) that I could use as a starting point.  He'd been using this schema in some of his talks (both publicly and
privately in front of customers) to illustrate some of the ways data modeling was done in Cassandra.

And thus, [KillrVideo](https://github.com/luketillman/killrvideo-csharp) was born.

## What is KillrVideo?
KillrVideo is a demo video sharing application built with Cassandra, C#, and Azure.  Users can upload videos (or share
videos from other sources like YouTube), watch them, comment on them, rate them, and more.  All the code is open source
and [available on GitHub](https://github.com/luketillman/killrvideo-csharp) under an Apache 2 license.  My hope is that
other .NET developers, whether completely new to Cassandra or not, can use the schema and code available there as a
reference for figuring out how you build a .NET application or service on Cassandra.

So what exactly is this thing built on?  Here's a quick rundown of some of the components at the time of writing:

* .NET Framework 4.5, making liberal use of async/await
* ASP.NET MVC 5
* Cassandra 2.0.x, I use [DataStax Community Edition](http://planetcassandra.org/cassandra/) while developing locally on
  Windows
* [DataStax C# Driver](https://github.com/datastax/csharp-driver) for Cassandra, available via NuGet
* [Castle Windsor](http://docs.castleproject.org/Default.aspx?Page=MainPage&NS=Windsor), my IoC container of choice
* Google's [YouTube API](https://developers.google.com/youtube/), for loading sample data and videos shared from YouTube

#### Wait, I thought you said Azure?
One of the goals of putting this demo application together was to ultimately host it live in Azure with a real Cassandra
cluster.  Fortunately, my boss already owned the domain name and so a [live demo is
available](http://www.killrvideo.com/), deployed in Azure.  As a result, the code contains an Azure deployment project
and developers can use the [Azure SDK](http://azure.microsoft.com/en-us/downloads/) for running the demo locally on the
SDK's emulator.  One minor difference between the live demo and the way most developers will run the code locally is
that the live demo is running against a [DataStax
Enterprise](http://www.datastax.com/what-we-offer/products-services/datastax-enterprise) cluster hosted in Azure.

I also wanted to support user-generated videos (i.e. uploaded videos) as part of the application.  After all, the demo
would probably be a little underwhelming if all you could do was share videos already uploaded to YouTube.  Fortunately,
Microsoft offers [Azure Media Services](http://azure.microsoft.com/en-us/services/media-services/) as part of their
platform for just this scenario.  Initially, Media Services was the only piece of Azure that the site relied on, but
over time it has evolved and it currently makes use of the following Azure services:

* [Azure Media Services](http://azure.microsoft.com/en-us/services/media-services/), for re-encoding uploaded videos
  into something suitable for playback on the web and generating preview thumbnails for those videos
* [Azure Storage](http://azure.microsoft.com/en-us/services/storage/), for storage of uploaded videos and notifications
  (via storage queues) of video encoding task progress
* [Azure Service Bus](http://azure.microsoft.com/en-us/services/service-bus/), for communication between the various
  (micro)services via events published to the bus

It also makes use of [Nimbus](https://github.com/NimbusAPI/Nimbus), a great abstraction for working with Azure Service
Bus that will be familiar to any developer who's ever worked with any of the popular .NET service bus libraries (like
[NServiceBus](https://github.com/Particular/NServiceBus), [MassTransit](https://github.com/MassTransit/MassTransit), or
[Rebus](https://github.com/rebus-org/Rebus)).

## Software Architecture, a love story

> Disclaimer: I am fascinated with software architecture, but I am by no means an expert.

When I first started writing the demo, I made a decision that a lot of developers make--that the fastest and easiest way
to get a prototype working was to build a mostly [monolithic app](http://en.wikipedia.org/wiki/Monolithic_application)
with a traditional [three-tier achitecture](http://en.wikipedia.org/wiki/Multitier_architecture).  I even spoke about
this and included a slide with a diagram when I [presented at the Cassandra Summit
2014](/showing-off-cassandra-on-azure/) in San Francisco.  Over time though, my goal was always to move things towards
more of a modular architecture.

In the last few months, I got that opportunity as part of a redesign effort triggered by an overhaul of the UI to try
and look a bit less "bootstrap-y" and a bit more professional.  Yes, it is kind of strange that a UI reboot allowed me
to restructure a lot of the backend code, but since I was already spending a lot of time writing code, it seemed to make
sense.  As a result, KillrVideo is now a lot more modular, using more of a
[SOA](http://en.wikipedia.org/wiki/Service-oriented_architecture) approach (or
[microservices](http://martinfowler.com/articles/microservices.html) if you prefer, since that's the new hotness).

> Yes, I feel like I might be winning buzzword bingo right now.  But wait, there's more!

If you take a look at the code now, you'll notice that the web app is composed of a bunch of logically independent
services.  Each service is responsible for a different business capability or feature of the site.  I'm a big fan of
[Event-driven architectures](http://en.wikipedia.org/wiki/Event-driven_architecture) to achieve loose coupling and
scalability, so much of the interaction between services happens as a result of events (messages) published on Azure
Service Bus.

For simplicity's sake and to make it easier for developers to run the demo locally, there are only two physical units of
deployment: the web app (running as an Azure Web Role), and a background worker (running as an Azure Worker Role).  Each
of those physical endpoints is composed of multiple *logical* services running in-process together.  I realize that some
people may disagree with me characterizing this as a microservices architecture because the services are not
independently hosted/deployed.

To me the physical process boundry is not as important as the services being autonomous and the idea that the services
be independently *deployable* (as opposed to *deployed*).  I've tried to structure the solution's code in a way that
indicates how trivial it would be to break any of these services out into their own separate physically deployed unit
(i.e. Azure Worker Role).  The architecture should (and will) get its own blog post at some point in the future, but
until then, I highly recommend watching Udi Dahan's [keynote from &#181;Con
2014](https://skillsmatter.com/skillscasts/5235-keynote-an-integrated-services-approach) for more thoughts on the
subject.

## Cracking Open the Code
Speaking of the code structure, once you've cloned [the repository](https://github.com/luketillman/killrvideo-csharp)
and opened the solution in Visual Studio, I'm hoping that things will be pretty straightforward.

{% asset_img 2015-01-21_14h33_49.png KillrVideo Solution Explorer Screenshot %}

The projects in the solution can really be put into three main categories: top-level projects, services, and
utility/deployment projects.

#### Top-Level Projects
These are the actual applications that get deployed.  There are two projects that fall under this category:

* `KillrVideo`: the ASP.NET MVC web application, deployed as an Azure Web Role.
* `KillrVideo.BackgroundWorker`: a background worker for doing any background processing for the various services,
  deployed as an Azure Worker Role.

#### Services
Any of the projects under the `Services` folder in the solution fall under this category, with each service getting its
own sub-folder.  Each service tends to have up to 3 projects associated with it.  The top-level one (for example
`KillrVideo.Uploads`) contains the service's API for consumption by applications like the web app.  You'll see the web
app making calls to these projects.

The `.Messages` projects (for example `KillrVideo.Uploads.Messages`) contain the events published by that service.  Like
I mentioned in the architecture section above, services are loosely-coupled and interactions between services are driven
by reacting to events published by other services.  For example, the `VideoCatalog` service reacts to the
`UploadedVideoPublished` event from the `Uploads` service to add an uploaded video to its catalog when the video is
published and ready for viewing.

Lastly, the `.Worker` projects (for example `KillrVideo.Uploads.Worker`) contain the event handlers for reacting to
events and any other backend processing code that a service needs to function.  The code from the various worker
projects is composed and deployed in a single physical background worker (the `KillrVideo.BackgroundWorker` worker
role).  But these could easily be converted into Azure Worker Roles of their own and deployed separately.

#### Utility/Deployment Projects
The category pretty much describes the two projects here:

* `KillVideo.Utils`: a project with some useful utility classes used by various other projects in the solution.
* `KillrVideo.Azure`: the deployment setup and configuration for Azure.  This should be your startup project when
  running locally on the Azure SDK emulator.

## KillrVideo: The Movie (err...blog series)
My original plan to do a riveting series of short films detailing the daily struggles of building your first .NET
application on Cassandra fell through due to budget constraints.  (Apparently my insistence that only [Ken
Burns](http://en.wikipedia.org/wiki/Ken_Burns) could do such a weighty topic any justice doesn't really jibe with the
reality of a startup company budget.)  As a result, I've come up with an outline for a regular (and hopefully
long-running) series of blog posts on the subject.

I hope to cover things like data modeling, prepared statements, LINQ, lightweight transactions, user-defined types,
microservices, CORS-enabled uploads to Azure, and more, all through the lens of KillrVideo.  If you're interested,
you'll find them under the [killrvideo tag](/tag/killrvideo/) here on my blog as they become available.
