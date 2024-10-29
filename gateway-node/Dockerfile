FROM golang:1.23

RUN git clone https://github.com/ipfs/go-ipfs && \
    cd go-ipfs && \
    go get github.com/lighthouse-web3/go-ds-s3/plugin@v0.14.0

# Add the plugin to the preload list.
RUN cd go-ipfs && \
    echo "\ns3ds github.com/lighthouse-web3/go-ds-s3/plugin 0" >> plugin/loader/preload_list &&\
    cat plugin/loader/preload_list && \
    cat plugin/loader/preload.go && \
    make build && \
    go mod tidy && \
    make build && \
    make install && \
    cp cmd/ipfs/ipfs /usr/local/bin/ipfs

# checkpoint --- echo ipfs version
RUN ipfs version
RUN  echo "IPFS VERSION IS -- $(ipfs version)"

ENV IPFS_PATH /data/ipfs

# defining args to be passed in at build time
ARG AWS_SECRET_KEY
ARG AWS_ACCESS_KEY
ARG AWS_REGION
ARG AWS_S3_BUCKET

ENV AWS_SECRET_KEY     $AWS_SECRET_KEY
ENV AWS_ACCESS_KEY     $AWS_ACCESS_KEY
ENV AWS_REGION         $AWS_REGION
ENV AWS_S3_BUCKET      $AWS_S3_BUCKET

RUN mkdir -p ${IPFS_PATH} 

RUN ipfs init -p server

RUN ipfs config Routing.Type dht && \
    ipfs config Gateway.NoFetch --json true && \
    ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '["*"]' && \
    ipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods '["GET", "POST", "OPTIONS"]' && \
    ipfs bootstrap rm --all && \
    ipfs config --json Gateway.PublicGateways '{"localhost": null }'

RUN ipfs config --json Datastore.Spec "{\"mounts\":[{\"child\":{\"accessKey\":\"${AWS_ACCESS_KEY}\",\"bucket\":\"${AWS_S3_BUCKET}\",\"region\":\"${AWS_REGION}\",\"secretKey\":\"${AWS_SECRET_KEY}\",\"type\":\"s3ds\"},\"mountpoint\":\"/blocks\",\"prefix\":\"s3.datastore\",\"type\":\"measure\"},{\"child\": {\"compression\":\"none\",\"path\":\"datastore\",\"type\":\"levelds\"},\"mountpoint\": \"/\",\"prefix\":\"leveldb.datastore\",\"type\":\"measure\"}],\"type\":\"mount\"}"
RUN echo "{\"mounts\":[{\"bucket\":\"${AWS_S3_BUCKET}\",\"mountpoint\":\"/blocks\",\"region\":\"${AWS_REGION}\",\"rootDirectory\":\"\"},{\"mountpoint\":\"/\",\"path\":\"datastore\",\"type\":\"levelds\"}],\"type\":\"mount\"}" > $IPFS_PATH/datastore_spec
RUN ipfs config Addresses.API "/ip4/0.0.0.0/tcp/5001"
RUN ipfs config Addresses.Gateway "/ip4/0.0.0.0/tcp/8080"

ENV GATEWAY_PORT 8080
ENV SWARM_PORT 4001

EXPOSE ${GATEWAY_PORT}

ENTRYPOINT ipfs daemon