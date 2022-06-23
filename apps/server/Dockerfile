FROM node:16-alpine

WORKDIR /app
RUN corepack enable

COPY ["package.json", "yarn.lock", "./"]
RUN yarn

COPY . .
RUN npx prisma generate
RUN tsc

CMD ["node", "./dist"]