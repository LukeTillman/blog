---
title: How My Favorite Oracle Error Led Me to DataStax and Cassandra
date: 2014-03-18T18:40:32.272Z
---

Putting up a blog is hard.

I can almost hear people's thoughts now, "Why would I ever listen to what this guy has to say when he thinks putting up
a blog is hard?!"  Well, I don't mean hard in the sense of *technically difficult*.  Even for a guy like me whose
Linux-fu is very weak, getting <a href="https://ghost.org" target="_blank">Ghost</a> up and running was pretty dead
simple.

I mean hard in the sense of trying to figure out, what the hell am I going to write about first?  Since I'm still a
total Cassandra noob, trying to share any Cassandra knowledge of value would be pretty dumb.  I went back and forth,
trying to figure out a way to avoid the typical "Yay, I've got a blog" post but still give readers some sort of
introduction to who I am and how I got here.

Ultimately, I settled on this brief tale of how the Oracle error seen here led me to my new gig as a Language Evangelist
at <a href="http://www.datastax.com" target="_blank">DataStax</a>.

<div class="container">
<img src="/content/images/2014/Mar/OracleException.png" alt="Wallet is not Open, indeed" />
<div class="reference">
<strong>This practically begs for a caption contest</strong>
<p>I originally posted it to Facebook with the caption:  "I assume this is the error you start getting when you forget to pay your massive support contract's bill or start contemplating a switch to Postgres."</p>
</div>
</div>

### The Unholy Alliance of Oracle and .NET
I've worked in a lot of Microsoft-centric shops over the years and as a result, managed to pick up a decent amount of
SQL Server experience along the way.  SQL Server was the default database of choice for most of the shops I worked in
and this seems to be a common theme I hear from a lot of .NET developers.  Why is that?  Maybe tooling support, the
comfort of knowing the driver is built into the BCL, the simplicity of a single vendor.  I'd love to hear theories.

But when I started at <a href="http://www.hobsons.com" target="_blank">Hobsons</a> (my most recent gig prior to
DataStax), I walked in to find the project I was working on was the unholiest of alliances:  .NET applications paired
with an Oracle RDBMS.  (If you want to turn your head and spit while you say "Oracle", I don't mind).  Now granted,
"walked in" probably isn't the best description of how that happened, since I did know about it before signing up.  But
ANSI SQL is ANSI SQL, right?  How different could it be?

Five years later I can tell you **very** different.  Putting aside some of the differences between PL/SQL and T-SQL, it
was mostly little things that drove me crazy.  For example, you never knew how much you loved SQL Server's 128 character
limit on object names (like tables, columns, indexes, etc.) until you've abbreviated something into complete gibberish
to fit Oracle's 30 character limit.  Bonus frustration points for trying to do this in SQL Developer, the world's worst
free developer tool, but the only one around once you look at the price tag on something decent like Toad.  Oh
Management Studio, how I missed you.  And that doesn't even touch upon having to install Oracle's ODP.NET driver, the
product that introduced me to the word "deinstall".

### The Screenshot to Launch a thou... err... dozen Memes!
Eventually I knew the time to move on was fast approaching and during my last few months, I became something of a "hired
gun" programmer.  I bounced around the organization from project to project trying to help out wherever I could, doing a
little PHP here, some JavaScript there.  As it turns out, there was more than one project using the unholy alliance of
Oracle and .NET and that turned out to be the project that landed me the gig I have now.

After five years of working with it, I'd seen my share of Oracle errors over the years.  The infamous "Yellow Screen of
Death" with a stack trace including `Oracle.DataAccess` was nothing new.  But one day in January, I got this gem:

> `ORA-28365: wallet is not open`

Now we all know Oracle is a huge vendor looking to make money any way they can, but I never thought they had the
audacity to just drop it into an error message.  Obviously, I thought it was funny enough to take a screenshot.  I
posted it to Facebook, sure that some of my other tech friends would enjoy ridiculing it and that some day, maybe it
could become an internet meme on the order of Jake Weary.

<div class="container">
<iframe width="560" height="315" src="//www.youtube.com/embed/UzyoT4DziQ4?rel=0&start=1261&wmode=transparent" frameborder="0" allowfullscreen></iframe>
<div class="reference">
<strong>The legend of Jake Weary is born</strong>
<p>One of the funniest talks I've seen in a long time, you should probably watch the whole thing if you've got 20 minutes.</p>
</div>
</div>

<br/>
### The Glamorous Life of a Language Evangelist
As luck would have it, one of my former colleagues [Patrick McFadin](https://twitter.com/PatrickMcFadin) saw my Facebook
post and decided to offer me a job on the evangelist team at DataStax.  But just what does a "Language Evangelist" do?
Well, I took a great trip to San Francisco to meet the other members of the evangelist team, [Rebecca
Mills](https://twitter.com/rebccamills) and [Al Tobey](https://twitter.com/AlTobey), that included a lot of
brainstorming.  In theory, I came away with a couple of goals:

1.  To try and teach other people (maybe with a .NET or SQL Server or Oracle background similar to mine) how to use
    Cassandra.
1.  To figure out how to make Cassandra more ubiquitous and easy to use for the .NET community.

In practice, this has meant starting from the bottom, not only by starting to learn as much as I can about Cassandra
itself, but also by starting to dig into [DataStax C# Driver](https://github.com/datastax/csharp-driver).  I don't know
about you, but I find it hard to go out and be excited about something that's a piece of crap, so digging into the
driver to see what kind of state it's in has been particularly important to me.  If drivers interest you, I'm hoping to
have some more details on it on this blog in the future.

So there it is, the story of how a Facebook post of an Oracle exception landed me a job.  In the future, I'm hoping to
add some more useful content around Cassandra, my experiences and frustrations trying to build scalable systems, and
some of the other stuff I manage to absorb while learning from all these smart people.  Leave me some captions for that
Oracle screenshot in the comments below!


