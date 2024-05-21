import express from 'express'
import {
  verify_api_key,
  get_message,
  remove_api_key,
  create_api_key,
  get_user_keys,
  get_profile,
} from '../controller/authentication/index.js'
import validator from '../middleware/validators/index.js'
import validate from '../middleware/validate.js'
import authenticator from '../middleware/authenticator.js'

const router = express.Router()

router.get('/get_auth_message', validate(validator.messageSchema, { query: true }), get_message)

router.get('/get_profile', authenticator(), get_profile)

router.get(
  '/create_api_key',
  validate(validator.apiKeyName, { query: true }),
  create_api_key,
)

router.get('/verify_api_key', authenticator(), verify_api_key)

router.get('/get_user_keys', authenticator(), get_user_keys)

router.delete(
  '/remove_api_key',
  validate(validator.apiKeyIdSchema, { query: true }),
  authenticator(),
  remove_api_key,
)

export default router
