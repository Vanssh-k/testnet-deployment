#!/bin/bash
# Assuming CONFIG_FILE is set to the path of your config file
CONFIG_FILE="/root/.index-provider/config"

# Use jq to modify the config file based on environment variables
jq ".Ingest.HttpPublisher.AnnounceMultiaddr = env.ANNOUNCE_MULTIADDR" $CONFIG_FILE > tmp.json && mv tmp.json $CONFIG_FILE
jq ".Ingest.HttpPublisher.ListenMultiaddr = env.LISTEN_MULTIADDR" $CONFIG_FILE > tmp.json && mv tmp.json $CONFIG_FILE
jq ".Ingest.PublisherKind = env.PUBLISHER_KIND" $CONFIG_FILE > tmp.json && mv tmp.json $CONFIG_FILE
jq ".ProviderServer.RetrievalMultiaddrs = [env.RETRIEVAL_MULTIADDR]" $CONFIG_FILE > tmp.json && mv tmp.json $CONFIG_FILE
jq ".DirectAnnounce.URLs = [env.DIRECT_ANNOUNCE_URL]" $CONFIG_FILE > tmp.json && mv tmp.json $CONFIG_FILE
jq ".DelegatedRouting.ListenMultiaddr = env.DELEGATED_ROUTING_MULTIADDR" $CONFIG_FILE > tmp.json && mv tmp.json $CONFIG_FILE
jq ".DelegatedRouting.ProviderID = env.DELEGATED_ROUTING_PROVIDER_ID" $CONFIG_FILE > tmp.json && mv tmp.json $CONFIG_FILE
jq ".DelegatedRouting.ChunkSize = (env.DELEGATED_ROUTING_CHUNK_SIZE | tonumber)" $CONFIG_FILE > tmp.json && mv tmp.json $CONFIG_FILE
jq ".DelegatedRouting.SnapshotSize = (env.DELEGATED_ROUTING_SNAPSHOT_SIZE | tonumber)" $CONFIG_FILE > tmp.json && mv tmp.json $CONFIG_FILE
jq ".DelegatedRouting.Addrs = [env.DELEGATED_ROUTING_ADDRS]" $CONFIG_FILE > tmp.json && mv tmp.json $CONFIG_FILE

# Finally, execute the command provided to the entrypoint script
exec "$@"
