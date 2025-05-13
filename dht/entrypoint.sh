#!/bin/sh
set -e

export IPFS_PATH=/data/ipfs

if [ ! -f "$IPFS_PATH/config" ]; then
  echo "No IPFS repo found, initializing..."
  echo 'export IPFS_PATH=/data/ipfs' >> ~/.bashrc
  ipfs init --profile=server

  jq ".Identity.PeerID=\"${PEER_ID}\" | .Identity.PrivKey=\"${PRIV_KEY}\"" $IPFS_PATH/config > $IPFS_PATH/config.new
  mv $IPFS_PATH/config.new $IPFS_PATH/config
  ipfs config Datastore.StorageMax 1EB
  ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '["*"]'
  ipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods '["GET", "POST", "OPTIONS"]'

  ipfs config --json Routing.AcceleratedDHTClient true
  ipfs config --json Addresses.API '"/ip4/0.0.0.0/tcp/5001"'
  ipfs config --json Addresses.Swarm "[\"/ip4/0.0.0.0/tcp/${BITSWAP_PORT}\", \"/ip4/0.0.0.0/udp/${BITSWAP_PORT}/quic-v1\"]"
  ipfs config --json Datastore.Spec "{\"mounts\":[{\"child\":{\"accessKey\":\"${S3_ACCESS_KEY}\",\"bucket\":\"${S3_BUCKET}\",\"region\":\"${S3_REGION}\",\"secretKey\":\"${S3_SECRET_KEY}\",\"type\":\"s3ds\"},\"mountpoint\":\"/blocks\",\"prefix\":\"s3.datastore\",\"type\":\"measure\"},{\"child\": {\"compression\":\"none\",\"path\":\"datastore\",\"type\":\"levelds\"},\"mountpoint\": \"/\",\"prefix\":\"leveldb.datastore\",\"type\":\"measure\"}],\"type\":\"mount\"}"
  echo "{\"mounts\":[{\"bucket\":\"${S3_BUCKET}\",\"mountpoint\":\"/blocks\",\"region\":\"${S3_REGION}\",\"rootDirectory\":\"\"},{\"mountpoint\":\"/\",\"path\":\"datastore\",\"type\":\"levelds\"}],\"type\":\"mount\"}" > $IPFS_PATH/datastore_spec
#  ipfs config --json Addresses.Announce "[\"/ip4/0.0.0.0/tcp/${BITSWAP_PORT}\", \"/ip4/0.0.0.0/udp/${BITSWAP_PORT}/quic-v1\"]"
fi

exec ipfs daemon
