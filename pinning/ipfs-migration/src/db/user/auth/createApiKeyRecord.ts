import dbbClient from '../../db/ddbClient.js'
import logger from '../../../utils/logger.js'
import { UserAuthDetails } from '../../../types/user.js'
import { userAuthTable } from '../../../config/constants.js'
import CustomError from '../../../middleware/error/customError.js'

export default async (authDetails: UserAuthDetails) => {
  try {
    const params = {
      TableName: userAuthTable,
      Item: authDetails,
    }

    await dbbClient.put(params)
    return 'Put Successful'
  } catch (error: any) {
    logger.error('In createAPIKey: ' + error.message)
    throw new CustomError(500, `Internal Server Error.`)
  }
}
