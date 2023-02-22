import { CarReader, CarBufferWriter as CBW } from '@ipld/car'
import { bytes as byteslib } from 'multiformats'
import { decode as digest } from 'multiformats/hashes/digest'
import * as dagcbor from '@ipld/dag-cbor'
import * as raw from 'multiformats/codecs/raw'
import { sha256 } from 'multiformats/hashes/sha2'
import * as Block from 'multiformats/block'

const { isBinary } = byteslib

const encode = value => {
  if (isBinary(value)) {
    return Block.encode({ value, hasher: sha256, codec: raw })
  }
  return Block.encode({ value, hasher: sha256, codec: dagcbor })
}

const decode = ({ bytes, cid }) => {
  let hasher, codec
  const { code } = cid
  const hashcode = cid.multihash.code || digest(cid.multihash).code

  if (hashcode === 0x12) {
    hasher = sha256
  } else {
    throw new Error('Unsupported hash function: ' + hashcode)
  }

  if (code === 0x71) {
    codec = dagcbor
  } else if (code === 0x55) {
    codec = raw
  } else {
    throw new Error('Unsupported codec: ' + code)
  }

  return Block.decode({ bytes, cid, codec, hasher })
}

class Transaction {
  constructor () {
    this.blocks = []
  }

  static create () {
    return new this()
  }

  static async load (buffer) {
    const reader = await CarReader.fromBytes(buffer)
    const [ root ] = await reader.getRoots()
    const get = cid => reader.get(cid).then(block => decode(block)).then(({ value }) => value )
    return { root, get }
  }

  async write (obj) {
    const block = await encode(obj)
    this.last = block
    this.blocks.push(block)
    return block.cid
  }

  async commit () {
    const cid = this.last.cid
    let size = 0
    let headerSize = CBW.headerLength({ roots: [cid] })
    size += headerSize
    for (const block of this.blocks) {
      size += CBW.blockLength(block)
    }
    const buffer = new Uint8Array(size)
    const writer = await CBW.createWriter(buffer, { headerSize })
    writer.addRoot(cid)
    for (const block of this.blocks) {
      writer.write(block)
    }
    await writer.close()
    return writer.bytes
  }
}

export default Transaction
