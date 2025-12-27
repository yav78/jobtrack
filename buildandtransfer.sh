#!/bin/bash

docker compose build app
docker save jobtrack:latest | gzip > jobtrack_latest.tar.gz
scp jobtrack_latest.tar.gz toto@192.168.1.33:./jobtrack
rm jobtrack_latest.tar.gz
ssh toto@192.168.1.33
cd jobtrack
docker load < jobtrack_latest.tar.gz
docker compose up -d