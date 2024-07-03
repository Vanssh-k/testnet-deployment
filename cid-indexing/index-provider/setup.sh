#!/bin/bash
provider init

# Define default values for environment variables if they are not set
: "${PEER_ID:=12D}"
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
jq ".DelegatedRouting.Addrs = [\"$DELEGATED_ROUTING_ADDRS_TCP\", \"$DELEGATED_ROUTING_ADDRS_UDP\"]" $CONFIG_FILE > tmp.json && mv tmp.json $CONFIG_FILE

provider daemon
