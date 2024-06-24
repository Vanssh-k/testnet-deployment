import dbbClient from '../../db/ddbClient.js'
import logger from '../../../utils/logger.js'
import { UserAuthDetails } from '../../../types/user.js'
import { userAuthTable } from '../../../config/constants.js'
import CustomError from '../../../middleware/error/customError.js'

export default async (id: string): Promise<UserAuthDetails> => {
  try {
    const params = {
      TableName: userAuthTable,
      Key: {
        id: id,
      },
    }

    const record = await dbbClient.get(params)
    return record.Item as UserAuthDetails
  } catch (error: any) {
    logger.error('In getAPIKey: ' + error)
    throw new CustomError(500, `Internal Server Error.`)
  }
}
