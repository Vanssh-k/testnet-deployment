FROM golang:1.22

LABEL maintainer "Ravish <ravish@lighthouse.storage>"

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
ARG GITHUB_TOKEN
ARG IPFS_ENDPOINT
ARG ROUTE_ACCESS_TOKEN
ARG PORT
ARG LAMBDA_URL
ARG ENVIRONMENT

ENV AWS_SECRET_KEY     $AWS_SECRET_KEY
ENV AWS_ACCESS_KEY     $AWS_ACCESS_KEY
ENV AWS_REGION         $AWS_REGION
ENV AWS_S3_BUCKET      $AWS_S3_BUCKET
ENV GITHUB_TOKEN       $GITHUB_TOKEN
ENV IPFS_ENDPOINT      $IPFS_ENDPOINT
ENV ROUTE_ACCESS_TOKEN $ROUTE_ACCESS_TOKEN
ENV PORT               $PORT
ENV LAMBDA_URL         $LAMBDA_URL
ENV ENVIRONMENT        $ENVIRONMENT


RUN mkdir -p ${IPFS_PATH} 
RUN ipfs init
    
RUN ipfs config Datastore.StorageMax 1EB && \
    ipfs config Routing.Type none && \
    ipfs bootstrap rm --all && \
    ipfs bootstrap add /ip4/65.0.133.240/tcp/4001/p2p/12D3KooWQGEFLVcVshXvxt5V7AGn9SNUKtwMTRtpFacfVUUxrrDu && \
    ipfs bootstrap add /ip4/65.0.133.240/udp/4001/quic-v1/p2p/12D3KooWQGEFLVcVshXvxt5V7AGn9SNUKtwMTRtpFacfVUUxrrDu

RUN ipfs config --json Datastore.Spec "{\"mounts\":[{\"child\":{\"accessKey\":\"${AWS_ACCESS_KEY}\",\"bucket\":\"${AWS_S3_BUCKET}\",\"region\":\"${AWS_REGION}\",\"secretKey\":\"${AWS_SECRET_KEY}\",\"type\":\"s3ds\"},\"mountpoint\":\"/blocks\",\"prefix\":\"s3.datastore\",\"type\":\"measure\"},{\"child\": {\"compression\":\"none\",\"path\":\"datastore\",\"type\":\"levelds\"},\"mountpoint\": \"/\",\"prefix\":\"leveldb.datastore\",\"type\":\"measure\"}],\"type\":\"mount\"}"

RUN echo "{\"mounts\":[{\"bucket\":\"${AWS_S3_BUCKET}\",\"mountpoint\":\"/blocks\",\"region\":\"${AWS_REGION}\",\"rootDirectory\":\"\"},{\"mountpoint\":\"/\",\"path\":\"datastore\",\"type\":\"levelds\"}],\"type\":\"mount\"}" > $IPFS_PATH/datastore_spec

RUN apt update -y && \
    curl -sL https://deb.nodesource.com/setup_16.x -o /tmp/nodesource_setup.sh && \
    bash /tmp/nodesource_setup.sh && \
    apt install nodejs && \
    echo "NODE VERSION $(node --version)"

RUN git clone https://lighthouse-web3:${GITHUB_TOKEN}@github.com/lighthouse-web3/ipfs-node-auth.git proxy && \
    cd proxy && \
    npm install && \
    npm install -g pm2 && \
    pm2 install pm2-logrotate

RUN echo "PM2 VERSION -- $(pm2 --version)" && \
    stat proxy/app.js

RUN apt update && \
    apt install nginx -y && \
    apt install -y curl ufw && \
    ufw allow ssh && \
    ufw allow 'Nginx Full'

COPY config /etc/nginx/sites-available/default

# start nginx and verify config update
RUN nginx -t && \
    service nginx start

ENV NGINX_PORT 80
EXPOSE ${NGINX_PORT}

# by default, run `ipfs daemon` to start as a running node
ENTRYPOINT service nginx restart && pm2 start proxy/app.js && ipfs daemon
