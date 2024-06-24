import dbbClient from '../db/ddbClient.js'
import logger from '../../utils/logger.js'
import { userTable } from '../../config/constants.js'
import CustomError from '../../middleware/error/customError.js'

export default async (publicKey: string, dataToAdd: number): Promise<void> => {
  try {
    const params = {
      TableName: userTable,
      Key: {
        publicKey,
      },
      UpdateExpression: 'set dataLimit = dataLimit + :d, updatedAt = :u',
      ExpressionAttributeValues: {
        ':d': dataToAdd,
        ':u': Date.now(),
      },
    }

    await dbbClient.update(params)
  } catch (error: any) {
    logger.error('Update user data limit Error: ' + error)
    throw new CustomError(500, `Internal Server Error.`)
  }
}
