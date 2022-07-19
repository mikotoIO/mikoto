FROM node:16-alpine as build

WORKDIR /app
RUN corepack enable

COPY ["package.json", "./"]
RUN yarn

COPY . .

RUN ["yarn", "build"]

FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
