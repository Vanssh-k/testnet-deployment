
import ddbClient from './ddbClient.js'

export const getFileListByPublicKey = async (publicKey) => {
  let exclusiveStartKey = null
  let record
  const list = []
  let move = true
  do{
      const params = {
          TableName: config.ipfs_files_table,
          IndexName: `publicKey-createdAt-index`,
          KeyConditionExpression: `publicKey = :p`,
          ExpressionAttributeValues: {
            ':p': publicKey,
          },
          ScanIndexForward: false,
          ExclusiveStartKey: exclusiveStartKey,
        }
        record = await ddbClient.query(params).promise()
        
        for(let i=0; i<record.Items.length; i++) {
          list.push(record.Items[i])
        }
        if(!record.LastEvaluatedKey) {
          move = false
        }
        exclusiveStartKey = record.LastEvaluatedKey
  } while(move)
  return list
}
