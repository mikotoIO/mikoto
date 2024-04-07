FROM rust:1.74-alpine3.14 as builder

WORKDIR /mikoto
COPY . .

WORKDIR /mikoto/apps/content-proxy
RUN cargo build --release

FROM alpine:3.14
RUN apk --no-cache add ca-certificates
COPY --from=builder /mikoto/target/release/content-proxy content-proxy
CMD ["./content-proxy"]