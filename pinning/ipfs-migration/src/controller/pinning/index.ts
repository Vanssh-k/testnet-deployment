import { startPinning, deleteFile } from './helia.js'

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
