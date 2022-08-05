# car-transaction

IPLD transaction as CAR buffer

## Usage

```js
import Transaction from 'car-transaction' 

const run = async () => {
  // start a basic transaction
  const t = Transaction.create()

  const subCID = await t.write({ some: 'data' })
  await t.write({ sub: subCID })
  const buffer = await t.commit()

  // read a transaction
  const { root, get } = await Transaction.load(buffer)
  // root is a cid
  const { sub } = await get(root)
  const { some } = await get(sub)
  // get retrieves the block and decodes it
  if (some !== 'data') throw new Error('data error')
}

run()
```

# Guide to IPLD-over-ObjectStores (S3, R2, etc)

This is how we build a decentralized web of all web3 application
data on top of widely available and competitively priced
cloud object stores.

IPLD is the data structure layer beneath IPFS. It works in IPFS
protocols and outside them, on disc, in memory, etc.

So you can build these little merkle trees with the library above that
* are encoded in `dag-cbor`, which is fairly efficient format,
* and all the hash addressed web3 and blockchain stuff works and interops,
* and it's as easy as working with JSON,
  * with inline binary,
  * and you have these hash links that allow you to make little trees,
  * which is how you can get de-duplication and diffing properties of git, cause it's all merkle graphs,
  * and all the cool graph things you can do with graph databases,
  * and you can also link to data in git, bittorrent, ETH, Bitcoin, etc.
  * you can link to IPFS files,
    * or you can encode those IPFS files into the unixfs block format and include them in the transcations.
