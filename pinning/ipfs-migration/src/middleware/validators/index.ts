import {
  publicKeySchema,
  getUploadsSchema,
  createTagSchema,
  getTagSchema,
  messageSchema,
  emailSchema,
  verificationTokenSchema,
  web3authEmailVerificationSchema,
} from './user.js'
import { apiKeyName, verifySignerSchema, tweetRechargeSchema, apiKeyIdSchema } from './auth.js'

export default {
  apiKeyName,
  getTagSchema,
  messageSchema,
  createTagSchema,
  verifySignerSchema,
  tweetRechargeSchema,
  apiKeyIdSchema,
  publicKeySchema,
  getUploadsSchema,
  emailSchema,
  verificationTokenSchema,
  web3authEmailVerificationSchema,
}
