---
title: One (Token) Ring to Rule Them All
date: 2016-12-09 08:23:34
updated: 2016-12-09 08:23:34
meta_image: the-ring.png
tags:
- cassandra
footer_note: 
  type: info
  text: >
    This blog post originally appeared on Planet Cassandra in April 2016 before that site was 
    donated to the Apache Foundation and all the content was removed. I've reposted it here to
    preserve the content.
---
For newcomers to Cassandra, all the terminology can be a little overwhelming at first. If you 
have experience with relational databases, some concepts like a "Row" or a "Primary Key" will 
be familiar. But other terms that seem straightforward can often be a little confusing, 
especially when paired with some of the visuals you see when learning about Cassandra.

For example, take a look at this screenshot from the [DataStax OpsCenter][opscenter] management 
tool:

{% asset_img opscenter.png DataStax OpsCenter screenshot showing the dashboard %}

Now answer these questions:

- How many **token rings** are there?
- How many **clusters** are there?
- How many **datacenters** are there?

How about this slide that I use when introducing new users to Cassandra:

<figure>
  {% asset_img multi-dc.png Slide with two DCs showing replication between them %}
  <figcaption>
    <header>Yes, I love 80's movie references</header>
    How many movie references can you fit in a 40 minute talk? I attempted to find out with my 
    Cassandra Summit 2015 presentation, 
    <a href="http://www.slideshare.net/LukeTillman/relational-scaling-and-the-temple-of-gloom-from-cassandra-summit-2015" target="_blank">Relational Scaling and the Temple of Gloom</a>.
    You'll find this slide and a whole bunch more there.
  </figcaption>
</figure>

In case you're wondering, yes, your data actually is "coming to America" in that diagram (pun 
fully intended). Now answer those same questions:

- How many **token rings** are there?
- How many **clusters** are there?
- How many **datacenters** are there?

Did you answer **two** for all the questions in both pictures? If you did, you wouldn't be 
alone, but you also wouldn't be correct either. This is one example where the terminology can 
get a little confusing. Let's walk through those terms, starting with the last one and working 
our way backwards.

## Datacenters
This is the term that most people are familiar with before starting with Cassandra and if you 
answered **two** to the question above then you're not only correct, but well on your way to 
understanding this concept. In the computing world, we tend to think of a datacenter as a 
physical place where our computers reside. The same can be true for a datacenter in Cassandra, 
but it doesn't necessarily have to be true.

In Cassandra, a datacenter is just a *logical* grouping of nodes. This grouping could be based 
on the physical location of your nodes. For example, we might have a `us-east` and a `us-west` 
datacenter. But it could also be based on something other than physical location. For example, 
we might set up a `transactional` and an `analytics` datacenter to run different types of 
workloads, but the nodes for those datacenters might be *physically* in the same location.

So how does Cassandra know which nodes belong to which datacenter? Well that's a little outside 
the scope of this post, but the short answer is a component in Cassandra called a **Snitch**. 
If you want to dig in more, there's a great explanation of the Snitch on 
[DataStax Academy][dsa-snitch].

Most of the time when we're looking at visual depictions of Cassandra like in OpsCenter or my 
slide above, the nodes are being shown grouped by data center.

## Clusters
If you answered two for this question, I don't blame you. After all in English, 
[cluster is defined][cluster-def] as "a group of things or people that are close together" and 
in both of those pictures, it sure looks like there are two separate groups of nodes that are 
close together. But as we just established, most of the time when we see pictures like those 
we're seeing nodes grouped by datacenter.

In Cassandra a cluster refers to all the nodes across all the datacenters that are peers (i.e. 
aware of each other). For both of those images, we've got two datacenters where replication is 
happening between the two of them. So while there are two datacenters, there's only **one** 
cluster depicted in both of those images.

## Token Rings
That leaves us with the question about the number of token rings. I tried to be specific by 
asking about *token* rings instead of just rings. Oftentimes in Cassandra, the term "ring" (by 
itself) is used interchangeably with "cluster" to refer to all the nodes across all the 
datacenters. But when we say token ring we're usually referring to a specific concept in 
Cassandra--data distribution.

