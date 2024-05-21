import express, { Request, Response } from 'express'
import cors from 'cors'
import cron from 'node-cron'
import morgan from 'morgan'
import bodyParser from 'body-parser'
import expressWinston from 'express-winston'

import PinningRouter from './routes/pinning.js'
import DownloadRouter from './routes/download.js'
import errorHandler from './middleware/error/index.js'
import logger from './utils/logger.js'
import config from './config/index.js'
import { startPinning } from './controller/pinning/helia.js'
import getCIDByStatus from './db/cid/getCIDByStatus.js'
import { CIDStatus } from './types/cidRecord.js'

const app = express()
app.use(morgan('dev'))

app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use((req, res, next) => {
  logger.info(req.originalUrl)
  next()
})
app.use(
  expressWinston.errorLogger({
    winstonInstance: logger,
  }),
)

app.get('/health', (req: Request, res: Response) => {
  res.status(200).send('OK')
})

app.use('/api/v1/pin', PinningRouter)
app.use('/api/v1/download', DownloadRouter)
app.use(errorHandler)

const cidPinningCRON = cron.schedule('*/40 * * * *', async () => {
  try{
    console.log('Running Queued CRON')
    const cooldown = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
    const cidList = await getCIDByStatus(CIDStatus.Queued)
    for (let i = 0; i < cidList.length; i++) {
      if(cidList[i].cid==="bafybeidv7l2r4rr6l4hlmb73i4sllbpu6luisn2f7q3lvvfjr423ajle6m") {
        console.log('Adding '+cidList[i].cid)
        startPinning(cidList[i].cid)
        if (i % 20 === 0) {
          await cooldown(120000)
        }
      }
    }
  } catch(er){
    console.log("here")
  }
})

app.listen(config.port, () => {
  console.log(`Server is running on port ${config.port}.`)
})
