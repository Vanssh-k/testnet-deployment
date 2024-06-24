import dbbClient from '../../db/ddbClient.js'
import logger from '../../../utils/logger.js'
import { UserAuthDetails } from '../../../types/user.js'
import { userAuthTable } from '../../../config/constants.js'
import CustomError from '../../../middleware/error/customError.js'

export default async (apiKey: string): Promise<UserAuthDetails> => {
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
    return Items[0] as UserAuthDetails
  } catch (error: any) {
    logger.error('In checkAPIKey: ' + error)
    throw new CustomError(500, `Internal Server Error.`)
  }
}
