import dbbClient from '../db/ddbClient.js'
import logger from '../../utils/logger.js'
import { UserDetails } from '../../types/user.js'
import { userTable } from '../../config/constants.js'
import CustomError from '../../middleware/error/customError.js'

export default async (usersPublicKey: string): Promise<UserDetails | null> => {
  try {
    const params = {
      TableName: userTable,
      Key: {
        publicKey: usersPublicKey.trim().toLowerCase(),
      },
    }

    const record = await dbbClient.get(params)
    return (record.Item as UserDetails) ?? null
  } catch (error: any) {
    logger.error('User Detail Fetch Error: ' + error.message)
    throw new CustomError(500, `Internal Server Error.`)
  }
}
