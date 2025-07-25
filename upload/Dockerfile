# Use Golang for building IPFS and plugins
FROM golang:1.24

LABEL maintainer "Ravish <ravish@lighthouse.storage>"

ENV AWS_SECRET_KEY     $AWS_SECRET_KEY
ENV AWS_ACCESS_KEY     $AWS_ACCESS_KEY
ENV AWS_REGION         $AWS_REGION
ENV AWS_S3_BUCKET      $AWS_S3_BUCKET
ENV AUTH_URL           $AUTH_URL
ENV LAMBDA_URL         $LAMBDA_URL
ENV AUTH_TOKEN         $AUTH_TOKEN

# Install dependencies
RUN apt update -y && \
    apt install -y curl ufw build-essential libpcre3 libpcre3-dev libssl-dev perl make unzip git luarocks zlib1g-dev

# Download & build OpenResty
WORKDIR /usr/local/src
RUN curl -LO https://openresty.org/download/openresty-1.21.4.2.tar.gz && \
    tar -xzvf openresty-1.21.4.2.tar.gz && \
    cd openresty-1.21.4.2 && \
    ./configure --prefix=/usr/local/openresty --with-luajit --with-http_v2_module && \
    make -j$(nproc) && make install

# Set OpenResty binary path
ENV PATH="/usr/local/openresty/bin:/usr/local/openresty/nginx/sbin:$PATH"

# Create config directory and copy template
RUN mkdir -p /etc/nginx/lua
COPY lua/config.lua.template /etc/nginx/lua/config.lua.template
COPY lua/auth.lua /etc/nginx/lua/auth.lua
COPY lua/dag_handlers.lua /etc/nginx/lua/dag_handlers.lua
COPY lua/utils.lua /etc/nginx/lua/utils.lua
COPY lua/api_handlers.lua /etc/nginx/lua/api_handlers.lua

# Clone IPFS & Install plugins
RUN git clone https://github.com/ipfs/kubo && \
    cd kubo && \
    go get github.com/lighthouse-web3/go-ds-s3/plugin@v0.14.0

# Add the plugin to the preload list.
RUN cd kubo && \
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

ENV IPFS_PATH=/data/ipfs
RUN mkdir -p ${IPFS_PATH} 
RUN ipfs init -p server

RUN ipfs config Datastore.StorageMax 1EB && \
    ipfs config Routing.Type none && \
    ipfs config Gateway.NoFetch --json true && \
    ipfs config Import.UnixFSChunker "size-1048576" && \
    ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '["*"]' && \
    ipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods '["GET", "POST", "OPTIONS"]' && \
    ipfs config Reprovider.Interval "0" && \
    ipfs bootstrap rm --all

RUN ipfs config --json Datastore.Spec "{\"mounts\":[{\"child\":{\"accessKey\":\"${AWS_ACCESS_KEY}\",\"bucket\":\"${AWS_S3_BUCKET}\",\"region\":\"${AWS_REGION}\",\"secretKey\":\"${AWS_SECRET_KEY}\",\"type\":\"s3ds\"},\"mountpoint\":\"/blocks\",\"prefix\":\"s3.datastore\",\"type\":\"measure\"},{\"child\": {\"compression\":\"none\",\"path\":\"datastore\",\"type\":\"levelds\"},\"mountpoint\": \"/\",\"prefix\":\"leveldb.datastore\",\"type\":\"measure\"}],\"type\":\"mount\"}"
RUN echo "{\"mounts\":[{\"bucket\":\"${AWS_S3_BUCKET}\",\"mountpoint\":\"/blocks\",\"region\":\"${AWS_REGION}\",\"rootDirectory\":\"\"},{\"mountpoint\":\"/\",\"path\":\"datastore\",\"type\":\"levelds\"}],\"type\":\"mount\"}" > $IPFS_PATH/datastore_spec

# Install Lua dependencies
RUN luarocks install lua-resty-http && luarocks install lua-cjson

# Copy OpenResty config
COPY openresty.conf /usr/local/openresty/nginx/conf/nginx.conf

# Ensure Nginx log directory exists
RUN mkdir -p /var/log/nginx

# Expose OpenResty
EXPOSE 80

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD ipfs id || exit 1

# Entrypoint script
RUN echo '#!/bin/sh' > /entrypoint.sh && \
    echo 'set -e' >> /entrypoint.sh && \
    echo 'sed -e "s|{{AUTH_URL}}|${AUTH_URL}|g" \' >> /entrypoint.sh && \
    echo '    -e "s|{{LAMBDA_URL}}|${LAMBDA_URL}|g" \' >> /entrypoint.sh && \
    echo '    -e "s|{{AUTH_TOKEN}}|${AUTH_TOKEN}|g" \' >> /entrypoint.sh && \
    echo '    /etc/nginx/lua/config.lua.template > /etc/nginx/lua/config.lua' >> /entrypoint.sh && \
    echo 'ipfs daemon &' >> /entrypoint.sh && \
    echo 'IPFS_PID=$!' >> /entrypoint.sh && \
    echo 'sleep 5' >> /entrypoint.sh && \
    echo 'echo "Starting OpenResty (Nginx)..."' >> /entrypoint.sh && \
    echo 'openresty -g "daemon off;" &' >> /entrypoint.sh && \
    echo 'NGINX_PID=$!' >> /entrypoint.sh && \
    echo 'tail -F /var/log/ipfs/ipfs.log & TAIL_PID=$!' >> /entrypoint.sh && \
    echo 'wait $IPFS_PID $NGINX_PID' >> /entrypoint.sh && \
    chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]