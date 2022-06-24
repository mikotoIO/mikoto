FROM node:16-alpine

WORKDIR /app
RUN corepack enable

COPY ["package.json", "./"]
RUN yarn

RUN ["yarn", "build"]
CMD ["npx", "serve", "-s", "build"]
