export type CIDRecord = {
  cid: string
  fileSize: number
  mtype: string
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
  HaltDeals = 'halt-deals',
  DealMakingStarted = 'deal-making-started',
}
