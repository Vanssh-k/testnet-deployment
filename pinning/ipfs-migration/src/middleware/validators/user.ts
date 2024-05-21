import joi from 'joi'

export const publicKeySchema = joi.object({
  publicKey: joi.string().required().messages({
    'any.required': `publicKey not found`,
  }),
})

export const messageSchema = joi.object({
  publicKey: joi.string().required().messages({
    'any.required': `publicKey not found`,
  }),
  encryption: joi.boolean().default(false),
})

export const getUploadsSchema = joi.object({
  lastKey: joi.string().messages({
    'any.required': `lastKey not found`,
  }),
})

export const createTagSchema = joi.object({
  cid: joi.string().required().messages({
    'any.required': `File cid not found`,
  }),
  tag: joi.string().required().messages({
    'any.required': `File tag not found`,
  }),
})

export const getTagSchema = joi.object({
  tag: joi.string().required().messages({
    'any.required': `tag not found`,
  }),
})

export const emailSchema = joi.object({
  email: joi.string().email().messages({
    'any.required': `email not found`,
  }),
})

export const verificationTokenSchema = joi.object({
  verification_token: joi.string().min(20).messages({
    'any.required': `email not found`,
  }),
})

export const web3authEmailVerificationSchema = joi.object({
  idToken: joi.string().required().messages({
    'any.required': `idToken not found`,
  }),
  appPubKey: joi.string().required().messages({
    'any.required': `appPubKey not found`,
  }),
  email: joi.string().required().messages({
    'any.required': `email not found`,
  }),
})
