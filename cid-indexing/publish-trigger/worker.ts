import axios from 'axios'
import { parentPort, workerData } from 'worker_threads'

const DHT_ENDPOINT = `http://${process.env.PUBLIC_NODE_HOSTNAME}/api/v0/routing/provide`

const sendToDHT = async (cid: any) => {
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

const main = async () => {
  await sendToDHT(workerData.cid)
  parentPort?.postMessage(`Finished publishing CID: ${workerData.cid}`)
}

main().catch((err) => {
  parentPort?.postMessage(`Error publishing CID: ${workerData.cid}, Message: ${err.message}`)
})
