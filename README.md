<h1 align="center">
  Mikoto
</h1>


<p align="center">Turbocharge Your Community.</p>

## What's inside?

This turborepo uses [Yarn](https://classic.yarnpkg.com/lang/en/) as a package manager. It includes the following packages/apps:

- `apps/client`: the Mikoto front-end
- `apps/server`: the Mikoto back-end and API

We use TypeScript and Rust.

## Setup

### Development

#### Prerequisites:

- A PostgreSQL database (I think CockroachDB works as well)
  - there exists a compose file at `apps/server/docker-compose.development.yml` to help with this.
- `.env` file in `apps/server` (see the provided example file for details)
- As of now, that's about it.

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

## Utilities

This turborepo has some additional tools already setup for you:

- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [ESLint](https://eslint.org/) for code linting
- [Prettier](https://prettier.io) for code formatting

### Remote Caching

Turborepo can use a technique known as [Remote Caching (Beta)](https://turborepo.org/docs/features/remote-caching) to share cache artifacts across machines, enabling you to share build caches with your team and CI/CD pipelines.

By default, Turborepo will cache locally. To enable Remote Caching (Beta) you will need an account with Vercel. If you don't have an account you can [create one](https://vercel.com/signup), then enter the following commands:

```
npx turbo login
```

This will authenticate the Turborepo CLI with your [Vercel account](https://vercel.com/docs/concepts/personal-accounts/overview).

Next, you can link your Turborepo to your Remote Cache by running the following command from the root of your turborepo:

```
npx turbo link
```

### Useful Links

Learn more about the power of Turborepo:

- [Pipelines](https://turborepo.org/docs/features/pipelines)
- [Caching](https://turborepo.org/docs/features/caching)
- [Remote Caching (Beta)](https://turborepo.org/docs/features/remote-caching)
- [Scoped Tasks](https://turborepo.org/docs/features/scopes)
- [Configuration Options](https://turborepo.org/docs/reference/configuration)
- [CLI Usage](https://turborepo.org/docs/reference/command-line-reference)
