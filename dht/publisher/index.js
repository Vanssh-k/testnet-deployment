import express from 'express';
import axios from 'axios';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import cron from 'node-cron';
import dotenv from 'dotenv';
import config from './config.js';
import { getFileList } from './db/getFileList.js';
import { getFileListByPublicKey } from './db/fileListByPublicKey.js';

dotenv.config();

const app = express();
const DHT_ENDPOINT = process.env.DHT_ENDPOINT || 'http://nginx:86/api/v0/routing/provide';
// const DHT_ENDPOINT = 'http://127.0.0.1:86/api/v0/routing/provide';
const BATCH_SIZE = 100;
const COOLDOWN_PERIOD = 2000; // 2 seconds

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(morgan('dev'));

const publicKeyList = [
	"0xcd3a0cc4baefd8cfe4830351841687b162aaa680",
//	"0x2de3184373ff02e1bca83cce553943def008ab31",
//	"0x01cb023186cab05220554ee75b4d69921dd051f1",
//	"0xb9deb1b2de3f9fbd66b8d777674dbe693837064d",
//	"0x898b2500c4fed262d7cc564dd892a34b33da0a41",
//	"0x1703ce186cd52d804e1e450e5b1e86d887fb535c"
]

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const sendToDHT = async (cid) => {
  try {
    console.log(`Publishing: `, cid);
    const response = await axios.post(`${DHT_ENDPOINT}?arg=${cid}&verbose=false`);
    if (response.status === 200) {
      console.log(`Publish Success for CID: ${cid}, Response:`, response.data);
    } else {
      console.error(`Publish Failed for CID: ${cid}, Status: ${response.status}`);
    }
  } catch (err) {
    console.error(`Error while publishing CID: ${cid}, Message: ${err.message}`, err.response?.data || 'No additional error information');
  }
};

const publishBatch = async (batch) => {
  await Promise.all(batch.map((cid) => sendToDHT(cid.cid)));
};

const publishRecordsForWhitelistPublicKeys = async () => {
  for(let i=0; i<publicKeyList.length; i++){
    const cidList = await getFileListByPublicKey(publicKeyList[i])
    for (let i = 0; i < cidList.length; i += BATCH_SIZE) {
        const batch = cidList.slice(i, i + BATCH_SIZE);
        await publishBatch(batch);
        await delay(COOLDOWN_PERIOD);
    }
  }
};

const publishRecords = async () => {
  const cidList = await getFileList()
  for (let i = 0; i < cidList.length; i += BATCH_SIZE) {
    const batch = cidList.slice(i, i + BATCH_SIZE);
    await publishBatch(batch);
    await delay(COOLDOWN_PERIOD)
  }
};

cron.schedule('0 0 * * *', async () => {
  console.log('CRON job started for batch publish with cooldown');
  await publishRecordsForWhitelistPublicKeys();
  await publishRecords();
});


// Bearer token authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token || token !== config.auth_token) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  
  next();
};

app.get('/api/publish', authenticateToken, async (req, res) => {
  const cid = req.query.cid;
  if (!cid) {
    return res.status(400).json({ error: 'CID is required as a query parameter' });
  }
  try {
    await sendToDHT(cid);
    return res.status(200).json({ success: true, message: `CID ${cid} published successfully` });
  } catch (error) {
    console.error('Error publishing CID:', error);
    return res.status(500).json({ error: 'Failed to publish CID', details: error.message });
  }
});

app.listen(config.port, () => {
  console.log(`Publisher service running on port ${config.port}`);
});
