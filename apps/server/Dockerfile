FROM node:16-alpine AS builder
RUN apk add --no-cache libc6-compat
RUN apk update

WORKDIR /mikoto
RUN yarn global add turbo
COPY . .
RUN turbo prune --scope=web --docker

FROM node:alpine AS installer
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
WORKDIR /mikoto/apps/server
RUN npx prisma generate
RUN yarn build

FROM node:alpine AS runner
WORKDIR /mikoto/apps/server

CMD ["node", "./dist"]
