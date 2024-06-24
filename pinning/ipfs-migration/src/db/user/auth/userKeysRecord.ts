import dbbClient from '../../db/ddbClient.js'
import logger from '../../../utils/logger.js'
import { UserAuthDetails } from '../../../types/user.js'
import { userAuthTable } from '../../../config/constants.js'
import CustomError from '../../../middleware/error/customError.js'

export default async (publicKey: string): Promise<UserAuthDetails[]> => {
  try {
    const params = {
      TableName: userAuthTable,
      IndexName: 'publicKey-index',
      KeyConditionExpression: 'publicKey = :p',
      ExpressionAttributeValues: {
        ':p': publicKey,
      },
    }

    const record = await dbbClient.query(params)
    const Items = record.Items ?? []
    return Items as UserAuthDetails[]
  } catch (error: any) {
    logger.error('In userKeyRecords: ' + error)
    throw new CustomError(500, `Internal Server Error.`)
  }
}
