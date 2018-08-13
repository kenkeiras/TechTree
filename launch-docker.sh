#!/usr/bin/bash

set -euo pipefail

GENPASSWD="(openssl passwd hex 1 2 3 4 5 6|tr -d '\n')"
USERNAME=techtree
DB_NAME=techtree
DB_DOCKER_NAME=techtree-postgres
PORT=8080

TT_DOCKER_NAME=techtree

if [ `docker ps -a --filter=name="${DB_DOCKER_NAME}"|wc -l` -eq 1 ]; then
    PASSWORD=`$GENPASSWD`

    docker run --name ${DB_DOCKER_NAME} -e POSTGRES_PASSWD=$PASSWORD \
                                        -e POSTGRES_USER=$USERNAME   \
                                        -e POSTGRES_DB=${DB_NAME}    \
                                        -d postgres
fi


DB_DOCKER_ID=`docker ps -a --filter=name="${DB_DOCKER_NAME}"|tail -n+2|cut -d\  -f1`

PASSWORD=`docker inspect ${DB_DOCKER_ID} | jq '.[0].Config.Env'|grep POSTGRES_PASSWD|cut -d= -f2|cut -d\" -f1`

docker run -it --rm --name ${TT_DOCKER_NAME} -p ${PORT}:${PORT} \
                                    --link=${DB_DOCKER_NAME}:postgres \
                                    -e POSTGRES_HOST=postgres \
                                    -e POSTGRES_USER=${USERNAME} \
                                    -e POSTGRES_PASSWORD=${PASSWORD} \
                                    -e POSTGRES_DB=${DB_NAME} \
                                    -e SECRET_KEY_BASE="`$GENPASSWD`" \
                                    -e PORT=${PORT} \
                                    ${TT_DOCKER_NAME}