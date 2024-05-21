import path from 'path'
import all from 'it-all'
import drain from 'it-drain'
import { fileURLToPath } from 'url'
import { CID } from 'multiformats/cid'
import { CIDStatus } from '../../types/cidRecord.js'
import { unixfs } from '@helia/unixfs'
import { FileSearchEvent } from '../../config/constants.js'
import updateCIDDetails from '../../db/cid/updateCIDDetails.js'
import helia from './heliainit.js'

import config from '../../config/index.js'
import { FsBlockstore } from 'blockstore-fs'
import { FsDatastore } from 'datastore-fs'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.resolve(path.dirname(__filename), '../../../')

const blockstore = new FsBlockstore(config.ipfs_path, { createIfMissing: true })
const datastore = new FsDatastore(config.ipfs_path)

const calculateDirSize = async(cid: string): Promise<number> => {
  try{
    const fs = unixfs(helia)
    let totalSize = 0
    for await (const entry of fs.ls(CID.parse(cid), {offline: true})) {
      if(entry.type==='directory') {
        totalSize = totalSize + await calculateDirSize(entry.cid.toString())
      } else {
        totalSize = totalSize + Number(entry.size)
      }
    }
    console.log(totalSize)
    console.log('end')
    return totalSize
  } catch(error) {
    return 0
  }
}

export const startPinning = async (cid: string) => {
  if(await helia.pins.isPinned(CID.parse(cid))) {
    return
  }
  try {
    // const helia = await createHelia({ blockstore, datastore })
    console.log('Pinning: ' + cid)
    // console.log(await helia.pins.isPinned(CID.parse(cid)))
    // console.log("size "+await calculateDirSize(cid))
    let lastEvent = ''
    const handleProgress = (evt: any) => {
      if (lastEvent !== 'helia:pin:add') {
        lastEvent = evt.type
      }
    }
    const controller = new AbortController()

    try{
      const pinPromise = all(helia.pins.add(CID.parse(cid), {
          onProgress: handleProgress,
          signal: controller.signal,
        })
      )
    } catch (error) {console.log("error")}

    let kill = false
    let delayCount = 0
    let delayTime = 60000
    while (!kill) {
      await delay(delayTime)
      if (await helia.pins.isPinned(CID.parse(cid))) {
        console.log('done')
        const fs = unixfs(helia)
        const stat = await fs.stat(CID.parse(cid))
        let fileSize = 0
        if(stat.type==='directory') {
          fileSize = await calculateDirSize(cid)
        } else {
          fileSize = Number(stat.fileSize)
        }
        console.log(fileSize)
        console.log('aborting pinned')
        await updateCIDDetails(cid, CIDStatus.Pinned, fileSize)
        // helia.stop()
        // controller.abort('Pinned!')
        kill = true
      }
      if (FileSearchEvent.includes(lastEvent)) {
        console.log('aborting peer not found')
        await updateCIDDetails(cid, CIDStatus.PinningFailed, 0)
        // helia.stop()
        // controller.abort('Peer not found!')
        kill = true
      }
      if (delayCount >= 20) {
        console.log('aborting timeout')
        await updateCIDDetails(cid, CIDStatus.PinningFailed, 0)
        // helia.stop()
        // controller.abort('Timeout!')
        kill = true
      }
      delayTime = delayTime + 300000
      delayCount++
    }
    console.log("return")
  } catch (error) {
    console.log('Error during pinning:');
    return 'err'
  }
}

export const deleteFile = async (cid: string) => {
  helia.blockstore.delete(CID.parse(cid))
}

export const getMultiaddress = async() => {
  const multiaddrs = helia.libp2p.getMultiaddrs()
  return multiaddrs
}
