import dbbClient from './ddbClient.js'
import { fileTable } from '../config/constants.js'

export default async (id: string): Promise<void> => {
  try {
    const params = {
      TableName: fileTable,
      Key: {
        id,
      },
      UpdateExpression: 'set sentForDeal = :s, lastUpdate = :l',
      ExpressionAttributeValues: {
        ':s': "yes",
        ':l': Date.now(),
      },
    }

    await dbbClient.update(params)
  } catch (error) {
    console.error(`Error in listing collection: ${error}`)
    throw new Error(`Failed To Fetch Records.`)
  }
}
