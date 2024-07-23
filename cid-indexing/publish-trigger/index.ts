import fs from 'fs/promises'
import express from 'express'
import axios from 'axios'
import morgan from 'morgan'
import bodyParser from 'body-parser'
import cron from 'node-cron'

const app = express()
const PORT = 10001
const CID_FILE = './cid.txt'
const DHT_ENDPOINT = `http://${process.env.PUBLIC_NODE_HOSTNAME}/api/v0/routing/provide`
const BATCH_SIZE = 100
const COOLDOWN_PERIOD = 5000 // 20 seconds
const SKIP_FIRST_N = 0 // Set this to the number of CIDs you want to skip
const ACCESS_TOKEN = process.env.ROUTE_ACCESS_TOKEN

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

const sendToDHT = async (cid: string) => {
  try {
    console.log(`Publishing: `, cid)
    const response = await axios.post(`${DHT_ENDPOINT}?arg=${cid}&verbose=true`)
    if (response.status === 200) {
      console.log(`Publish Success for CID: ${cid}, Response:`, response.data)
    } else {
      console.error(`Publish Failed for CID: ${cid}, Status: ${response.status}`)
    }
  } catch (err) {
    console.error(`Error while publishing CID: ${cid}, Message: ${err}`)
  }
}

const publishBatch = async (batch: string[]) => {
  await Promise.all(batch.map((cid) => sendToDHT(cid)))
}

const publishRecordsWithCooldown = async () => {
  const cidList = Array.from(cidListSet)
  for (let i = 0; i < cidList.length; i += BATCH_SIZE) {
    const batch: string[] = cidList.slice(i, i + BATCH_SIZE)
    await publishBatch(batch)
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
      await sendToDHT(cid as string)
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
      res.status(200).send('CID added and published')
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
    publishRecordsWithCooldown().then(() => {
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
      await sendToDHT(cid as string)
      res.status(200).send('Republish started')
    } else {
      res.status(404).send('CID not found')
    }
  } else {
    res.status(403).send('Forbidden')
  }
})

cron.schedule('0 0 */2 * *', async () => {
  console.log('CRON job started for batch publish with cooldown')
  await publishRecordsWithCooldown()
})

app.listen(PORT, async () => {
  console.log('Loading CIDs')
  await loadCIDs()
  console.log(`Server is running on port ${PORT}`)
  //  await delay(COOLDOWN_PERIOD);
  //  publishRecordsWithCooldown();
})
