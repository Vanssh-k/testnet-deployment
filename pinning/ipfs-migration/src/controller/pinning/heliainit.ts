import path from 'path'
import { fileURLToPath } from 'url'
import { createHelia } from 'helia'
import config from '../../config/index.js'
import peerIdJson from './peerId.js'
import { createLibp2p } from 'libp2p'
import { FsBlockstore } from 'blockstore-fs'
import { FsDatastore } from 'datastore-fs'
import { createFromJSON } from '@libp2p/peer-id-factory'
import { unmarshalPrivateKey } from '@libp2p/crypto/keys'
import { tcp } from '@libp2p/tcp'
import { circuitRelayTransport, circuitRelayServer, type CircuitRelayService } from '@libp2p/circuit-relay-v2'
import { webRTC, webRTCDirect } from '@libp2p/webrtc'
import { webSockets } from '@libp2p/websockets'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.resolve(path.dirname(__filename), '../../../')

const blockstore = new FsBlockstore(config.ipfs_path, { createIfMissing: true })
const datastore = new FsDatastore(config.ipfs_path)

const peerId = await createFromJSON(peerIdJson)
const libp2p = await createLibp2p({
  peerId: peerId,
  privateKey: await unmarshalPrivateKey(peerId.privateKey!),
  addresses: {
    listen: [
      '/ip4/0.0.0.0/tcp/0',
      '/ip6/::/tcp/0',
      '/webrtc'
    ]
  },
  transports: [
    circuitRelayTransport({
      discoverRelays: 1
    }),
    tcp(),
    webRTC(),
    webRTCDirect(),
    webSockets()
  ],
  streamMuxers: [],
})

const helia = await createHelia({ blockstore, datastore, libp2p })
export default helia
