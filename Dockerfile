# Define build argument - build
ARG BASE_IMAGE=docker.io/node:22.7-alpine3.19

# Use Node.js base image
FROM $BASE_IMAGE

# Install Python, AWS CLI, and CA certificates
RUN apk add --no-cache python3 jq make g++ && ln -sf python3 /usr/bin/python && \
    apk add --no-cache curl ca-certificates

# Download AWS RDS combined CA bundle
RUN curl https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem -o /etc/ssl/certs/rds-global-bundle.crt

# Set NODE_EXTRA_CA_CERTS to include AWS RDS combined CA bundle
ENV NODE_EXTRA_CA_CERTS=/etc/ssl/certs/rds-global-bundle.crt

# Disable TLS certificate validation (use with caution)
#ENV NODE_TLS_REJECT_UNAUTHORIZED=0

# Set the working directory
WORKDIR /app

COPY package*.json ./

# Install Node.js dependencies
RUN npm install --ignore-scripts

# FIX: Change from copy all files once all else is working
COPY . .

# Create an .env file - no secrets to this file
RUN if [ -f "docker-env" ]; then \
        cp docker-env .env; \
    else \
        echo "PINECONE_INDEX_NAME=api-index-2" > .env && \
        echo "NEXT_PUBLIC_BASE_URL=http://localhost:3000" >> .env && \
        echo "ENABLE_SHARE=true" >> .env; \
    fi

# Build the Next.js application
RUN npm run build

# Expose port 3000 for the application
EXPOSE 3000

# Copy the entrypoint script
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Start the application
ENTRYPOINT ["/app/entrypoint.sh"]
