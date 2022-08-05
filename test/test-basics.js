import Transaction from '../index.js' 

const test = async () => {
  // start a basic transaction
  // note that write() and commit() are ASYNC
  const t = Transaction.create()

  const sub = await t.write({ some: 'data' })
  await t.write({ sub })
  const buffer = await t.commit()

  // read a transaction
  // note that load() and get() are SYNC
  const { root, get } = await Transaction.load(buffer)
  // root is a cid
  const { some } = get(root)
  // get retrieves the block and decodes it
  if (some !== 'data') throw new Error('data error')
}

test()
