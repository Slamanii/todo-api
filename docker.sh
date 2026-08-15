#!/bin/bash

docker volume create pgdata

docker run -d \
    --name postgres-db \
    -e POSTGRES_USER=postgres \
    -e POSTGRES_PASSWORD=postgres \
    -e POSTGRES_DB=todo_db \
    -p 5432:5432 \
    -v pgdata:/var/lib/postgresql/data \
    postgres:16