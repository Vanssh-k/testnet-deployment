import express, { Request, Response } from 'express'
import cors from 'cors'
import cron from 'node-cron'
import morgan from 'morgan'
import bodyParser from 'body-parser'
import expressWinston from 'express-winston'

import PinningRouter from './routes/pinning.js'
import errorHandler from './middleware/error/index.js'
import logger from './utils/logger.js'
import config from './config/index.js'
import { add_cid_helia } from './controller/pinning/index.js'
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
app.use(errorHandler)

const cidPinningCRON = cron.schedule('*/20 * * * *', async () => {
  console.log('Running Queued CRON')
  const cooldown = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
  const cidList = await getCIDByStatus(CIDStatus.Queued)
  for (let i = 0; i < cidList.length; i++) {
    add_cid_helia(cidList[i].cid)
    if (i % 20 === 0) {
      await cooldown(120000)
    }
  }
})

app.listen(config.port, () => {
  console.log(`Server is running on port ${config.port}.`)
})
