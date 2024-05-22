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
import { apiKey, verifySignerSchema, apiKeyIdSchema } from './auth.js'

export default {
  apiKey,
  getTagSchema,
  messageSchema,
  createTagSchema,
  verifySignerSchema,
  apiKeyIdSchema,
  publicKeySchema,
  getUploadsSchema,
  emailSchema,
  verificationTokenSchema,
  web3authEmailVerificationSchema,
}
