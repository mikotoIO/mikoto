FROM rust:1.77-bullseye as builder

WORKDIR /mikoto
COPY . .

WORKDIR /mikoto/apps/content-proxy
RUN cargo build --release

FROM debian:bullseye-slim
COPY --from=builder /mikoto/target/release/content-proxy content-proxy
CMD ["./content-proxy"]