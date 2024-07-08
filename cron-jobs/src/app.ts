import cron from 'node-cron'
import config from './config/index.js'
import { filecoinFirstURL } from './config/constants.js'
import getPendingCIDList from './db/getPendingCIDList.js'
import updateDealStatus from './db/updateDealStatus.js'

const sendForDealCRON = cron.schedule('0 */8 * * *', async() => {
  console.log('Running send to deal making cron')
  const cidList = await getPendingCIDList()

  for(let i=0; i<cidList.length; i++) {
    console.log("Sending"+cidList[i])
    const response = await fetch(`${filecoinFirstURL}/api/v1/pin/add_cid?cid=${cidList[i].cid}`, {
      method: 'GET',
        headers: {
          Authorization: `Bearer ${config.filecoin_first_api_key}`,
        }
    })
    if (response.ok) {
      await updateDealStatus(cidList[i]['id'])
    }
  }
})

process.stdin.resume()
