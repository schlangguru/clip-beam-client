<img src="https://raw.githubusercontent.com/schlangguru/clip-beam-client/master/public/img/logo.svg" alt="clip-beam logo" title="Clip Beam" align="right" height="50" />

# Clip Beam Client

![GitHub](https://img.shields.io/github/license/schlangguru/clip-beam-client)

Clip Beam lets you transfer your data easily between two devices on the same network. Just connect the devices by scanning a QR code and start sharing.

Clip Beam uses [WebRTC](https://webrtc.org/) to transfer your data, meaning all messages are transfered directly between devices without sending them to any server.

![Clip Beam](https://raw.githubusercontent.com/schlangguru/clip-beam-client/master/assets/demo.png)

## Table of content

- [Quick Start](#quick-setup)
- [Setup](#setup)
  - [Client](#setup-the-client)
  - [Signaling Server](#setup-the-signaling-server)
- [Inspiration and Alternatives](#inspiration-and-alternatives)

## Quick Start

1. Clone the [signaling server](https://github.com/schlangguru/clip-beam-server)

- `cd clip-beam-server`
- `npm install`
- `npm run dev`

2. Clone the [client](https://github.com/schlangguru/clip-beam-client)

- `cd clip-beam-client`
- `npm install`
- `npm run serve`
- Go to [localhost:8080](localhost:8080)

## Setup

To setup your own instance of Clip Beam you need to setup the [signaling server](https://github.com/schlangguru/clip-beam-server) and host the frontend as simple HTML website.

### Setup the client

Clone this repository and use the following commands:

```bash
# install dependencies
npm install
# serve locally
npm run serve
# build for the distribution
npm run build
```

### Client Configuration

You can configure the url of the signaling server. Per default the client assumes to reach the signaling server on localhost. To change this you need to create a `.env.local` file with the following content.

```
VUE_APP_SERVER_URL=wss://my-url.com:9090
```

Rever to the Vue.js documentation [on environment variables](https://cli.vuejs.org/guide/mode-and-env.html#environment-variables) for more details.

### Setup the signaling server

See installation instructions for the [signaling server](https://github.com/schlangguru/clip-beam-server)

## Inspiration and Alternatives

I used to use [Threema Web](https://github.com/threema-ch/threema-web) and its echo chat to quickly send web links from my smartphone to my computer. Clip Beam works exactly the same way, but unlike Threema it is not a messenger, but only designed for sharing data between two devices.

Alternatives i've found are

- [Sharedrop](https://github.com/RobinLinus/snapdrop)
- [Snapdrop](https://github.com/RobinLinus/snapdrop)

but unlike these apps, Clip Beam does not allow connections between any devices on the same network. It rather connects two devices directly by scanning its QR code, so no one can send you unwanted data.
