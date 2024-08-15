import fs from 'fs/promises'
import express from 'express'
import axios from 'axios'
import morgan from 'morgan'
import bodyParser from 'body-parser'
import cron from 'node-cron'
import { Worker } from 'worker_threads'
import os from 'os'
import path from 'path'
import { fileURLToPath } from 'url'

const app = express()
const PORT = 10001
const CID_FILE = './cid.txt'
const SKIP_FIRST_N = 0 // Set this to the number of CIDs you want to skip
const ACCESS_TOKEN = process.env.ROUTE_ACCESS_TOKEN
const MAX_WORKERS = Math.max(1, Math.min(os.cpus().length - 1, 6))
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const workerPath = path.resolve(__dirname, process.env.NODE_ENV === 'production' ? './dist/worker.js' : './worker.js')

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(morgan('dev'))

let cidListSet: Set<string> = new Set()

const loadCIDs = async () => {
  try {
    const data = await fs.readFile(CID_FILE, 'utf-8')
    let cidList = data.split('\n').filter((line) => line.trim() !== '')

    // Skip the first N CIDs
    cidList = cidList.slice(SKIP_FIRST_N)

    cidListSet = new Set(cidList)
  } catch (err) {
    console.error(`Error loading CIDs from file: ${err}`)
  }
}

const appendCIDToFile = async (cid: string) => {
  try {
    await fs.appendFile(CID_FILE, `${cid}\n`)
    console.log(`CID ${cid} saved to file.`)
  } catch (err) {
    console.error(`Error saving CID to file: ${err}`)
  }
}

const runWorker = (cid: string) => {
  return new Promise((resolve, reject) => {
    const worker = new Worker(workerPath, {
      workerData: { cid },
    })

    worker.on('message', resolve)
    worker.on('error', (error) => {
      console.error(`Worker error for CID ${cid}:`, error)
      resolve(error)
    })
  })
}

const publishRecords = async () => {
  const BATCH_SIZE = 1000
  const cidList = Array.from(cidListSet)
  for (let i = 0; i < cidList.length; i += BATCH_SIZE) {
    console.log('-------------------- cid batch no: ', i, '--------------------')
    const batch = cidList.slice(i, i + BATCH_SIZE)
    let promises: Promise<any>[] = []
    for (const cid of batch) {
      if (promises.length >= MAX_WORKERS) {
        await Promise.race(promises)
        promises = promises.filter((p: any) => !p.isResolved)
      }
      const promise: any = runWorker(cid)
      promises.push(promise)

      promise.isResolved = false
      promise.finally(() => {
        promise.isResolved = true
      })
    }
    await Promise.all(promises)
  }
}

app.get('/api/add_cid_record', async (req, res) => {
  const accessToken = req.headers['authorization']?.split(' ')[1]
  if (accessToken === ACCESS_TOKEN) {
    const cid = req.query.cid
    if (!cid) {
      res.status(403).send('Forbidden')
    }
    if (!cidListSet.has(cid as string)) {
      cidListSet.add(cid as string)
      await appendCIDToFile(cid as string)
      await runWorker(cid as string)
      res.status(200).send('CID added and published')
    } else {
      res.status(200).send('CID already exists')
    }
  } else {
    res.status(403).send('Forbidden')
  }
})

app.get('/api/add_cid_record_without_publish', async (req, res) => {
  const accessToken = req.headers['authorization']?.split(' ')[1]
  if (accessToken === ACCESS_TOKEN) {
    const cid = req.query.cid
    if (!cidListSet.has(cid as string)) {
      cidListSet.add(cid as string)
      await appendCIDToFile(cid as string)
      res.status(200).send('CID added')
    } else {
      res.status(200).send('CID already exists')
    }
  } else {
    res.status(403).send('Forbidden')
  }
})

app.get('/api/manual_publish_all_cid', async (req, res) => {
  const accessToken = req.headers['authorization']?.split(' ')[1]
  if (accessToken === ACCESS_TOKEN) {
    publishRecords().then(() => {
      res.status(200).send('Publishing started with cooldown')
    })
  } else {
    res.status(403).send('Forbidden')
  }
})

app.get('/api/republish_cid', async (req, res) => {
  const accessToken = req.headers['authorization']?.split(' ')[1]
  if (accessToken === ACCESS_TOKEN) {
    const cid = req.query.cid
    if (cidListSet.has(cid as string)) {
      await runWorker(cid as string)
      res.status(200).send('Republish started')
    } else {
      res.status(404).send('CID not found')
    }
  } else {
    res.status(403).send('Forbidden')
  }
})

cron.schedule('0 0 * * *', async () => {
  console.log('CRON job started for batch publish with cooldown')
  await publishRecords()
})

app.listen(PORT, async () => {
  console.log('Loading CIDs')
  await loadCIDs()
  console.log(`Server is running on port ${PORT}`)
  // publishRecords()
})
