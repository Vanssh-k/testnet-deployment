import { type NextFunction, type Response, type Request } from 'express'
import { v4 } from 'uuid'
import * as isIPFS from 'is-ipfs'
import { CID } from 'multiformats/cid'

import addCid from '../../db/cid/addCid.js'
import { CIDStatus } from '../../types/cidRecord.js'
import responseParser from '../../utils/responseParser.js'
import getCIDDetails from '../../db/cid/getCIDDetails.js'
import updateCidStatus from '../../db/cid/updateCidStatus.js'
import { deleteFile } from '../pinning/helia.js'
import CustomError from '../../middleware/error/customError.js'


const create_new_cid_record = async(cid: string, publicKey: string) => {
  let cidV1 = ''
  let cidV0 = ''
  if(CID.parse(cid).version === 0) {
    cidV1 = CID.parse(cid).toV1().toString()
    cidV0 = cid
  } else {
    cidV1 = cid
    cidV0 = 'n/a'
  }

  const fileData = {
    id: v4(),
    publicKey: publicKey,
    cid: cidV1,
    fileSize: 0,
    mtype: null,
    cidStatus: CIDStatus.Queued,
    cidV0: cidV0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  await addCid(fileData)
}

export const add_cid = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if(!isIPFS.cid(req.query.cid as string)) {
      throw new CustomError(500, "Invalid CID")
    }
    const cidData = await getCIDDetails(req.query.cid as string)
    if(cidData.length>0) {
      let differentUser = true
      for(let i=0; i<cidData.length; i++) {
        if(cidData[i]['publicKey'] === req.body.user.publicKey) {
          if(cidData[i].cidStatus===CIDStatus.PinningFailed || cidData[i].cidStatus===CIDStatus.Deleted){
            await updateCidStatus(cidData[i].id, CIDStatus.Queued)
            differentUser = false
            break
          }
        }
      }

      if(differentUser) {
        await create_new_cid_record(req.query.cid as string, req.body.user.publicKey)
      }
      const response = responseParser('File queued')
      res.status(200).json(response)
    } else{
      await create_new_cid_record(req.query.cid as string, req.body.user.publicKey)
      const response = responseParser('File queued')
      res.status(200).json(response)
    }
  } catch (error) {
    next(error)
  }
}

export const cid_details = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getCIDDetails(req.query.cid as string)
    const response = responseParser(data)
    res.status(200).json(response)
  } catch (error) {
    next(error)
  }
}

export const delete_cid = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cidData = await getCIDDetails(req.query.cid as string)
    let proceed = false
    let cidRecord = null
    for(let i=0; i<cidData.length; i++) {
      if(cidData[i]['publicKey'] === req.body.user.publicKey) {
        proceed = true
        cidRecord = cidData[i]
      }
    }
    if(!proceed) {
      throw new CustomError(403, 'Unauthorized')
    }

    if(cidRecord && cidRecord.cidStatus!==CIDStatus.DealMakingStarted) {
      await deleteFile(req.query.cid as string)
      const data = await updateCidStatus(cidRecord.id, CIDStatus.Deleted)
      const response = responseParser(data)
      res.status(200).json(response)
    } else {
      res.status(400).json('CID Not Found')
    }
  } catch (error) {
    next(error)
  }
}
