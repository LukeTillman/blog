---
title: "Introducing CqlPoco: an object mapper for Cassandra and .NET"
date: 2014-08-11T18:17:30.880Z
tags:
- cassandra
- c#
- cqlpoco
---
After spending some time writing the [KillrVideo](https://github.com/LukeTillman/killrvideo-csharp) app and [ASP.NET
Identity](https://github.com/joshuadeanhall/AspNet.Identity.Cassandra) persistence for Cassandra, one thing became
glaringly obvious to me--I really missed having a micro-ORM.  I spent a lot of time writing boilerplate mapping code,
taking rows returned from Cassandra and mapping them to POCOs in my code.  When interacting with a relational database
in .NET we have a number of packages available to handle this for us.  They span the gamut from the more heavyweight,
full-fledged ORMs (Entity Framework, NHibernate), to the more lightweight micro-ORMs
([Dapper.NET](https://github.com/StackExchange/dapper-dot-net), [PetaPoco/NPoco](https://github.com/schotime/NPoco),
[Massive](https://github.com/robconery/massive)).

I personally have always been more of a fan of the micro-ORM approach and so I set out to create a project that would
allow me to eliminate a lot of the boilerplate mapping code in my applications, but still allow me to write vanilla CQL
queries when interacting with Cassandra.  The result:  [CqlPoco](https://github.com/LukeTillman/cqlpoco), an object
mapper for Cassandra and .NET.

## A simple query example
All right, on with the code samples.  Here's what a simple query might look like with CqlPoco.

```csharp
public class User
{
    public Guid UserId { get; set; }
    public string Name { get; set; }
}

// Get a list of users from Cassandra with CqlPoco
List<User> users = client.Fetch<User>("SELECT userid, name FROM users");
```
This works by mapping the column names in your CQL statement to the property names on the `User` class (using a
case-insensitive match).  Simple query scenarios like this are possible without doing any mapping configuration.

## Configuring CqlPoco
After looking at the last example, you might be asking yourself what the `client` object is and where it came from.  The
main interface for interacting with CqlPoco is the `ICqlClient` interface and getting one is pretty easy.  CqlPoco uses
the [DataStax .NET driver](https://github.com/datastax/csharp-driver) for Apache Cassandra to execute queries.  When you
install CqlPoco via [the NuGet package](https://www.nuget.org/packages/CqlPoco/), the driver will be installed as well.
You'll want to configure CqlPoco at the same time as you configure the driver.  Here's an example of what that might
look like.

```csharp
// Use the Cluster builder from the DataStax driver to connect 
// to your Cassandra cluster
Cluster cluster = Cluster.Builder().AddContactPoint("127.0.0.1").Build();
ISession session = cluster.Connect("mykeyspace");

// Now configure CqlPoco by providing your ISesssion instance
ICqlClient client = CqlClientConfiguration.ForSession(session).BuildCqlClient();
```
This instance of `ICqlClient` is thread-safe and should be saved and reused all over your application.  For example, you
might register is as a Singleton in your IoC container of choice.

## Defining Mappings
For more complex scenarios than the simple query above, you'll want to have more control over how Cassandra rows are
mapped to your POCOs.  You have two options for how to define mappings with CqlPoco: decorate your POCOs with attributes
or define the mappings in a separate class using a fluent interface.

#### Attribute Example
```csharp
[TableName("users")]
[PrimaryKey("userid")]
public class User
{
    [Column("userid")]
    public Guid Id { get; set; }
    public string Name { get; set; }
}
```
#### Fluent Interface Example
```csharp
public class MyMappings : Mappings
{
    public MyMappings()
    {
        // Just define mappings in the constructor of your class that
        // inherits from Mappings
        For<User>().TableName("users")
                   .PrimaryKey("userid")
                   .Column(u => u.Id, cm => cm.WithName("userid"));
    }
}
```
If you decide to go the fluent interface route, you can tell CqlPoco about your mappings when you configure it.  For
example:
```csharp
ICqlClient client = CqlClientConfiguration.ForSession(session)
                                          .UseMappings<MyMappings>()
                                          .BuildCqlClient();
```

## More API Examples
The `ICqlClient` interface has a lot of other methods covering Inserts, Updates, Deletes, and more.  And all of the
methods come in both synchronous and `async` flavors.  Here's a quick sampling of some of what's available.

#### Auto-generate SELECT and FROM on all query methods
All of the query methods will auto-generate the `SELECT` and `FROM` parts of your query if omitted, allowing you to just
provide the predicate (or omit it completely).
```csharp
// All query methods (Fetch, Single, First, etc.) will auto generate the SELECT and FROM
// clauses if not specified
List<User> users = client.Fetch<User>();
List<User> users = client.Fetch<User>("FROM users WHERE name = ?", someName);
List<User> users = client.Fetch<User>("WHERE name = ?", someName);
```

#### Getting one record
There are query methods for retrieving a single record that behave identically to the LINQ methods you're used to using
in other parts of the framework.
```csharp
// Single and SingleOrDefault for getting a single record
var user = client.Single<User>("WHERE userid = ?", userId);
var user = client.SingleOrDefault<User>("WHERE userid = ?", userId);

// First and FirstOrDefault for getting first record
var user = client.First<User>("SELECT * FROM users");
var user = client.FirstOrDefault<User>("SELECT * FROM users");
```

#### Flattening when selecting a single column
Sometimes you want to retrieve just a single column without creating a POCO with a property for holding that data.  For
this case, CqlPoco supports "flattening" the single column to just the column value's type.
```csharp
// Fetch just a single column and return as the column value's type
Guid userId = client.First<Guid>("SELECT userid FROM users");
List<string> names = client.Fetch<string>("SELECT name FROM users");
```

#### Insert
Inserting a POCO is pretty straightforward and CqlPoco will generate the CQL statement for you.
```csharp
// Insert a POCO
var newUser = new User { UserId = Guid.NewGuid(), Name = "SomeNewUser" };
client.Insert(newUser);
```

#### Update
You can update using a POCO and the whole CQL statement will be generated for you, or you can update with CQL of your
own and CqlPoco will automatically prepend your CQL with `UPDATE tablename` as appropriate for your POCO.

```csharp
// Update with POCO
someUser.Name = "A new name!";
client.Update(someUser);

// Update with CQL (will prepend table name to CQL)
client.Update<User>("SET name = ? WHERE userid = ?", someNewName, userId);
```

#### Delete
You can delete by providing a POCO and the whole CQL statement will be generated for you, or you delete with CQL of your
own and CqlPoco will automatically prepend your CQL with `DELETE FROM tablename` as appropriate for your POCO.

```csharp
// Delete with POCO
client.Delete(someUser);

// Delete with CQL (will prepend table name to CQL)
client.Delete<User>("WHERE userid = ?", userId);
```

#### Atomic Batches
Atomic batches are frequently used in Cassandra when you want to duplicate/denormalize your data on write.  All of write
methods discussed above (Insert, Update, Delete) are available from a batch as well.

```csharp
// Create a new batch
ICqlBatch batch = cqlClient.CreateBatch();

var newUser = new User { UserId = Guid.NewGuid(), Name = "SomeNewUser" };

// Add some commands to the batch using the same API
batch.Insert(newUser);
batch.Delete("WHERE userid = ?", userId);

// Now execute the batch
cqlClient.Execute(batch);
```

## The Future
This is a pretty good round-up of the 1.0 API for CqlPoco and I'm hoping that it will eliminate a lot of boilerplate
code for .NET developers when interacting with Cassandra.  But there's much more to be done.  Things like schema
syncing/generation from POCOs, support for polymorphism, and more are definitely candidates for future releases (the
great [cqlengine](https://github.com/cqlengine/cqlengine) project for Python has been and will continue to be an
inspiration for future features).

Let me know if you're using CqlPoco, what your pain points still are, and how we can make it better by sending me a
message on [Twitter](https://twitter.com/LukeTillman) or by getting involved on
[GitHub](https://github.com/LukeTillman/cqlpoco).  The code is available under the Apache 2 license and I'm happily
accepting PRs.
