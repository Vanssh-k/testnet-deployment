FROM golang:1.22
ENV PEER_ID=""
ENV PRIV_KEY=""
ENV BITSWAP_PORT=""
RUN apt-get update && apt-get install -y jq git make
RUN git clone https://github.com/ipfs/kubo && \
    cd kubo && \
    git checkout v0.28.0 && \
    go get github.com/lighthouse-web3/go-ds-s3/plugin@v0.14.0
RUN cd kubo && \
    echo "\ns3ds github.com/lighthouse-web3/go-ds-s3/plugin 0" >> plugin/loader/preload_list && \
    make build && \
    go mod tidy && \
    make install && \
    cp cmd/ipfs/ipfs /usr/local/bin/ipfs
EXPOSE 5001
EXPOSE ${BITSWAP_PORT}
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
