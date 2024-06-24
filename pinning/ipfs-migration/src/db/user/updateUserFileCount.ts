import dbbClient from '../db/ddbClient.js'
import logger from '../../utils/logger.js'
import { userTable } from '../../config/constants.js'
import CustomError from '../../middleware/error/customError.js'

export default async (publicKey: string, fileSize: number) => {
  try {
    const params = {
      TableName: userTable,
      Key: {
        publicKey,
      },
      UpdateExpression: 'set dataUsed = dataUsed + :d, fileCount = fileCount + :f, updatedAt = :u',
      ExpressionAttributeValues: {
        ':d': fileSize,
        ':f': 1,
        ':u': Date.now(),
      },
    }

    await dbbClient.update(params)
    return 'Update Successful'
  } catch (error) {
    logger.error('Update user data: ' + error)
    throw new CustomError(500, `Internal Server Error.`)
  }
}
