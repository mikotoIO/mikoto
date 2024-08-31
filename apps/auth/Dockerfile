FROM rust:1.77-alpine as base
RUN cargo install cargo-chef --version ^0.1

# https://depot.dev/blog/rust-dockerfile-best-practices
FROM base AS planner
WORKDIR /mikoto
COPY . .
RUN cargo chef prepare --recipe-path recipe.json

FROM base as builder
RUN apk add --no-cache musl-dev openssl-dev
RUN apk update

WORKDIR /mikoto
COPY --from=planner /app/recipe.json recipe.json
RUN cargo chef cook --release --recipe-path recipe.json
COPY . .

WORKDIR /mikoto/apps/auth
RUN cargo build --release

FROM alpine:latest
COPY --from=builder /mikoto/target/release/superego superego
CMD ["./superego"]