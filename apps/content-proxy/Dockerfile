FROM rust:1.77-alpine as builder
RUN apk add --no-cache musl-dev openssl-dev
RUN apk update

WORKDIR /mikoto
COPY . .

WORKDIR /mikoto/apps/content-proxy
RUN cargo build --release

FROM alpine:latest
COPY --from=builder /mikoto/target/release/content-proxy content-proxy
CMD ["./content-proxy"]