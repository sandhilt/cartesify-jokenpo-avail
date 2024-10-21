# syntax=docker.io/docker/dockerfile:1

# build stage: includes resources necessary for installing dependencies

FROM rust:1.82.0-bookworm AS wasm-builder-stage

RUN curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

WORKDIR /opt/cartesi/backend-rs
COPY ./backend-rs/ ./
RUN  wasm-pack build --target nodejs

# Here the image's platform does not necessarily have to be riscv64.
# If any needed dependencies rely on native binaries, you must use
# a riscv64 image such as cartesi/node:20-jammy for the build stage,
# to ensure that the appropriate binaries will be generated.
FROM node:20.16.0-bookworm AS build-stage

WORKDIR /opt/cartesi/dapp/backend
COPY ./backend/ ./
RUN mkdir -pv /opt/cartesi/dapp/backend-rs/pkg
COPY --from=wasm-builder-stage /opt/cartesi/backend-rs/pkg /opt/cartesi/dapp/backend-rs/pkg
RUN <<EOF
  npm install --verbose
  npm run build --verbose
EOF

# runtime stage: produces final image that will be executed

# Here the image's platform MUST be linux/riscv64.
# Give preference to small base images, which lead to better start-up
# performance when loading the Cartesi Machine.
FROM --platform=linux/riscv64 cartesi/node:20.16.0-jammy-slim

ARG MACHINE_EMULATOR_TOOLS_VERSION=0.14.1
ADD https://github.com/cartesi/machine-emulator-tools/releases/download/v${MACHINE_EMULATOR_TOOLS_VERSION}/machine-emulator-tools-v${MACHINE_EMULATOR_TOOLS_VERSION}.deb /
RUN dpkg -i /machine-emulator-tools-v${MACHINE_EMULATOR_TOOLS_VERSION}.deb \
  && rm /machine-emulator-tools-v${MACHINE_EMULATOR_TOOLS_VERSION}.deb

LABEL io.cartesi.rollups.sdk_version=0.9.0
LABEL io.cartesi.rollups.ram_size=128Mi

ARG DEBIAN_FRONTEND=noninteractive
RUN <<EOF
set -e
apt-get update
apt-get install -y --no-install-recommends \
  busybox-static=1:1.30.1-7ubuntu3
rm -rf /var/lib/apt/lists/* /var/log/* /var/cache/*
useradd --create-home --user-group dapp
EOF

ENV PATH="/opt/cartesi/bin:${PATH}"

WORKDIR /opt/cartesi/dapp
COPY --from=build-stage /opt/cartesi/dapp/backend/dist .
COPY --from=wasm-builder-stage /opt/cartesi/backend-rs/pkg/dapp_bg.wasm .

ENV ROLLUP_HTTP_SERVER_URL="http://127.0.0.1:5004"

ENTRYPOINT ["rollup-init"]
CMD ["node", "index.js"]
