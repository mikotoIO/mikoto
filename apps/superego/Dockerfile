FROM rust:1.77-alpine AS base
RUN apk add --no-cache musl-dev openssl-dev
RUN apk update
RUN cargo install sccache --version ^0.8
RUN cargo install cargo-chef --version ^0.1
ENV RUSTC_WRAPPER=sccache SCCACHE_DIR=/sccache

# https://depot.dev/blog/rust-dockerfile-best-practices
FROM base AS planner
WORKDIR /mikoto
COPY . .
RUN --mount=type=cache,target=$SCCACHE_DIR,sharing=locked \
    cargo chef prepare --recipe-path recipe.json

FROM base AS builder
WORKDIR /mikoto
COPY --from=planner /mikoto/recipe.json recipe.json
RUN --mount=type=cache,target=$SCCACHE_DIR,sharing=locked \
    cargo chef cook --release --recipe-path recipe.json
COPY . .

WORKDIR /mikoto/apps/superego
RUN --mount=type=cache,target=$SCCACHE_DIR,sharing=locked \
    cargo build --release
FROM alpine:latest
COPY --from=builder /mikoto/target/release/superego superego
CMD ["./superego"]