FROM node:20-alpine as build

WORKDIR /app

RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile

WORKDIR /app/apps/client
RUN ["pnpm", "build"]

FROM nginx:stable-alpine
COPY --from=build /app/apps/client/dist /usr/share/nginx/html
COPY ./apps/client/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
