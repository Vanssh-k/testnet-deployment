# IPNS-IPNI Service

The `ipns-ipni` directory contains Docker configurations for setting up and running an integrated IPNS (InterPlanetary Name Service) and IPNI (Index Provider Network Interface) service. This setup is designed to leverage IPNS for naming system functionalities within the IPFS network, alongside IPNI for indexing and retrieval capabilities, with optional support for AWS S3 as a datastore backend.

## Directory Structure

- `docker-compose.yml`: Docker Compose configuration file to orchestrate the IPNS-IPNI service container.

## Prerequisites

- Docker and Docker Compose installed on your system.
- An AWS account and an S3 bucket for the IPFS datastore backend (optional).

## Configuration

1. **Environment Variables**: Configure the necessary environment variables directly in the `docker-compose.yml` file or in an `.env` file in the same directory:

    ```env
    IP_ADDRESS_SELF=INSTANCE_IP
    AWS_SECRET_KEY=YOUR_AWS_SECRET_KEY
    AWS_ACCESS_KEY=YOUR_AWS_ACCESS_KEY
    AWS_REGION=YOUR_AWS_REGION
    AWS_S3_BUCKET=YOUR_AWS_S3_BUCKET
    ```

2. **Docker Compose**: Ensure the `docker-compose.yml` file is correctly set up with your specific environment variables for AWS credentials, IP addresses, etc.

## Running the Service

To start the IPNS-IPNI service, run the following command in the directory containing your `docker-compose.yml`:

    ```bash
    docker-compose up --build
    ```

This command builds the Docker image and starts the services as defined in `docker-compose.yml`. The environment variables are applied automatically.

## Service Ports

The service exposes several ports for IPFS daemon, IPFS gateway, and IPNI service communications:

- IPFS Swarm: `4001`
- IPFS API: `5001`
- IPFS Gateway: `8080`
- IPNI Service and additional ports: `3103`, `3105`, `3102`, `50617`

## Customizing Configuration

Review and customize the configurations as necessary, particularly if you're using an AWS S3 backend or require specific network configurations.

## Troubleshooting

- Ensure all environment variables are correctly configured.
- Check the Docker container logs for any startup or runtime errors:

    ```bash
    docker-compose logs -f
    ```

- Verify AWS S3 configurations if using S3 as the datastore backend.

## Contributing

For contributions, please fork the repository, make your changes, and submit a pull request with a clear description of your modifications.
