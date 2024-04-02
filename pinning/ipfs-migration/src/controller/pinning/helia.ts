import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createHelia } from 'helia'
import { CID } from 'multiformats/cid'
import all from 'it-all'
import { unixfs } from '@helia/unixfs'
import { FsBlockstore } from 'blockstore-fs'
import { FileSearchEvent } from '../../config/constants.js'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.resolve(path.dirname(__filename), '../../../')

const blockstore = new FsBlockstore(path.resolve(__dirname, 'blocks'), { createIfMissing: true })
const helia = await createHelia({ blockstore })

const add_cid_to_queue = (cid: string) => {
  let cids = []
  try {
    const data = fs.readFileSync(path.resolve(__dirname, 'cid_queue.json'), 'utf-8')
    cids = JSON.parse(data)
  } catch (error) {
    console.error('Error reading cid_queue.json file:', error)
  }

  cids.push(cid)
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
  const index = cids.indexOf(cid)
  if (index > -1) {
    cids.splice(index, 1)
  }
  fs.writeFileSync(path.resolve(__dirname, 'cid_queue.json'), JSON.stringify(cids, null, 2))
}

export const startPinning = async (cid: string) => {
  try {
    add_cid_to_queue(cid)
    const controller = new AbortController()
    let lastEvent = ''
    const handleProgress = (evt: any) => {
      if (lastEvent !== 'helia:pin:add') {
        lastEvent = evt.type
      }
    }
    const pin = all(
      helia.pins.add(CID.parse(cid), {
        onProgress: handleProgress,
        signal: controller.signal,
      }),
    )
    pin.catch((err: any) => {
      console.log()
    })

    await delay(10000)
    if (await helia.pins.isPinned(CID.parse(cid))) {
      const fs = unixfs(helia)
      const stat = await fs.stat(CID.parse(cid))
      const fileSize = Number(stat.fileSize)
      const mtime = stat.mtime
      console.log('aborting cid pinned')
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
        const mtime = stat.mtime
        console.log('aborting pinned')
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
    console.log(error)
    return 'err'
  }
}

export const deleteFile = async (cid: string) => {
  helia.blockstore.delete(CID.parse(cid))
}