* and those transactions are encoded in a well known format called CAR (kinda like git-pack files for IPFS),
  * and we just released this open source project that is a [cloud native implementation of IPFS](https://github.com/elastic-ipfs)
  * so all you need is a way to store CAR files and hand the URL to Elastic IPFS
    * which is a cloud native thing and pretty much as hard to operate as all the other cloud native things.
  * but if you don't want to run it yourself, and you really want your data in the public IPFS network
    just DM me on twitter (@mikeal) and we'll figure something out, because we're already running
    this and it's not that hard to hook up more data-sources, we just haven't productized it yet,
    we're just running it to keep ALL the NFT's safe and available (god bless the gifs)

And merkle trees are very cool, you can do all kinds of diffing and CRDT structures, but I won't
get into all that yet because, just storing these little trees allow you to build graphs of
incredible complexity and if we start there we won't see the basic stuff we also get from leveraging
these ObjectStores to store them.

Conceptually, you can think of IPLD-over-ObjectStores as being
* IPLD databases,
  * that are key/value stores,
  * with a single index,
    * with a fairly powerful query language,
    * that can implement some interesting privacy and access patterns
      * cause **hashes,**
  * that could represent an IPLD "network,"
    * which you can decide to keep open, closed, limited access, whatever.
  * and they can also represent an IPLD replication set,
    * that could be a filter
    * or an index
    * that can be streaming to another index
      * which has all the same properties as the database we started with
        recursively until you stop extending this particular network branch
        and that's how you know you're working with a graph.

And each instance of an ObjectStore can be all of these things ***simultaneously***.
These features aren't mutually exclusive, they're combinatory, as long as you follow
a few simple patterns.

All these services have a roughly equivalent interface
* S3 (AWS, DigitalOcean, pretty much every cloud provider has a compatible interface),
* R2 (Cloudflare's wonderful new product),
* Also CouchDB, and PouchDB, cause I got roots,
  * and while we're at it, the whole [level](https://github.com/level) ecosystem.

Some of them do A LOT more, but they all have at least these properties:
* You can store a binary value, even if that isn't the default value type.
* You can store that binary value by a **string key**.
  * Which forms a stored index,
    * that you can perform range queries against,
  * that, while highly distributed, tends to slow down if you bang on the same keyspace enough.
  * Which is pretty different than some of the databases we're used to. Most open source databases
      have a local disc optimization in the file writer that, when you group data together like this, will
      get bulked together.
  * But these big distributed things like S3, they keyspace is distributed across a bunch of machines,
      so when they do a something similar on the read side, giving the keyspace locality, you lose the
      distribution of your write across the whole database a bit.
  * But we're working with hashes!
  * We've got perfectly balanced distribution across a keyspace for days!
  * So if we key things by hash prefixes we'll always evenly distribute across the keyspace.
  * As the keyspace grows, the distribution of writes is even across whatever load balancing any of these vendors are doing
    which means that **the writes just get faster the bigger it gets.** It's beautiful to watch.
  * Something I started telling people to do a while back was move from using
    * `/$hash` to using
    * `/$hash/data` for their keys in S3.
  * Because S3's performance docs said that performance was only limited "per prefix" which gave an indication into
    how they were optimizing some of this by looking at the '/' as a key prefix.
  * I pointed about 4K Lambdas at open data encoding for the Filecoin launch, so i put a few Billion
    keys into an S3 bucket this way, and when i went over a billion keys it got noticably faster. I had
    to ask AWS to raise the cap on our Lambdas (this is way easier now, and is per cloud formation stack)

So we can really blow these things up with IPLD data.

This means that, anything you build on this, is something pretty close to the fastest cloud database offering available
* at whatever price these gigantic companies have driven the price down to in a rapidly commoditizing market.
  * that is now competing with blockchains like Filecoin
    * which you can also store those CAR files in natively.
* Cloudflare even has free egress w/ R2, and it's cheaper than S3.
* That's bananas! Free reads!
* I've been at this a while, I wrote PouchDB in 2010, which apparently you could now configure to write to R2 and get free reads from a CDN!
* Anyway, you can also write these little graphs into it.

And, if you write a cloud function that derive a **single string key** from the transaction,
you've got a query language in all of these vendors for range queries across the index of that
key 
* that can return queries with or without the values included,
* with pagination, 
* and a bunch client of libraries that already exist,
* and HTTP caching infra already built for them.

And of course, you can configure cloud functions to fire on every write,
* so you can do filtered replication to other buckets and datasources
* which can create new transactions using the same library above
* each of which will inherit all the same replication abilities of this database,
* so there's no longer any differentiation between the capabilties of primary stores and indexes.
* because we're not building flat databasea anymore,
  * this is much more useful, and way cooler,
  * we're just writing branches of gigantic graphs to little (or huge!) transaction tables,
  * so don't think of it as a KV store, the key AND THE VALUE are in or derived from the value data,
  * and that produces single index over those transaction,
    * and if we want to write multiple indexes for the same data we have two choices,
      * store the data again in two buckets (potentially filtered if we don't need everything in the transaction)
      * or take the hash of the transaction (CAR CID) and put that at the end of the key.
      * which gives you the choice between paying for a copy of the data or eating the performance hit of a
        secondary ready when you query the indexes you don't write additinoal copies to.
 * and since all this data can easily be put on IPFS,
   * all the graphs you write can be read as a single graph by anyone who traverses it
   * and their graphs can link to yours
   * and vice versa
   * and that's why we've been calling it Web3 this whole time.
* and it's not a blockchain
  * until you put a consensus layer over it.
  * so if you need this to be a blockchain thing,
  * or you really need this NOT to be a blockchain thing,
  * it's whatever one you want it to be.

Because what was looking like a flat database a moment ago is actually 
* an even larger graph database that can travel like a graph itself, 
* mutate into other states,
* filter out data,
* combine data from different sources,

And it can do this across
* different ObjectStores
  * in the same data center,
  * the same cloud provider,
  * different providers,
  * p2p networks,
  * that's entirely up to you.

And that string key we're using for the index.

Something I wish more people knew about, is this brilliant library Dominic Tarr wrote
* who also wrote ssb
* and is one of the nicest most genuine human beings on the planet
* who lives on a boat
* and with an excited smile on his face will describe himself as a "cyber hobo."

He wrote this library that implements the typewise/bytewise encoder/decoder in regular
strings. So you can use it for the keys on these ObjectStores and then use the ListObject
interfaces to write queries against it.

You might be used to modelling you bucket keys to leverage the "file heirachy" in S3.
These products tend to model this as a feature of '/' to trigger your familiarity with
file directory heirarchy, which are more widely understood that something like typewise/bytewise.

What you get with these tools is **nested sorting** within any element of the keyspace
in an arbitrary depth. First, just read the rules about [which JSON types get ordered where](https://github.com/deanlandolt/bytewise#order-of-supported-structures). Now, notice that sorting within objects and arrays enables the nesting of keys.

So you can do something like 

```js
[ null, [ 'a' ] ]
[ 'a' , [ 'a' ] ]
[ 'a' , [ 'b', [ 'and on and on' ] ] ]
```

And since, when you're working with these little graphs, they all have hash addresses, you get to do some
cool things within these nested sorting structures.
* Like if you want to make sure any part of it is evenly distributed, use a hash the describes the item
  potency of the index.
* And if you have some security or privacy context you're enforcing over reading the index, you put
  the hash of something they would need to know into the nested sorting structure, which saves you
  from maintaining a secondary index of permissions
  * cause cryptography is really cool like that.


And there's more, but I'm tired of typing, and I think that the next set of things I write about this will
include examples of cool things others are doing with what is already here. Happy hacking!

Much love to all the old Node.js database hackers who used to bounce around Oakland and Berlin and
a hundred JavaScript conferences in the 2010's. I miss ya'll and I forget how much cool stuff we figured out
that we haven't shared with everyone who didn't read that code.




  









