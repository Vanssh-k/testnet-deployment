# Use the official Go image with version 1.20.6
FROM golang:1.20.6

# Install necessary tools (curl for downloading, jq for JSON processing)
RUN apt-get update && apt-get install -y curl jq

# Set the working directory to /root
WORKDIR /root

# Install the index-provider tool
RUN go install github.com/ipni/index-provider/cmd/provider@v0.14.2

# Initialize the provider
RUN provider init

# Copy the entrypoint script into the container
COPY entrypoint.sh /root/entrypoint.sh

# Make sure the script is executable
RUN chmod +x /root/entrypoint.sh

# Set the entrypoint script
ENTRYPOINT ["/root/entrypoint.sh"]

# Default command to run when starting the container
CMD ["provider", "daemon"]
