import { type NextFunction, type Response, type Request } from 'express'
import { v4 } from 'uuid'
import * as isIPFS from 'is-ipfs'

import addCid from '../../db/cid/addCid.js'
import { CIDStatus } from '../../types/cidRecord.js'
import responseParser from '../../utils/responseParser.js'
import getCIDDetails from '../../db/cid/getCIDDetails.js'
import updateCidStatus from '../../db/cid/updateCidStatus.js'
import {delete_cid_helia} from '../pinning/index.js'
import CustomError from '../../middleware/error/customError.js'

export const add_cid = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if(!isIPFS.cid(req.query.cid as string)) {
      throw new CustomError(500, "Invalid CID")
    }
    const cidData = await getCIDDetails(req.query.cid as string)
    if(cidData) {
      if(cidData.cidStatus===CIDStatus.PinningFailed || cidData.cidStatus===CIDStatus.Deleted){
        await updateCidStatus(req.query.cid as string, CIDStatus.Queued)
      }
      res.status(200).json('File queued')
    } else{
      const fileData = {
        id: v4(),
        publicKey: req.body.user.publicKey,
        cid: req.query.cid as string,
        fileSize: 0,
        mtype: null,
        cidStatus: CIDStatus.Queued,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      const data = await addCid(fileData)
      const response = responseParser(data)
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
    if(cidData && cidData.cidStatus!==CIDStatus.DealMakingStarted) {
      const data = await updateCidStatus(req.query.cid as string, CIDStatus.Deleted)
      delete_cid_helia(req.query.cid as string)
      const response = responseParser(data)
      res.status(200).json(response)
    }
    res.status(400).json('CID Not Found')
  } catch (error) {
    next(error)
  }
}

export const halt_deals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cidData = await getCIDDetails(req.query.cid as string)
    if(cidData && cidData.cidStatus!==CIDStatus.DealMakingStarted) {
      const data = await updateCidStatus(req.query.cid as string, CIDStatus.HaltDeals)
      res.status(200).json('Halted')
    }
    res.status(400).json('Deal Initiated')
  } catch (error) {
    next(error)
  }
}

export const resume_deals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cidData = await getCIDDetails(req.query.cid as string)
    if(cidData && cidData.cidStatus!==CIDStatus.Deleted) {
      const data = await updateCidStatus(req.query.cid as string, CIDStatus.Pinned)
      res.status(200).json('Resumed')
    }
    res.status(400).json('File deleted.')
  } catch (error) {
    next(error)
  }
}
