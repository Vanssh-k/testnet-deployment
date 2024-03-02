# IPFS-IPNI Service

The `ipfs-ipni` directory contains Docker configurations for setting up and running an integrated IPFS and IPNI (Index Provider Network Interface) service. This service is designed to leverage IPFS for distributed file storage and IPNI for indexing and retrieval capabilities, with support for AWS S3 as a datastore backend.

## Directory Structure

- `docker-compose.yml`: Docker Compose configuration file to orchestrate the IPFS-IPNI service container.
- `Dockerfile`: Dockerfile to build the IPFS-IPNI service image, including IPFS setup with AWS S3 plugin and IPNI service installation.
- `entrypoint.sh`: Entrypoint script for the Docker container to initialize and configure IPFS and IPNI services.
- `.env.example`: Example environment file containing placeholders for configuration variables required by the Docker Compose file and services.

## Prerequisites

- Docker and Docker Compose installed on your system.
- An AWS account and an S3 bucket for IPFS datastore backend (optional).

## Configuration

1. **Environment Variables**: Copy `.env.example` to `.env` and fill in the values for your setup:
    ```bash
    cp .env.example .env
    ```
    Edit `.env` with your actual configuration values for AWS credentials, IP addresses, etc.

2. **Dockerfile and Entrypoint Script**: Review the `Dockerfile` and `entrypoint.sh` to ensure they match your required configurations, especially if you're using custom settings or a different backend than AWS S3.

## Running the Service

To start the IPFS-IPNI service:

```bash
docker-compose up --build
```

This command builds the Docker image from the `Dockerfile`, sets up volumes for persistent storage, and starts the services as defined in `docker-compose.yml`. The environment variables from `.env` are automatically applied.

## Service Ports

The service exposes several ports as defined in `docker-compose.yml`, which are used for IPFS daemon, IPFS gateway, and IPNI service communications:

- IPFS Swarm: `4001`
- IPFS API: `5001`
- IPFS Gateway: `8080`
- IPNI Service and additional ports: `3103`, `3105`, `3102`, `50617`

## Customizing Configuration

- **IPFS Configuration**: Custom IPFS configurations can be applied in `entrypoint.sh`. This includes datastore specifications, API/Gateway addresses, and custom routing configurations.
- **IPNI Configuration**: The IPNI service configurations are dynamically set using environment variables and `jq` commands within `entrypoint.sh`.

For detailed customization, refer to the official documentation of IPFS (https://docs.ipfs.io) and the IPNI GitHub repository.

## Troubleshooting

- Ensure all environment variables are correctly set in `.env`.
- Check the Docker container logs for any errors during startup or operation:
    ```bash
    docker-compose logs -f
    ```
- Verify that AWS S3 configurations are correct if using S3 as the datastore.