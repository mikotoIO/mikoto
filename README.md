<p align="center">
  <img src="./apps/client/public/logo/logo-mono.svg" width="64px">
</p>

<h1 align="center">
  Mikoto
</h1>

<p align="center">The Most Overkill Chat App in the World.</p>
<p align="center">
  <a href='https://mikoto.io'>Website</a> · 
  <a href='https://alpha.mikoto.io'>Alpha</a> ·
  <a href='https://twitter.com/mikotoIO'>Twitter</a>
</p>
<br>

Mikoto is an messaging service designed for building online communities. It uses a thread-based structure for text messaging, voice/video chat, and real-time collaborative wiki editing.

## Features

> Note: Mikoto is still in early development. Some of these features are not fully implemented.

- ✨ Open Source (with proprietary extensions for enterprise support)
- 🌐 Decentralized, using [Decentralized Identifiers](https://www.w3.org/TR/did-core/)
- 🧵 Threading system suitable for AI agent management
- 🔍 Semantic search to fight against the black hole of information
- ⚡️ Superuser friendly features, like tab view, zen mode and, keyboard shortcuts and more
- 🔒 Fully E2E encrypted DMs and Group DMs
- 🏡 Threaded DMs and group DMs
- 🎨 Customizable themes and appearances
- 🔌 Pluggable architecture for custom extensions
- 🛒 A marketplace for extensions and integrations
- 🍻 Built-in community finder
- 🥸 A system to handle multiple personas and identities
- 📡 Voice, video, and screen sharing
- 📝 Real-time collaborative wiki channels

...and more, yet to be announced!

## Setup

```sh
yarn install
cd apps/server
npx prisma migrate dev
```

### Development

Mikoto uses a turborepo-based monorepo.

Use Docker Compose to run the necessary services.

To develop all apps and packages, run the following command:

```sh
yarn start
```

To browse/edit the Database run the following command:

```sh
cd apps/server
prisma studio
```

### Build

To build all apps and packages, run the following command:

```sh
yarn build
```

## Project Structure

| Package                 | Description               | Stack                                      |
| ----------------------- | ------------------------- | ------------------------------------------ |
| `apps/server`           | Core server for Mikoto    | NodeJS + TypeScript + HyperSchema + Prisma |
| `apps/media-server`     | S3 Proxy                  | NodeJS + TypeScript                        |
| `apps/client`           | The web client for Mikoto | React + MobX                               |
| `apps/mobile`           | Mobile client for Mikoto  | React Native + MobX                        |
| `apps/desktop`          | Desktop client for Mikoto | Electron + React + MobX                    |
| `packages/mikotojs`     | Mikoto API for JS         | TypeScript                                 |
| `packages/mikoto-perms` | Permisson Calculator      | TypeScript                                 |
| `packages/lucid`        | UI Framework              | React + TypeScript + Styled Components     |

## License

Mikoto is currently dual licensed under AGPL and a proprietary license. Please email cactus (at) mikoto.io if you are interested in enterprise uses for Mikoto.
