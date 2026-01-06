#!/usr/bin/env bash

set -e

echo "pull latest code"
git fetch origin master
git pull origin master

echo "rebuild and restart container"
docker compose up -d --build 

echo "reload caddy"
sudo systemctl reload caddy

echo "deploy complete"
