import dbbClient from '../../db/ddbClient.js'
import logger from '../../../utils/logger.js'
import { UserAuthDetails } from '../../../types/user.js'
import { userAuthTable } from '../../../config/constants.js'
import CustomError from '../../../middleware/error/customError.js'

export default async (id: string): Promise<void> => {
  try {
    const params = {
      TableName: userAuthTable,
      Key: {
        id: id,
      },
    }

    await dbbClient.delete(params)
  } catch (error: any) {
    logger.error('In removeAPIKey: ' + error)
    throw new CustomError(500, `Internal Server Error.`)
  }
}
