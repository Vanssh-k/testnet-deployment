import dbbClient from '../db/ddbClient.js'
import { cidTable } from '../../config/constants.js'
import logger from '../../utils/logger.js'
import { CIDRecord } from '../../types/cidRecord.js'
import CustomError from '../../middleware/error/customError.js'

export default async (cid: string): Promise<CIDRecord> => {
  try {
    const params = {
      TableName: cidTable,
      Key: {
        cid: cid,
      },
    }

    const record = await dbbClient.get(params)
    return record.Item as CIDRecord
  } catch (error: any) {
    logger.error(`Error getting cid info: ${error}`)
    throw new CustomError(500, `Internal Server Error.`)
  }
}
