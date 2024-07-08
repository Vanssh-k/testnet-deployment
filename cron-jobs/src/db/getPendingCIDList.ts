import dbbClient from './ddbClient.js'
import { FileSchema } from '../types/file.js'
import { fileTable } from '../config/constants.js'

export default async (): Promise<FileSchema[]> => {
  try {
    const params = {
      TableName: fileTable,
      IndexName: 'sentForDeal-index',
      KeyConditionExpression: 'sentForDeal = :s',
      ExpressionAttributeValues: {
        ':s': 'no',
      }
    }

    const record = await dbbClient.query(params)
    return (record.Items as FileSchema[]) ?? []
  } catch (error: any) {
    console.error(`Error in listing collection: ${error}`)
    throw new Error(`Failed To Fetch Records.`)
  }
}
