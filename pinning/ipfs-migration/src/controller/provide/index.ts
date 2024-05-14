import { type NextFunction, type Response, type Request } from 'express'

import { createHelia } from 'helia'
import { car } from '@helia/car'
import { CarWriter } from '@ipld/car'
import { CID } from 'multiformats/cid'
import { unixfs } from '@helia/unixfs'
import config from '../../config/index.js'
import { FsBlockstore } from 'blockstore-fs'
import { Readable } from 'node:stream'

const blockstore = new FsBlockstore(config.ipfs_path, { createIfMissing: true })
const helia = await createHelia({ blockstore })

export const download_car = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cid = CID.parse(req.query.cid as string)
      const c = car(helia)

      const { writer, out } = await CarWriter.create(cid)

      res.setHeader('Content-Type', 'application/car')
      res.setHeader('Content-Disposition', `attachment; filename=${req.query.cid}.car`)

      Readable.from(out).pipe(res)
      await c.export(cid, writer)
    } catch (error) {
      next(error)
    }
}
