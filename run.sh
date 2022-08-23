#!/bin/sh

echo "[$(date --rfc-3339=sec)] downloading data"
curl $TAR_URL > /app/citibike.tar.gz

echo "[$(date --rfc-3339=sec)] extracting data"
tar xvf /app/citibike.tar.gz

echo "[$(date --rfc-3339=sec)] starting rill"
cd /app/citibike
/app/rill start
