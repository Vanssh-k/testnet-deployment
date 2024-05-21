import bs58 from 'bs58'
import { ethers } from 'ethers'
import crypto from 'crypto'

export default async (
  usersPublicKey: string,
  originalMessage: string,
  signedMessage: string,
): Promise<boolean> => {
  try {
    const publicKeyToVerify = ethers.verifyMessage(originalMessage, signedMessage).toLowerCase()
    if (usersPublicKey.toLowerCase() === publicKeyToVerify) {
      return true
    }
    return false
  } catch {
    return false
  }
}
