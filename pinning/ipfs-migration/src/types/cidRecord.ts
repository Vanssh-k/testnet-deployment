export type CIDRecord = {
  id: string
  publicKey: string
  cid: string
  fileSize: number
  mtype: string|null
  cidStatus: string
  createdAt: number
  updatedAt: number
}

export enum CIDStatus {
  Queued = 'queued',
  Started = 'started',
  PinningFailed = 'pinning-failed',
  Pinned = 'pinned',
  Deleted = 'deleted',
  DealMakingStarted = 'deal-making-started',
  DealCreated = 'deal-created',
}
