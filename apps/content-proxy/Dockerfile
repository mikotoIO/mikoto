FROM rust:1.74-alpine3.14 as builder

COPY . /mikoto
WORKDIR /mikoto/apps/content-proxy

RUN cargo build
CMD ["cargo", "run"]
