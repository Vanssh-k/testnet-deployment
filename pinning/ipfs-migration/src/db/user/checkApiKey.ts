import dbbClient from '../db/ddbClient.js'
import { userAuthTable } from '../../config/constants.js'
import logger from '../../utils/logger.js'
import CustomError from '../../middleware/error/customError.js'

export default async (apiKey: string) => {
  try {
    const params = {
      TableName: userAuthTable,
      IndexName: 'apiKey-index',
      KeyConditionExpression: 'apiKey = :a',
      ExpressionAttributeValues: {
        ':a': apiKey,
      },
    }

    const record = await dbbClient.query(params)
    const Items = record.Items ?? []
    return Items[0]
  } catch (error: any) {
    logger.error(`Error in creating cid record: ${error}`)
    throw new CustomError(500, `Internal Server Error.`)
  }
}
