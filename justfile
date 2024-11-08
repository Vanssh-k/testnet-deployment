#!/usr/bin/env just --justfile  # Shebang line to specify using 'just' for this file

set dotenv-load := true
load_env := `export $(grep -v '^#' .env | xargs)`

# Go commands for linting, testing, and building
GO := "go"  # Command for invoking Go

GOVET_COMMAND := GO + " vet"  # Command for Go vet tool (static analysis)
GOTEST_COMMAND := GO + " test"  # Command for running Go tests
GOCOVER_COMMAND := GO + " tool cover"  # Command for running Go coverage tool
GOBUILD_COMMAND := GO + " build"  # Command for building Go binaries


DOCKER_PRIVATE_NODE_IMAGE := "prod/kubo-private"
DOCKER_GATEWAY_NODE_IMAGE := "prod/kubo-gateway"


# ECR repository details
ECR_REPO := '050633092828.dkr.ecr.us-east-2.amazonaws.com'  # Define ECR (Elastic Container Registry) repository
ECR_REPO_NAME := ECR_REPO +"/"


# Docker commands for building and pushing images

DOCKER_BUILD_COMMAND := "docker build"  # Command for building Docker images
DOCKER_PUSH_COMMAND := "docker push"  # Command for pushing Docker images
DOCKER_TAG_COMMAND := "docker tag"  # Command for tagging Docker images

# Display all commands available in the Justfile
default:
    @just --list --unsorted  # Displays a list of all commands when `just` is run without arguments


# View the values of the AWS environment variables
view-env:
    {{load_env}}
    @echo "========================\n  AWS Environment Variables\n========================\nAWS_SECRET_KEY  : $AWS_SECRET_KEY\nAWS_ACCESS_KEY  : $AWS_ACCESS_KEY\nAWS_REGION      : $AWS_REGION\nAWS_S3_BUCKET   : $AWS_S3_BUCKET\n========================"

# Build the private node Docker image
build-kubo-private:
    {{load_env}}
    @echo "Building private node Docker image with AWS credentials..."
    {{DOCKER_BUILD_COMMAND}} \
      --platform=linux/amd64 \
      --build-arg AWS_SECRET_KEY=$AWS_SECRET_KEY \
      --build-arg AWS_ACCESS_KEY=$AWS_ACCESS_KEY \
      --build-arg AWS_REGION=$AWS_REGION \
      --build-arg AWS_S3_BUCKET=$AWS_S3_BUCKET \
      -t {{DOCKER_PRIVATE_NODE_IMAGE}} \
      -f ./upload-node/Dockerfile .


# Tag the kubo private Docker image
tag-kubo-private:
    @echo "Tagging the private node Docker image..."
    {{DOCKER_TAG_COMMAND}} {{DOCKER_PRIVATE_NODE_IMAGE}} {{ECR_REPO_NAME}}{{DOCKER_PRIVATE_NODE_IMAGE}}

# Push the private node Docker image to ECR
push-kubo-private:
    @echo "Pushing the private node Docker image to ECR..."
    {{DOCKER_PUSH_COMMAND}} {{ECR_REPO_NAME}}{{DOCKER_PRIVATE_NODE_IMAGE}}

# Build, tag, and push the kubo private node to Docker image
build-push-kubo-private: build-kubo-private tag-kubo-private push-kubo-private

# Deploy the kubo private node to Kubernetes
deploy-kubo-private: build-push-kubo-private
    @echo "Deploying the private node to Kubernates.."
    kubectl delete pods -l app=kubo-private -n prod 
    kubectl apply -f ./upload-node


# Manage Kong
deploy-kong:
     helm upgrade --install kong kong/ingress -n kong --values kong/core/values.yaml


# Extra commands for building plugins as configmap in k8s for kong

update-kong-plugins:
    kubectl delete configmap kong-kubo-response-plugin-cm -n kong
    kubectl create configmap kong-kubo-response-plugin-cm --from-file ./kong/plugins/kubo-response-plugin/src -n kong --dry-run=client --output=yaml > ./kong/core/plugins/kong-kubo-response-plugin-cm.yaml
    kubectl apply -f ./kong/core/plugins/kong-kubo-response-plugin-cm.yaml

    kubectl delete configmap kong-lighthouse-auth-plugin-cm -n kong
    kubectl create configmap kong-lighthouse-auth-plugin-cm --from-file ./kong/plugins/lighthouse-auth-plugin/src -n kong --dry-run=client --output=yaml > ./kong/core/plugins/kong-lighthouse-auth-plugin-cm.yaml
    kubectl apply -f ./kong/core/plugins/kong-lighthouse-auth-plugin-cm.yaml
    # have to restart kong-manager pod


# Build kubo-gateway
build-kubo-gateway:
    {{load_env}}
    @echo "Building kubo-gateway Docker image with AWS credentials..."
    {{DOCKER_BUILD_COMMAND}} \
      --platform=linux/amd64 \
      --build-arg AWS_SECRET_KEY=$AWS_SECRET_KEY \
      --build-arg AWS_ACCESS_KEY=$AWS_ACCESS_KEY \
      --build-arg AWS_REGION=$AWS_REGION \
      --build-arg AWS_S3_BUCKET=$AWS_S3_BUCKET \
      -t {{DOCKER_GATEWAY_NODE_IMAGE}} \
      -f ./gateway-node/Dockerfile .

# Tag the kubo-gateway Docker image
tag-kubo-gateway:
    @echo "Tagging the kubo-gateway Docker image..."
    {{DOCKER_TAG_COMMAND}} {{DOCKER_GATEWAY_NODE_IMAGE}} {{ECR_REPO_NAME}}{{DOCKER_GATEWAY_NODE_IMAGE}}

# Push the kubo-gateway Docker image to ECR
push-kubo-gateway:
    @echo "Pushing the kubo-gateway Docker image to ECR..."
    {{DOCKER_PUSH_COMMAND}} {{ECR_REPO_NAME}}{{DOCKER_GATEWAY_NODE_IMAGE}}

# Build, tag, and push the kubo-gateway to Docker image
build-push-kubo-gateway: build-kubo-gateway tag-kubo-gateway push-kubo-gateway

# Deploy the kubo-gateway to Kubernetes
deploy-kubo-gateway: build-push-kubo-gateway
    @echo "Deploying the kubo-gateway to Kubernates.."
    kubectl delete pods -l app=kubo-gateway -n prod 
    kubectl apply -f ./gateway-node

# Create configmap for kong plugins
create-kong-plugins:
    kubectl create configmap kong-kubo-response-plugin-cm --from-file ./kong/plugins/kubo-response-plugin/src -n kong --dry-run=client --output=yaml > ./kong/setup/plugins/kong-kubo-response-plugin-cm.yaml
    kubectl create configmap kong-lighthouse-auth-plugin-cm --from-file ./kong/plugins/lighthouse-auth-plugin/src -n kong --dry-run=client --output=yaml > ./kong/setup/plugins/kong-lighthouse-auth-plugin-cm.yaml