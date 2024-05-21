const service = 'pinning-service'

const cidTable = 'nft-storage-cid'
const userTable = 'ff-user-record'
const userAuthTable = 'ff-user-auth'

const cacheClearTime = {
  day: 86400,
  week: 604800,
  month: 2628000,
}

const freeDataLimitInBytes = 1073741824
const messageString = 'Please prove you are the owner of this wallet by signing this message, nonce='

const lighthouseAPIURL = 'https://api.lighthouse.storage'

const FileSearchEvent = [
  'blocks:get:providers:get',
  'bitswap:network:find-providers',
  'bitswap:network:dial',
  'bitswap:network:send-wantlist',
]
const FileDownloadEvent = [
  'blocks:get:blockstore:put',
  'blocks:get:providers:notify',
  'bitswap:want-block:block',
  'bitswap:network:provide',
]
const PostDownloadEvent = [
  'kad-dht:query:dial-peer',
  'kad-dht:query:send-query',
  'kad-dht:query:query-error',
  'kad-dht:query:peer-response',
]
const PinningDoneEvent = 'helia:pin:add'

export {
  service,
  freeDataLimitInBytes,
  messageString,
  cidTable,
  userTable,
  userAuthTable,
  cacheClearTime,
  lighthouseAPIURL,
  FileSearchEvent,
  FileDownloadEvent,
  PostDownloadEvent,
  PinningDoneEvent,
}
