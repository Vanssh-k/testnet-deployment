import { v4 } from 'uuid'
import cjs from 'crypto-js'

import { messageString, freeDataLimitInBytes } from '../../../config/constants.js'
import { setExCache, getCache } from '../../../db/db/cacheClient.js'

import createApiKeyRecord from '../../../db/user/auth/createApiKeyRecord.js'
import getApiRecordById from '../../../db/user/auth/getApiRecordById.js'
import removeApiKey from '../../../db/user/auth/removeApiKey.js'
import userKeysRecord from '../../../db/user/auth/userKeysRecord.js'
import createNewUser from '../../../db/user/createNewUser.js'
import userDetails from '../../../db/user/userDetails.js'
import { UserDetails } from '../../../types/user.js'
import CustomError from '../../../middleware/error/customError.js'
import verifySignature from 'src/utils/verifySignature.js'

export const getMessage = async (publicKey: string, encryption: string): Promise<string> => {
  const record = await userDetails(publicKey.trim().toLowerCase())
  const timestamp = Date.now()
  const message = messageString + timestamp

  // New user
  if (!record) {
    const userRecord: UserDetails = {
      publicKey: publicKey.trim().toLowerCase(),
      dataLimit: freeDataLimitInBytes,
      dataUsed: 0,
      fileCount: 0,
      network: 'evm',
      email: 'null-' + v4(),
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    await createNewUser(userRecord)
  }

  await setExCache(`message-${publicKey}`, 300, timestamp)

  return message
}

export const createApiKey = async (publicKey: string, signature: string, keyName: string) => {
  const message = await getCache(`message-${publicKey.trim().toLowerCase()}`)
  const authentic = verifySignature(publicKey, messageString + message, signature)
  if(!authentic) {
    throw new CustomError(401, 'Signature verification failed')
  }
  const prefix = v4().split('-')[0]
  const apiKey = prefix + '.' + v4().split('-').join('')
  const authDetails = {
    id: v4(),
    keyName: keyName,
    publicKey: publicKey.trim().toLowerCase(),
    apiKey: cjs.SHA256(apiKey).toString(),
    keyPrefix: prefix,
    scope: 'admin',
    lastUpdate: Date.now(),
  }
  await createApiKeyRecord(authDetails)
  return apiKey
}

export const revokeApiKey = async (id: string, publicKey: string) => {
  const apiRecord: any = await getApiRecordById(id)
  if (apiRecord.publicKey !== publicKey) {
    throw new CustomError(403, 'Forbidden')
  }
  const status = await removeApiKey(id)
  return status
}

export const getUserKeys = async (publicKey: string) => {
  const data = await userKeysRecord(publicKey)
  return data
}
