import dbbClient from '../db/ddbClient.js'
import { cidTable } from '../../config/constants.js'
import logger from '../../utils/logger.js'
import CustomError from '../../middleware/error/customError.js'

export default async (fileDetails: any): Promise<void> => {
  try {
    const params = {
      TableName: cidTable,
      Item: fileDetails,
    }

    await dbbClient.put(params)
  } catch (error: any) {
    logger.error(`Error in creating cid record: ${error}`)
    throw new CustomError(500, `Internal Server Error.`)
  }
}
