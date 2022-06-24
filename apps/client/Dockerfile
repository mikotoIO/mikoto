FROM node:16-alpine

WORKDIR /app
RUN corepack enable

COPY ["package.json", "yarn.lock", "./"]
RUN yarn

RUN ["yarn", "build"]
CMD ["npx", "serve", "-s", "build"]
