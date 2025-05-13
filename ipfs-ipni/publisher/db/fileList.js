import config from '../config/index.js'
import ddbClient from '../ddbClient.js'

export const fileSummary = async (date) => {
  try {
    const params = {
      TableName: config.ipfs_files_table,
      ScanIndexForward: false,
      IndexName: `dataPartition-createdAt-index`,
      KeyConditionExpression: `dataPartition = :d`,
      ExpressionAttributeValues: {
        ':d': date,
      },
      ExclusiveStartKey: undefined,
    }

    let items
    let list = []
    do {
      items = await ddbClient.query(params)
      list = list.concat(items.Items)
      params.ExclusiveStartKey = items.LastEvaluatedKey
    } while (typeof items.LastEvaluatedKey !== 'undefined')

    return list
  } catch (error) {
    throw new Error()
  }
}