If you've been working with Cassandra then you know by now that when you create a table, you 
choose a Primary Key. Part of that Primary Key (usually the first column or sometimes the first 
group of columns) is called the Partition Key. For example, take a look at the 
[`users` table][users-table] from [KillrVideo][killrvideo]:

```
CREATE TABLE users (
  userid uuid,
  firstname text,
  lastname text,
  email text,
  created_date timestamp,
  PRIMARY KEY (userid)
);
```

Here, the partition key is the `userid` column. When we insert data into that table, the value 
for `userid` is used to determine which nodes in Cassandra will actually store the data. 
Choosing a Primary Key is important but what does this have to do with token rings?

Well when Cassandra wants to know where to place data, it takes your Partition Key value and 
runs it through a [consistent hashing][consistent-hashing] function. The hash that comes out of 
this consistent hashing function is sometimes referred to as a token. And in Cassandra, nodes 
in your cluster own ranges (or buckets) of all the possible tokens.

So for example, let's pretend we have a hashing function that outputs tokens from `0` to `99`. 
The distribution of those tokens across all the nodes in an eight node cluster might look 
something like this:

<figure>
  {% asset_img the-ring.png A cluster of nodes with tokens 0-99 distributed across those nodes %}
  <figcaption>
    <header>Great for Illustration, Not for Production</header>
    While you'd never use a hashing function with so few tokens like this in production, it's 
    still a great illustration. You'll find this slide with a lot more detailed explanation in
    the <a href="https://academy.datastax.com/resources/ds201-foundations-apache-cassandra" target="_blank">DS201: Foundations of Apache Cassandra</a>
    course.
  </figcaption>
</figure>

Now this is a really simplified example because of the small range of tokens available. In real 
Cassandra deployments, most people stick with the default [Murmur3 partitioner][murmur3] which 
outputs tokens in the range of <code>-2<sup>63</sup></code> to <code>2<sup>63</sup> - 1</code>, 
but even with the larger range available, the principle is the same.

The total range of available tokens and their distribution around the cluster is often referred 
to as the token ring in Cassandra. And that range of tokens is distributed around the *cluster* 
with each node owning a portion of the token ring. So even if we took our 8 node cluster above 
and logically grouped the nodes across two datacenters, there would still only be one token 
ring.

This can be really hard to wrap your brain around, especially when you see pictures like the 
two above. In those pictures, there are definitely two "rings" in the English sense of the 
word. But in Cassandra terms there's only *one* token ring (and only one "ring" if we're using 
that term interchangeably with "cluster"), even if the nodes are grouped and displayed as two 
datacenters.

## Conclusion
If you're struggling with some of the terminology when getting started with Cassandra, 
hopefully this helps to clear some things up. I highly recommend checking out 
[DS201: Foundations of Apache Cassandra][ds-201] on DataStax Academy for a deeper dive into 
many of these concepts. Things like replication (and replication strategies) are all built on 
top of this foundation, so understanding these concepts can go a long way towards becoming a 
Cassandra guru.


[opscenter]: http://www.datastax.com/products/datastax-enterprise-visual-admin
[dsa-snitch]: https://academy.datastax.com/courses/ds201-foundations-apache-cassandra/distributed-architecture-snitch
[cluster-def]: http://www.merriam-webster.com/dictionary/cluster
[users-table]: https://github.com/KillrVideo/killrvideo-data/blob/master/schema.cql#L9
[killrvideo]: https://killrvideo.github.io
[consistent-hashing]: http://docs.datastax.com/en/cassandra/3.x/cassandra/architecture/archDataDistributeHashing.html
[murmur3]: http://docs.datastax.com/en/cassandra/3.x/cassandra/architecture/archPartitionerM3P.html
[ds-201]: https://academy.datastax.com/resources/ds201-foundations-apache-cassandra