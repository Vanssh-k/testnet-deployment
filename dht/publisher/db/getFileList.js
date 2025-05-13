
import { fileList } from './fileList.js'

export const getFileList = async () => {
  try {
    const today = Date.now()

    // Convert timestamp to start of day after the last record
    const startDate = new Date(today)
    startDate.setDate(startDate.getDate() - 30)

    // Convert today to start of day
    const endDate = new Date(today)
    endDate.setDate(endDate.getDate() - 1) // yesterday
    endDate.setHours(0, 0, 0, 0)

    let totalFiles = []
    for (let currentDate = startDate; currentDate <= endDate; currentDate.setDate(currentDate.getDate() + 1)) {
      const formattedDate = [
        currentDate.getUTCDate().toString().padStart(2, '0'),
        (currentDate.getUTCMonth() + 1).toString().padStart(2, '0'),
        currentDate.getUTCFullYear(),
      ].join('/')
      const filedata = await fileList(formattedDate)
      totalFiles = totalFiles.concat(filedata)
    }
    return totalFiles
  } catch (error) {
    console.log(error)
    return null
  }
}
