#!/bin/sh


#download data
mkdir /app/data
cd /app/data || exit
curl -LJ "$JAMSOCKET_ZIPPED_DATA" -o 'data.zip'
unzip 'data.zip' -d .
rm data.zip
for file in *; do 
    case $file in
        *.csv|*.parquet|*.tsv) /app/rill import-source "$file";;
        *) echo "$file";;
    esac
done

echo "[$(date --rfc-3339=sec)] starting rill"
/app/rill start
