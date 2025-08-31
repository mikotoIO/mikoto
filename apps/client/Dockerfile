FROM node:20-alpine as build

WORKDIR /app

RUN corepack enable
COPY ["package.json", "./"]
RUN pnpm install --frozen-lockfile
COPY . .

RUN ["pnpm", "build"]

FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY ./apps/client/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3519
CMD ["nginx", "-g", "daemon off;"]
