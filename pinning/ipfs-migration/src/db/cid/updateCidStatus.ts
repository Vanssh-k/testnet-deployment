import dbbClient from '../db/ddbClient.js'
import { cidTable } from '../../config/constants.js'
import logger from '../../utils/logger.js'
import CustomError from '../../middleware/error/customError.js'

export default async (cid: string, cidStatus: string): Promise<void> => {
  try {
    const params = {
      TableName: cidTable,
      Key: {
        cid: cid,
      },
      UpdateExpression: 'set cidStatus = :c, updatedAt = :u',
      ExpressionAttributeValues: {
        ':c': cidStatus,
        ':u': Date.now(),
      },
    }

    await dbbClient.update(params)
  } catch (error: any) {
    logger.error(`Error halt cid: ${error}`)
    throw new CustomError(500, `Internal Server Error.`)
  }
}
