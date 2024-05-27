import dotenv from 'dotenv'
import path from 'path'

dotenv.config()

const config = {
  environment: process.env.NODE_ENV ?? 'development',
  port: process.env.PORT ?? 8000,
  aws_access_key_id: process.env.AWS_ACCESS_KEY_ID ?? '',
  aws_secret_access_key: process.env.AWS_SECRET_ACCESS_KEY ?? '',
  aws_region: process.env.AWS_REGION ?? '',
  redis_url: process.env.REDIS_URL ?? '',
  lighthouse_api_key: process.env.LIGHTHOUSE_API_KEY,
  logger_loki_host: process.env.LOGGER_LOKI_HOST ?? '',
  ipfs_path: process.env.IPFS_PATH ?? 'ipfs/',
  peerID: process.env.PEER_ID ?? '',
  privKey: process.env.PRIVATE_KEY ?? '',
  pubKey: process.env.PUBLIC_KEY ?? '',
}

export default config
