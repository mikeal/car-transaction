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
* and you get the de-duplication and diffing properties of git,
* and all the cool graph things you can do with graph databases,
* and all the hash addressed web3 and blockchain stuff works and interops,
* and it's as easy as working with JSON,
  * with inline binary,
  * and you have these hash links that allow you to make little trees,
  * which is how you can get de-duplication,
  * and you can also link to git, bittorrent and ethereum data.
  * you can even link to IPFS files in them,
     or you can encode those IPFS files into the unixfs block format and include them in the transcations.
* and those transactions are encoded in a well known format called CAR (kinda like git-pack files for IPFS),
  * and we just released this open source project that is a [cloud native implementation of IPFS](https://github.com/elastic-ipfs)
  * so if you want to put these on AWS, all you need is a way to store CAR files and hand the URL to Elastic IPFS
    into this cloud native thing, which is pretty much as hard to operate as all the other cloud native things.
  * but if you don't want to run it yourself but you do want your data in the IPFS network
    just DM me on twitter (@mikeal) and we'll figure something out, because we're already running
    this and it's not that hard to hook up more data-sources, we just haven't productized it yet
    we're just running it to keep ALL the NFT's safe and available (god bless the gifs)

And merkle trees are very cool, you can do all kinds of diffing and CRDT structures, but I won't
get into all that yet because, just storing these little trees allow you to build graphs of
incredible complexity. You don't actually need anything but these little trees, which means all the
other things that storing them in an ObjectStore can get you are just **added value**.


Conceptually, you can think of IPLD-over-ObjectStores as being
* IPLD databases,
  * that are key/value stores,
  * with a single index,
    * with a fairly powerful query language,
    * that can implement some interesting privacy and access patterns,
      * cause **hashes.**
  * that can represent an IPLD "network,"
  * an IPLD replication set,

And each instance of an ObjectStore can be all of these things ***simultaneously***.

All these services have a roughly equivalent interface
* S3 (AWS, DigitalOcean, pretty much every cloud provider has a compatible interface),
* R2 (Cloudflare's wonderful new product),
* Also CouchDB, and PouchDB, cause I got roots,
  * and while we're at it, the whole [level](https://github.com/level) ecosystem.

Some of them do A LOT more, but they all have at least these properties:
* You can store a binary value, even if that isn't the default value type.
* You can store that binary value by indexed by a **string key**.
  * Which is a stored index,
  * that, while highly distributed, tends to slow down if you bang on the same keyspace enough.
  * Which is pretty different than some of the databases we're used to. Most open source databases
      are well optimized for a local disc, so they tend to use file writer patterns that allow
      the formation of imbalanced trees so that users can append large amounts of data into the same
      key space.
  * But these big distributed things like S3, they've gotta distributed that keyspace across a bunch of machines,
      all the vendors have been doing this a while, they've done a lot of optimizations, and they do something similar
      but it's optimized for reads instead of writes, because round-trips kill you in a distributed system.
  * But we're working with hashes!
  * We've got perfectly balanced distribution across a keyspace for days!
  * So as the keyspace grows, so does the distribution across whatever load balancing any of these vendors are doing
    which means that **the writes just get faster.** It's beautiful to watch.
  * Something I started telling people to do a while back was move from using
    * `/$hash` to using
    * `/$hash/data` instead.
  * Because S3's performance docs said that performance was only limited "per prefix" which gave an indication into
    how they were optimizing some of their distribution.
  * I pointed about 4K Lambdas at open data encoding for the Filecoin launch, so i was put a few Billion
    keys into an S3 bucket this way, and when i went over a billion keys it got noticably faster. I had
    to ask AWS to raise the cap on our Lambdas (this is way easier now, and is per cloud formation stack)

So we can really blow these things up with IPLD data.

This means that, anything you build on this, is something pretty close to the fastest cloud database offering available
* at whatever price these gigantic companies have driven the price down to commoditizing this market.
* Cloudflare even has free egress w/ R2, and it's cheaper than S3.
* That's bananas! Free reads!
* I've been at this a while, I wrote PouchDB in 2010, which apparently now you could configure to write to R2 and get free reads from a CDN!
* Anyway, you can also write these little graphs into it.

And, if you write a cloud function that derives a **single string key** from the transaction,
you've got a query language in all of these vendors for range queries across the index of that
key that can return queries with or without the values included, with pagination, and a bunch
of libraries that already exist.

And of course, you can configure cloud functions to fire on every write,
* so you can do filtered replication to other buckets and datasources
* which can create new transactions using the same library above
* each of those inherits all the same qualities of this database,
* there's no longer any differentiation between the capabilties of primary stores and indexes.

Because what was looking like a flat database a moment ago is actually an even larger graph
database that can travel like a graph itself, creation mutation, filtration, and combination
across different ObjectStores.

And now we should look back at that string key we're using for the index.

Something I wish more people knew about, is this brilliant library Dominic Tarr wrote
* who also wrote ssb
* and is one of the nicest most genuine human beings on the planet
* who lives on a boat
* and with an excited smile on his face will describe himself as a "cyber hobo."
He wrote 








  









