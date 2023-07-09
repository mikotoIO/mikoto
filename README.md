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

## Setup

### Development

Mikoto uses a turborepo-based monorepo.

Use Docker Compose to run the necessary services.

To develop all apps and packages, run the following command:

```
yarn start
```

To browse/edit the Database run the following command:

```
cd apps/server
prisma studio
```

### Build

To build all apps and packages, run the following command:

```
yarn build
```

## License

Mikoto is currently dual licensed under AGPL and a proprietary license. Please email cactus (at) mikoto.io if you are interested in enterprise uses for Mikoto.
