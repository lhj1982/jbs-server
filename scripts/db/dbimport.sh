#!/bin/bash


tmp_file="fadlfhsdofheinwvw.js"
echo "print('_ ' + db.getCollectionNames())" > $tmp_file

dbname=jbs
for file in out/*.json; do c=${file#*exp_${dbname}_}; c=${c%.json}; mongoimport -h 127.0.0.1 --db $dbname --drop --collection "${c}" --file "${file}"; done

rm $tmp_file

exit 0