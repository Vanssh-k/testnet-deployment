import { getMessage, getUserKeys, createApiKey, revokeApiKey } from './helper/authHelper.js'
import { NextFunction, Response, Request } from 'express'

// Get message - user will sign this message to verify himself
export const get_message = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const message = await getMessage(req.query.publicKey as string, req.query.encryption as string)
    res.status(200).json(message)
  } catch (error) {
    next(error)
  }
}

// Return data usage if signature authentic
export const get_profile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const record = req.body.user
    res.status(200).json({
      publicKey: record.publicKey,
      dataLimit: record.dataLimit,
      dataUsed: record.dataUsed,
      email: record.email,
    })
  } catch (error) {
    next(error)
  }
}

export const create_api_key = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const keyName = req.query.keyName as string
    const apiKey = await createApiKey(req.query.publicKey as string, req.query.signature as string, keyName)
    res.status(200).json(apiKey)
  } catch (error) {
    next(error)
  }
}

export const get_user_keys = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getUserKeys(req.body.user.publicKey)
    res.status(200).json(data)
  } catch (error) {
    next(error)
  }
}

export const verify_api_key = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const record = req.body.user
    res.status(200).json({
      publicKey: record.publicKey,
      dataLimit: record.dataLimit,
      dataUsed: record.dataUsed,
      email: record.email,
    })
  } catch (error) {
    next(error)
  }
}

export const remove_api_key = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await revokeApiKey(req.query.keyId as string, req.body.publicKey)
    res.status(200).send({ data: 'Success' })
  } catch (error) {
    next(error)
  }
}
