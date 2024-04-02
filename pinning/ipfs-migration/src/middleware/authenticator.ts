import cjs from 'crypto-js'
import CustomError from './error/customError.js'
import checkApiKey from '../db/user/checkApiKey.js'
import { type NextFunction, type Request, type Response } from 'express'

const verifyAccessToken = async (accessToken: string) => {
  const keyRecord = await checkApiKey(cjs.SHA256(accessToken).toString())
  return keyRecord
}

export default (rules: string[] = [], clauses: string[] = []) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { authorization } = req.headers
      const accessToken = authorization?.split(' ')[1]

      if (!accessToken) {
        throw new CustomError(401, 'Unauthorized: Access token missing.')
      }

      const keyRecord = await verifyAccessToken(accessToken)
      if (!keyRecord) {
        throw new CustomError(401, 'Unauthorized: Invalid access token.')
      }

      req.body.user = keyRecord
      next()
    } catch (error) {
      next(error)
    }
  }
}
