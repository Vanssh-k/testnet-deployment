# IPFS Indexer Service

This project sets up an IPFS Indexer Service designed to index Content Identifiers (CIDs) on `cid.contact`, making them available on `ipfs.io`. It includes two instances of the index provider for different uses: one for the main IPFS network and another for IPNS (InterPlanetary Name Service). 

## Overview

The service utilizes Docker and Docker Compose to create a reproducible and scalable deployment. The Docker setup includes two services:

- `provider-service1`: An index provider for the main IPFS network.
- `provider-service2`: An index provider for IPNS.

Both services are built from a Dockerfile that prepares a Golang environment, installs necessary tools, and configures the index provider command-line tool.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- Docker
- Docker Compose
- Git (for cloning this repository)

## Setup Instructions

1. **Clone the Repository**

   Start by cloning this repository to your local system. This contains the Dockerfile, Docker Compose configuration, and the entrypoint script necessary to run the service.

   ```bash
   git clone https://github.com/lighthouse-web3/deployments.git
   cd deployments/ipni
   ```

2. **Environment Configuration**

   Copy the `.env.example` file to a new file named `.env` and fill in the environment variables with your specific values. This includes IP addresses for the IPFS nodes and peer IDs for the Kubo nodes.

   ```bash
   cp .env.example .env
   ```

3. **Building and Running the Service**

   Use Docker Compose to build and start the services. This command also detaches the terminal from the running containers, allowing them to run in the background.

   ```bash
   docker-compose up --build -d
   ```

4. **Verify the Services**

   Ensure both index provider instances are running correctly. You can check the logs of each service to verify their operation.

   ```bash
   docker-compose logs -f provider-service1
   docker-compose logs -f provider-service2
   ```

   To stop following the logs, press `CTRL+C`.

## Service Description

- **IPFS Indexer**: The core functionality is to index CIDs, making the content they reference available through the IPFS network. This service supports the decentralized sharing and accessing of content.

- **Main IPFS and IPNS Services**: Two instances of the index provider run simultaneously, each configured for specific roles within the IPFS ecosystem. One focuses on the main IPFS network, facilitating content sharing and discovery, while the other specializes in IPNS, enabling the resolution of mutable content.

## Customizing the Configuration

The `entrypoint.sh` script automatically adjusts the index provider's configuration based on environment variables set in the `.env` file. You can modify these variables to change the behavior of the index provider services as needed.

## Stopping the Service

To stop the running services and remove the containers, use the following Docker Compose command:

```bash
docker-compose down
```

## Conclusion

This setup provides a scalable and easy-to-manage approach for running IPFS index providers, essential for enhancing content discoverability within the IPFS network. By indexing CIDs on `cid.contact`, it contributes to the broader IPFS ecosystem, making content more accessible through `ipfs.io`.
