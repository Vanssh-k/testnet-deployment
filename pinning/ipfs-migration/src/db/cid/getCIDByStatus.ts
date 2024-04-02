import dbbClient from '../db/ddbClient.js'
import { cidTable } from '../../config/constants.js'
import logger from '../../utils/logger.js'
import { CIDRecord } from '../../types/cidRecord.js'
import CustomError from '../../middleware/error/customError.js'

export default async (cidStatus: string): Promise<CIDRecord[]> => {
  try {
    const params = {
      TableName: cidTable,
      IndexName: 'cidStatus-index',
      KeyConditionExpression: 'cidStatus = :c',
      ExpressionAttributeValues: {
        ':c': cidStatus,
      },
    }

    const record = await dbbClient.query(params)
    const Items = record.Items ?? []
    return Items as CIDRecord[]
  } catch (error: any) {
    logger.error(`Error fetch cids with status: ${error}`)
    throw new CustomError(500, `Internal Server Error.`)
  }
}
