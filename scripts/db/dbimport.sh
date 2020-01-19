#!/bin/sh


tmp_file="fadlfhsdofheinwvw.js"
echo "use jbs\nprint('_ ' + db.getCollectionNames())" > $tmp_file

dbname=jbs
for file in out/*.json; do c=${file#*exp_${dbname}_}; c=${c%.json}; mongoimport -h 127.0.0.1 -u admin -p admin --authenticationDatabase admin --db $dbname --drop --collection "${c}" --file "${file}"; done

rm $tmp_file

exit 0