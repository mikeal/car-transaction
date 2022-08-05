import Transaction from '../index.js' 

const test = async () => {
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

test()
