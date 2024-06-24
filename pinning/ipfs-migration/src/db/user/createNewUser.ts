import { UserDetails } from '../../types/user.js'
import CustomError from '../../middleware/error/customError.js'
import { userTable } from '../../config/constants.js'
import dbbClient from '../db/ddbClient.js'
import logger from '../../utils/logger.js'

export default async (updatedDetails: UserDetails): Promise<void> => {
  try {
    updatedDetails.publicKey = updatedDetails.publicKey.trim().toLowerCase()
    const params = {
      TableName: userTable,
      Item: updatedDetails,
    }

    await dbbClient.put(params)
  } catch (error: any) {
    logger.error('Error update user details: ' + error)
    throw new CustomError(500, 'Internal Server Error.')
  }
}
