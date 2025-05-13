import { Telegraf, Context } from 'telegraf'
import config from '../config/index.js'

let botInstance = null
const NOTIFICATION_GROUP_ID = config.telegram_notification_group_id

function getBotInstance() {
  if (!botInstance) {
    botInstance = new Telegraf(config.telegram_bot_id)

    botInstance.start((ctx) => {
      if (ctx.message) {
        console.log('New user started the bot:', ctx.message.chat)
      }
    })
  }
  return botInstance
}

export async function sendTelegramMessage(message) {
  try {
    const bot = getBotInstance()
    await bot.telegram.sendMessage(NOTIFICATION_GROUP_ID, message)
    return true
  } catch (error) {
    console.error('Failed to send Telegram message:', error.message)
    return false
  }
}

export async function startBot() {
  try {
    const bot = getBotInstance()
    const webhookInfo = await bot.telegram.getWebhookInfo()
    console.log(webhookInfo)
    // Only launch if no webhook is set up
    if (!webhookInfo.url) {
      await bot.launch()
      console.log('Telegram bot started successfully')
    } else {
      console.log('Telegram bot is already running with webhook:', webhookInfo.url)
    }
  } catch (error) {
    console.error('Failed to start Telegram bot:', error.message)
    throw error
  }
}

export async function stopBot() {
  if (botInstance) {
    try {
      botInstance.stop()
      console.log('Telegram bot stopped successfully')
    } catch (error) {
      console.error('Failed to stop Telegram bot:', error.message)
      throw error
    } finally {
      botInstance = null
    }
  }
}
