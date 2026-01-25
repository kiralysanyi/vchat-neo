# Vchat Neo

A full rewrite of one of my oldest projects

## Table of Contents

* [About](#about)
* [Setup](#setup)
* [Notes](#notes)


## About

Vchat neo is a video chat application. In its current state I would not recommend to put it into production.

The main goal was to create a video chat application that is simple to set up and use, and to have a high quality screen sharing function.

## Setup

It's recommended to use docker for setting up Vchat neo, currently only testing branch is available.

Here is an example docker compose file. (Note: you will need a reverse proxy with tls to work properly)

```yaml
name: vchat

services:
  server:
    container_name: vchat-neo
    image: ghcr.io/kiralysanyi/vchat-neo:testing
    network_mode: host 
    restart: unless-stopped
    healthcheck:
      disable: false
    environment:
      - LISTEN_IPS=127.0.0.1,192.168.1.165 # ips to announce for clients (should be accessable from all clients, or else you will get blank video)
      - PORT=8080
      - WORKERS=2 # count of worker threads, should not be bigger then cpu core/thread count
      - SERVERPASS=valami # if you set this then this password will be asked before creating a new meeting
      - CLEANUP_INTERVAL=30 # basically the time of keeping rooms alive without participants (minutes, default: 60)
```

## Notes

You need to put this behind a reverse proxy with tls to make it work properly as webrtc and related functions require a secure connection to work.