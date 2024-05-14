import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createHelia } from 'helia'
import config from '../../config/index.js'
import { CID } from 'multiformats/cid'
import all from 'it-all'
import peerIdJson from './peerId.js'
import { createLibp2p } from 'libp2p'
import { CIDStatus } from '../../types/cidRecord.js'
import { unixfs } from '@helia/unixfs'
import { FsBlockstore } from 'blockstore-fs'
import { FileSearchEvent } from '../../config/constants.js'
import updateCIDDetails from '../../db/cid/updateCIDDetails.js'
import { createFromJSON } from '@libp2p/peer-id-factory'
import { unmarshalPrivateKey } from '@libp2p/crypto/keys'
import { tcp } from '@libp2p/tcp'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.resolve(path.dirname(__filename), '../../../')

const blockstore = new FsBlockstore(config.ipfs_path, { createIfMissing: true })

const peerId = await createFromJSON(peerIdJson)
const libp2p = await createLibp2p({
  peerId: peerId,
  privateKey: await unmarshalPrivateKey(peerId.privateKey!),
  addresses: {
    listen: [
      '/ip4/0.0.0.0/tcp/0'
    ]
  },
  transports: [
    tcp()
  ]
})
const helia = await createHelia({ blockstore, libp2p })
console.log("multi:"+helia.libp2p.getMultiaddrs())

const add_cid_to_queue = (cid: string) => {
  let cids = []
  try {
    const data = fs.readFileSync(path.resolve(__dirname, 'cid_queue.json'), 'utf-8')
    cids = JSON.parse(data)
  } catch (error) {
    console.error('Error reading cid_queue.json file:', error)
  }
  console.log('Queue Before: '+ cids)
  if(!cid.includes(cid)) {
    cids.push(cid)
  }
  console.log('Queue After: '+ cids)
  fs.writeFileSync(path.resolve(__dirname, 'cid_queue.json'), JSON.stringify(cids, null, 2))
}

const remove_cid_from_queue = (cid: string) => {
  let cids = []
  try {
    const data = fs.readFileSync(path.resolve(__dirname, 'cid_queue.json'), 'utf-8')
    cids = JSON.parse(data)
  } catch (error) {
    console.error('Error reading cid_queue.json file:', error)
  }
  console.log('Remove Before: '+ cids)
  const index = cids.indexOf(cid)
  if (index > -1) {
    cids.splice(index, 1)
  }
  console.log('Remove After: '+ cids)
  fs.writeFileSync(path.resolve(__dirname, 'cid_queue.json'), JSON.stringify(cids, null, 2))
}

export const startPinning = async (cid: string) => {
  const controller = new AbortController()
  try {
    console.log('Pinning: ' + cid)
    console.log(CID.parse(cid))
    add_cid_to_queue(cid)
    
    let lastEvent = ''
    const handleProgress = (evt: any) => {
      if (lastEvent !== 'helia:pin:add') {
        lastEvent = evt.type
      }
    }

    const pinPromise = all(
      helia.pins.add(CID.parse(cid), {
        onProgress: handleProgress,
        signal: controller.signal,
      }),
    )
    pinPromise.catch((err: any) => {
      console.log('catch'+err)
    })

    await delay(10000)
    if (await helia.pins.isPinned(CID.parse(cid))) {
      const fs = unixfs(helia)
      const stat = await fs.stat(CID.parse(cid))
      const fileSize = Number(stat.fileSize)
      console.log('aborting cid pinned')
      await updateCIDDetails(cid, CIDStatus.Pinned, fileSize)
      remove_cid_from_queue(cid)
      controller.abort('Pinned!')
    }

    let kill = false
    let delayCount = 0
    while (!kill) {
      await delay(300000)
      if (await helia.pins.isPinned(CID.parse(cid))) {
        const fs = unixfs(helia)
        const stat = await fs.stat(CID.parse(cid))
        const fileSize = Number(stat.fileSize)
        console.log('aborting pinned')
        await updateCIDDetails(cid, CIDStatus.Pinned, fileSize)
        remove_cid_from_queue(cid)
        controller.abort('Pinned!')
        kill = true
      }
      if (FileSearchEvent.includes(lastEvent)) {
        console.log('aborting peer not found')
        remove_cid_from_queue(cid)
        controller.abort('Peer not found!')
        kill = true
      }
      if (delayCount >= 1) {
        console.log('aborting timeout')
        remove_cid_from_queue(cid)
        controller.abort('Timeout!')
        kill = true
      }
      delayCount++
    }
  } catch (error) {
    console.log('Error during pinning:', error);
    // remove_cid_from_queue(cid);
    return 'err'
  } finally {
    return 'err'
  }
}

export const deleteFile = async (cid: string) => {
  helia.blockstore.delete(CID.parse(cid))
}

export const getMultiaddress = () => {
  const multiaddrs = helia.libp2p.getMultiaddrs()
  return multiaddrs
}
