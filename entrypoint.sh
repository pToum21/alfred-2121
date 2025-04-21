#!/bin/sh

# Set the environment variables
export POSTGRES_USER=$DB_USER

# Fetch the POSTGRES_PASSWORD from AWS Secrets Manager
EXTRACTED_PASSWORD=`echo $DB_PASSWORD | jq -r '.password'`
ENCODED_PASSWORD=$(python3 -c "import urllib.parse; print(urllib.parse.quote('${EXTRACTED_PASSWORD}'))")

export POSTGRES_URL="postgres://${POSTGRES_USER}:${ENCODED_PASSWORD}@${DB_ENDPOINT}/${DB_NAME}?sslmode=require"
export POSTGRES_URL_NON_POOLING=$POSTGRES_URL

# Start the application
export JWT_SECRET=${ALFRED_JWT_SECRET}

exec npm start
