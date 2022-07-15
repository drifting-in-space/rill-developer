#!/bin/sh

echo "[$(date --rfc-3339=sec)] downloading data"
curl $DB_URL > /app/citibike/stage.db

echo "[$(date --rfc-3339=sec)] starting rill"
cd /app/citibike
/app/rill start
