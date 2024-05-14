import express from 'express'

import { download_car } from '../controller/provide/index.js'

const router = express.Router()

router.get('/car', download_car)

export default router
