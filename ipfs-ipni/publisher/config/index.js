import dotenv from 'dotenv'
dotenv.config()

const baseConfig = {
  port: process.env.PORT ?? 3000,
  aws_access_key_id: process.env.AWS_ACCESS_KEY_ID ?? '',
  aws_secret_access_key: process.env.AWS_SECRET_ACCESS_KEY ?? '',
  aws_region: process.env.AWS_REGION ?? 'ap-south-1',
  ipfs_files_table: process.env.IPFS_FILES_TABLE ?? 'files',
  auth_token: process.env.AUTH_TOKEN ?? '',
  telegram_bot_id: process.env.TELEGRAM_BOT_ID ?? '',
  telegram_notification_group_id: process.env.TELEGRAM_NOTIFICATION_GROUP_ID ?? '',
}

export default baseConfig
