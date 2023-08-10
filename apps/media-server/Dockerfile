FROM node:18-alpine AS builder
RUN apk add --no-cache libc6-compat
RUN apk update

WORKDIR /mikoto
RUN yarn global add turbo
COPY . .
RUN turbo prune --scope=media-server --docker

FROM node:18-alpine AS installer
RUN apk add --no-cache libc6-compat
RUN apk update
WORKDIR /mikoto

# First install the dependencies (as they change less often)
COPY .gitignore .gitignore
COPY --from=builder /mikoto/out/json/ .
COPY --from=builder /mikoto/out/yarn.lock ./yarn.lock
RUN yarn install

# Build the project
COPY --from=builder /mikoto/out/full/ .
WORKDIR /mikoto/apps/media-server
RUN yarn build

FROM node:18-alpine AS runner
COPY --from=installer /mikoto /mikoto
COPY --from=installer /mikoto/node_modules /mikoto/node_modules
WORKDIR /mikoto/apps/media-server

CMD ["node", "./dist"]
