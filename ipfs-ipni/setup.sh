#!/bin/bash

ipfs init -p server
ipfs config Datastore.StorageMax 1EB && \
  ipfs bootstrap rm all --all

ipfs config --json Datastore.Spec "{\"mounts\":[{\"child\":{\"accessKey\":\"${AWS_ACCESS_KEY}\",\"bucket\":\"${AWS_S3_BUCKET}\",\"region\":\"${AWS_REGION}\",\"secretKey\":\"${AWS_SECRET_KEY}\",\"type\":\"s3ds\"},\"mountpoint\":\"/blocks\",\"prefix\":\"s3.datastore\",\"type\":\"measure\"},{\"child\": {\"compression\":\"none\",\"path\":\"datastore\",\"type\":\"levelds\"},\"mountpoint\": \"/\",\"prefix\":\"leveldb.datastore\",\"type\":\"measure\"}],\"type\":\"mount\"}"
echo "{\"mounts\":[{\"bucket\":\"${AWS_S3_BUCKET}\",\"mountpoint\":\"/blocks\",\"region\":\"${AWS_REGION}\",\"rootDirectory\":\"\"},{\"mountpoint\":\"/\",\"path\":\"datastore\",\"type\":\"levelds\"}],\"type\":\"mount\"}" > ${IPFS_PATH}/datastore_spec

IPFS_CONFIG="$IPFS_PATH/config"
jq '.Addresses = {
      "Swarm": [
        "/ip4/0.0.0.0/tcp/4001",
        "/ip4/0.0.0.0/tcp/4001/ws",
        "/ip4/0.0.0.0/udp/4001/quic-v1",
        "/ip4/0.0.0.0/udp/4001/quic-v1/webtransport"
      ]
    }' "$IPFS_CONFIG" > "$IPFS_CONFIG.tmp" && mv "$IPFS_CONFIG.tmp" "$IPFS_CONFIG"

jq '.Routing = {
      "Methods": {
        "find-peers": {
          "RouterName": "WanDHT"
        },
        "find-providers": {
          "RouterName": "ParallelHelper"
        },
        "get-ipns": {
          "RouterName": "WanDHT"
        },
        "provide": {
          "RouterName": "ParallelHelper"
        },
        "put-ipns": {
          "RouterName": "WanDHT"
        }
      },
      "Routers": {
        "IndexProvider": {
          "Parameters": {
            "Endpoint": "http://127.0.0.1:50617",
            "MaxProvideBatchSize": 10000,
            "MaxProvideConcurrency": 1
          },
          "Type": "http"
        },
        "ParallelHelper": {
          "Parameters": {
            "Routers": [
              {
                "IgnoreErrors": true,
                "RouterName": "IndexProvider",
                "Timeout": "30m"
              },
              {
                "IgnoreErrors": true,
                "RouterName": "WanDHT",
                "Timeout": "30m"
              }
            ]
          },
          "Type": "parallel"
        },
        "WanDHT": {
          "Parameters": {
            "AcceleratedDHTClient": true,
            "Mode": "auto",
            "PublicIPNetwork": true
          },
          "Type": "dht"
        }
      },
      "Type": "custom"
    }' "$IPFS_CONFIG" > "$IPFS_CONFIG.tmp" && mv "$IPFS_CONFIG.tmp" "$IPFS_CONFIG"

# Start IPFS daemon in the background
USERNAME=$(whoami)
sudo tee /etc/systemd/system/ipfs.service > /dev/null <<EOF
[Unit]
Description=IPFS Daemon
After=network.target

[Service]
ExecStart=/usr/local/bin/ipfs daemon
Restart=always
User=$USERNAME

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd to read the new unit file
sudo systemctl daemon-reload

# Start and enable the IPFS service
sudo systemctl start ipfs
sudo systemctl enable ipfs

# Wait for IPFS to fully initialize
sleep 10

# Extract IPFS peer ID
PEER_ID=$(ipfs config Identity.PeerID)

# Initialize the IPNI service
provider init

# Define default values for environment variables if they are not set
: "${ANNOUNCE_MULTIADDR:=/ip4/127.0.0.1/tcp/0}"
: "${LISTEN_MULTIADDR:=/ip4/0.0.0.0/tcp/3105}"
: "${PUBLISHER_KIND:=libp2phttp}"
: "${RETRIEVAL_MULTIADDR:=/ip4/127.0.0.1/tcp/0}"
: "${DIRECT_ANNOUNCE_URL:=}"
: "${DELEGATED_ROUTING_MULTIADDR:=/ip4/0.0.0.0/tcp/0}"
: "${DELEGATED_ROUTING_CHUNK_SIZE:=1000}"
: "${DELEGATED_ROUTING_SNAPSHOT_SIZE:=10000}"
: "${DELEGATED_ROUTING_ADDRS_TCP:=/ip4/127.0.0.1/tcp/0}"
: "${DELEGATED_ROUTING_ADDRS_UDP:=/ip4/127.0.0.1/udp/0}"

CONFIG_FILE="${PROVIDER_PATH}/config"

# Update IPNI config with the IPFS peer ID and environment variables
jq ".DelegatedRouting.ProviderID = \"$PEER_ID\"" $CONFIG_FILE > tmp.json && mv tmp.json $CONFIG_FILE
jq ".Ingest.HttpPublisher.AnnounceMultiaddr = \"$ANNOUNCE_MULTIADDR\"" $CONFIG_FILE > tmp.json && mv tmp.json $CONFIG_FILE
jq ".Ingest.HttpPublisher.ListenMultiaddr = \"$LISTEN_MULTIADDR\"" $CONFIG_FILE > tmp.json && mv tmp.json $CONFIG_FILE
jq ".Ingest.PublisherKind = \"$PUBLISHER_KIND\"" $CONFIG_FILE > tmp.json && mv tmp.json $CONFIG_FILE
jq ".ProviderServer.RetrievalMultiaddrs = [\"$RETRIEVAL_MULTIADDR\"]" $CONFIG_FILE > tmp.json && mv tmp.json $CONFIG_FILE
jq ".DirectAnnounce.URLs = [\"$DIRECT_ANNOUNCE_URL\"]" $CONFIG_FILE > tmp.json && mv tmp.json $CONFIG_FILE
jq ".DelegatedRouting.ListenMultiaddr = \"$DELEGATED_ROUTING_MULTIADDR\"" $CONFIG_FILE > tmp.json && mv tmp.json $CONFIG_FILE
jq ".DelegatedRouting.ChunkSize = ($DELEGATED_ROUTING_CHUNK_SIZE | tonumber)" $CONFIG_FILE > tmp.json && mv tmp.json $CONFIG_FILE
jq ".DelegatedRouting.SnapshotSize = ($DELEGATED_ROUTING_SNAPSHOT_SIZE | tonumber)" $CONFIG_FILE > tmp.json && mv tmp.json $CONFIG_FILE
jq ".DelegatedRouting.Addrs = [\"$DELEGATED_ROUTING_ADDRS_TCP/p2p/$PEER_ID\", \"$DELEGATED_ROUTING_ADDRS_UDP/quic-v1/p2p/$PEER_ID\"]" $CONFIG_FILE > tmp.json && mv tmp.json $CONFIG_FILE

sudo tee /etc/systemd/system/provider.service > /dev/null <<EOF
[Unit]
Description=IPFS Daemon
After=network.target

[Service]
ExecStart=/usr/local/bin/provider daemon
Restart=always
User=$USERNAME

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload

sudo systemctl start provider
sudo systemctl enable provider

pm2 start /app/publisher/index.js
