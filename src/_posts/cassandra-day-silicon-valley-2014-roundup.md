---
title: Cassandra Day Silicon Valley 2014 Roundup
date: 2014-04-09T15:09:53.939Z
---
I've been spending an awful lot of my time lately digging through [DataStax C#
Driver](https://github.com/datastax/csharp-driver) for Cassandra, trying to help our team formulate a plan to make it
better.  To that end, I headed out to San Jose last week to meet up with the newest addition to our drivers team, [Jorge
Bay Gondra](https://twitter.com/jorgebg), who's going to be doing some great things not only with our C# driver, but
hopefully with our [NodeJS](https://github.com/jorgebay/node-cassandra-cql) story as well.  Being down in the weeds of
the CQL binary protocol and .NET socket programming has been interesting, but being down at that level, it's hard to see
the forest for the trees when it comes to what's going on with Cassandra.

Luckily, I was able to get some of that bigger picture on Monday.  I had a great time attending [Cassandra Day Silicon
Valley 2014](http://cassandradaysiliconvalley2014.sched.org/) on the campus of eBay/PayPal.  There were a lot of great
presentations and all the talks were recorded (link coming shortly).  A couple of quick highlights that I wanted to
share:

* The guys at [Kiji](http://www.kiji.org/) are in the process of adding Cassandra support, with a beta coming in the
  next few weeks.
* The next major release of Cassandra (2.1) is going to have some interesting new features (for example, [user defined
  types](http://www.datastax.com/dev/blog/cql-in-2-1)), but it's also got a TON of fixes and performance improvements
  (for example, counters--a long time pain point).
* The push to move things off the Java heap in Cassandra is alive and well and it's very possible 2.1 will see memtables
  (and maybe much more) move off the heap.
* If you're using [Graphite](https://github.com/graphite-project/graphite-web) to collect, store, and view metrics,
  check out [Cyanite](https://github.com/pyr/cyanite), which provides a Cassandra-based storage backend for all those
  metrics.

Perhaps my favorite part of the day though was the Q&A session at the end.  Yes, there were some good questions asked
(with a free trip to [Cassandra Summit 2014](http://www.datastax.com/cassandrasummit14) available to anyone who could
stump the experts), but I think my fellow evangelist [Al Tobey](https://twitter.com/AlTobey) gets the award for "quote
of the event" during that session.  In response to a question about the most common mistakes made when getting started
with Cassandra, Al gave us the following words of wisdom:

> "SATA is only one letter away from Satan." - Al Tobey

In other words, the disks you use are important.  Overall, a great event and I'm looking forward to the videos to be
able to go back and watch some of the presentations I missed.

