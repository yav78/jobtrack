#!/bin/bash

echo "Building and transferring the application..."
docker compose build app
echo "Saving the application..."
docker save jobtrack:latest | gzip > jobtrack_latest.tar.gz
echo "Transferring the application..."
scp jobtrack_latest.tar.gz toto@192.168.1.33:./jobtrack

echo "Connecting to the server..."
ssh toto@192.168.1.33 "cd jobtrack && docker load < jobtrack_latest.tar.gz && rm jobtrack_latest.tar.gz && docker compose up -d --remove-orphans && docker compose exec -it app npx prisma migrate deploy"
echo "Application transferred and started successfully."

echo "Removing the application..."
rm jobtrack_latest.tar.gz