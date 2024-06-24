import express from 'express'

import { get_multiaddress } from '../controller/pinning/index.js'
import { add_cid, cid_details, delete_cid } from '../controller/cid/index.js'
import authenticator from '../middleware/authenticator.js'

const router = express.Router()

router.get('/add_cid', authenticator(), add_cid)
router.get('/cid_details', authenticator(), cid_details)
router.delete('/delete_cid', authenticator(), delete_cid)

router.get('/get_multiaddress', get_multiaddress)

export default router
