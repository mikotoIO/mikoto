FROM node:16-alpine

WORKDIR /mikoto
RUN corepack enable

COPY package.json ./
COPY package-lock.json ./
RUN yarn

COPY . .

WORKDIR /mikoto/apps/server

RUN npx prisma generate
RUN yarn build

CMD ["node", "./dist"]
