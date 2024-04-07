# FROM ubuntu:20.04
FROM golang:1.20.1

LABEL maintainer "Ravish <ravish@lighthouse.storage>"

# clone ipfs [!! Some issues seems to be occuring with the private package - will review later !!]
RUN git clone https://github.com/ipfs/go-ipfs && \
    cd go-ipfs && \
    go env -w GOPRIVATE="github.com/lighthouse-web3" && \
    #git checkout release-v0.15.0 && \
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
ARG GITHUB_TOKEN
ARG IPFS_ENDPOINT
ARG ROUTE_ACCESS_TOKEN

ENV AWS_SECRET_KEY  $AWS_SECRET_KEY
ENV AWS_ACCESS_KEY  $AWS_ACCESS_KEY
ENV AWS_REGION      $AWS_REGION
ENV AWS_S3_BUCKET   $AWS_S3_BUCKET
ENV GITHUB_TOKEN    $GITHUB_TOKEN
ENV IPFS_ENDPOINT   $IPFS_ENDPOINT
ENV ROUTE_ACCESS_TOKEN $ROUTE_ACCESS_TOKEN

RUN mkdir -p ${IPFS_PATH} 

# no need to for this as docker runs in root user mode
# RUN chown ubuntu:ubuntu ${IPFS_PATH}

# configure ipfs for production
RUN ipfs init
    
RUN ipfs config Datastore.StorageMax 1EB && \
    ipfs config Routing.Type none && \
    ipfs bootstrap rm --all && \
    ipfs bootstrap add /ip4/10.0.11.253/tcp/4001/p2p/12D3KooWHtY4F8aEkvYwXR5uVDfRXxu3N1cJvheHMRdrvNsHpTQ6

RUN ipfs config --json Datastore.Spec "{\"mounts\":[{\"child\":{\"accessKey\":\"${AWS_ACCESS_KEY}\",\"bucket\":\"${AWS_S3_BUCKET}\",\"region\":\"${AWS_REGION}\",\"secretKey\":\"${AWS_SECRET_KEY}\",\"type\":\"s3ds\"},\"mountpoint\":\"/blocks\",\"prefix\":\"s3.datastore\",\"type\":\"measure\"},{\"child\": {\"compression\":\"none\",\"path\":\"datastore\",\"type\":\"levelds\"},\"mountpoint\": \"/\",\"prefix\":\"leveldb.datastore\",\"type\":\"measure\"}],\"type\":\"mount\"}"

RUN echo "{\"mounts\":[{\"bucket\":\"${AWS_S3_BUCKET}\",\"mountpoint\":\"/blocks\",\"region\":\"${AWS_REGION}\",\"rootDirectory\":\"\"},{\"mountpoint\":\"/\",\"path\":\"datastore\",\"type\":\"levelds\"}],\"type\":\"mount\"}" > $IPFS_PATH/datastore_spec

RUN git clone git@github.com:lighthouse-web3/data-migration.git migration-service && \
    cd migration-service && \
    go build -o migrator main.go

ENV API_PORT 5001
ENV GATEWAY_PORT 8080
ENV SWARM_PORT 4001
ENV PROXY_PORT 5050
ENV NGINX_PORT 80

EXPOSE ${SWARM_PORT}
EXPOSE ${API_PORT}
EXPOSE ${GATEWAY_PORT}
EXPOSE ${PROXY_PORT}
EXPOSE ${NGINX_PORT}

ENTRYPOINT service nginx restart && pm2 start migration-service/migrator && ipfs daemon
