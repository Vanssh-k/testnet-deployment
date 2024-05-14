import { type NextFunction, type Response, type Request } from 'express'
import { startPinning, deleteFile, getMultiaddress } from './helia.js'

export const add_cid_helia = async (cid: string) => {
  try {
    startPinning(cid)
  } catch (error) {
    return error
  }
}

export const delete_cid_helia = async (cid: string) => {
  try {
    deleteFile(cid)
  } catch (error) {
    return error
  }
}

export const get_multiaddress = async (req: Request, res: Response) => {
  const multi = getMultiaddress()
  res.status(200).json(multi)
}
