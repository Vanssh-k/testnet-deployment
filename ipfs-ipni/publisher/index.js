import fs from 'fs/promises';
import express from 'express';
import axios from 'axios';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import cron from 'node-cron';

const app = express();
const PORT = 8000;
const CID_FILE = './cid.txt';
const DHT_ENDPOINT = 'http://localhost:5001/api/v0/routing/provide';
const BATCH_SIZE = 1000;
const COOLDOWN_PERIOD = 5000; // 20 seconds
const SKIP_FIRST_N = 1054803; // Set this to the number of CIDs you want to skip
const ACCESS_TOKEN = process.env.ROUTE_ACCESS_TOKEN;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(morgan('dev'));

let cidListSet = new Set();

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const loadCIDs = async () => {
  try {
    const data = await fs.readFile(CID_FILE, 'utf-8');
    let cidList = data.split('\n').filter((line) => line.trim() !== '');
    
    // Skip the first N CIDs
    cidList = cidList.slice(SKIP_FIRST_N);

    cidListSet = new Set(cidList);
  } catch (err) {
    console.error(`Error loading CIDs from file: ${err.message}`);
  }
};


const appendCIDToFile = async (cid) => {
  try {
    await fs.appendFile(CID_FILE, `${cid}\n`);
    console.log(`CID ${cid} saved to file.`);
  } catch (err) {
    console.error(`Error saving CID to file: ${err.message}`);
  }
};

const sendToDHT = async (cid) => {
  try {
    console.log(`Publishing: `, cid);
    const response = await axios.post(`${DHT_ENDPOINT}?arg=${cid}&verbose=true`);
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
  await Promise.all(batch.map((cid) => sendToDHT(cid)));
};

const publishRecordsWithCooldown = async () => {
  const cidList = Array.from(cidListSet);
  for (let i = 0; i < cidList.length; i += BATCH_SIZE) {
    const batch = cidList.slice(i, i + BATCH_SIZE);
    await publishBatch(batch);

    if (i + BATCH_SIZE < cidList.length) {
      console.log(`Cooldown for ${COOLDOWN_PERIOD / 1000} seconds...`);
      await delay(COOLDOWN_PERIOD);
    }
  }
};

app.get('/api/add_cid_record', async (req, res) => {
  const accessToken = req.headers['authorization']?.split(' ')[1]
  if(accessToken===ACCESS_TOKEN) {
    const cid = req.query.cid;
    if (!cidListSet.has(cid)) {
      cidListSet.add(cid);
      await appendCIDToFile(cid);
      await sendToDHT(cid);
      res.status(200).send('CID added and published');
    } else {
      res.status(200).send('CID already exists');
    }
  } else{
    res.status(403).send('Forbidden');
  }
});

app.get('/api/manual_publish_all_cid', async (req, res) => {
  const accessToken = req.headers['authorization']?.split(' ')[1]
  if(accessToken===ACCESS_TOKEN) {
    publishRecordsWithCooldown().then(() => {
      res.status(200).send('Publishing started with cooldown');
    });
  } else{
    res.status(403).send('Forbidden');
  }
});

app.get('/api/republish_cid', async (req, res) => {
  const accessToken = req.headers['authorization']?.split(' ')[1]
  if(accessToken===ACCESS_TOKEN) {
    const cid = req.query.cid;
    if (cidListSet.has(cid)) {
      await sendToDHT(cid);
      res.status(200).send('Republish started');
    } else {
      res.status(404).send('CID not found');
    }
  } else{
    res.status(403).send('Forbidden');
  }
});

cron.schedule('0 0 * * *', () => {
  console.log('CRON job started for batch publish with cooldown');
  publishRecordsWithCooldown();
});

app.listen(PORT, async () => {
  await loadCIDs();
  console.log(`Server is running on port ${PORT}`);
//  await delay(COOLDOWN_PERIOD);
//  publishRecordsWithCooldown();
});
