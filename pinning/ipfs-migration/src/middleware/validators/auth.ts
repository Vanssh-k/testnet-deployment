import joi from 'joi'

export const apiKeyName = joi.object({
  keyName: joi.string().min(1).max(100).default('key'),
})

export const verifySignerSchema = joi.object({
  signedMessage: joi.string().required().messages({
    'any.required': `signedMessage not found`,
  }),
  publicKey: joi.string().required().messages({
    'any.required': `publicKey not found`,
  }),
  keyName: joi.string().min(1).max(100),
})

export const tweetRechargeSchema = joi.object({
  twitterID: joi.string().required().messages({
    'any.required': `twitterID not found`,
  }),
  publicKey: joi.string().required().messages({
    'any.required': `publicKey not found`,
  }),
})

export const apiKeyIdSchema = joi.object({
  keyId: joi.string().max(100).required().messages({
    'any.required': `keyId not found`,
  }),
})
