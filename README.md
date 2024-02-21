# Cartesify Rock Paper Scissors Example

Tim's Rock Paper Scissors example using Cartesify on Backend and Fronted

## Backend

### With Sunodo
Build:
```shell
sunodo build
```

Success output:
```shell
 => exporting to image                                                                                                                                                        0.2s
 => => exporting layers                                                                                                                                                       0.2s
 => => writing image sha256:e8f879c648c3cbd230476a811bce2e826d20d96a383eb5acf9d9b084cf1f31ef                                                                                  0.0s
copying from tar archive /mnt/image.tar



 ›   Warning: ommiting environment variable NODE_VERSION=20.8.0
 ›   Warning: ommiting environment variable YARN_VERSION=1.22.19
cd /opt/cartesi/dapp;PATH=/opt/cartesi/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin ROLLUP_HTTP_SERVER_URL=http://127.0.0.1:5004 rollup-init node src/app.js

         .
        / \
      /    \
\---/---\  /----\
 \       X       \
  \----/  \---/---\
       \    / CARTESI
        \ /   MACHINE
         '

[INFO  rollup_http_server] starting http dispatcher service...
[INFO  rollup_http_server::http_service] starting http dispatcher http service!
[INFO  actix_server::builder] starting 1 workers
[INFO  actix_server::server] Actix runtime found; starting in Actix runtime
[INFO  rollup_http_server::dapp_process] starting dapp: node src/app.js
starting app.js...
[server]: Server is running at http://localhost:8383

Manual yield rx-accepted (0x100000000 data)
Cycles: 1493691714
1493691714: 7e2156ddf325ceb7334b18d6955d7b78b4331d3a7707d18cc966cd864cd1ace0
Storing machine: please wait

```

## Frontend

Build project:

```shell
npm install
```

Start the frontend:
```shell
npm run dev
```