#!/bin/sh

#if [ ! $1 ]; then
#        echo " Example of use: $0 database_name [dir_to_store]"
#        exit 1
#fi
db=jbs
out_dir=backup
BASE_DIR=/root/db
DATE=`date +"%Y-%m-%d_%H_%M_%S"`
DUMPFILENAME=${BASE_DIR}/${db}_${DATE}.tar.gz
UN=admin
PW=12wed98uh56yhbv

if [ ! $out_dir ]; then
        out_dir="./backup"
else
        mkdir -p $out_dir
fi

cd ${BASE_DIR}
tmp_file=${BASE_DIR}/fadlfhsdofheinwvw.js
echo -e "use ${db}\nprint('_ ' + db.getCollectionNames())" > $tmp_file
cols=`mongo -u ${UN} -p ${PW} < $tmp_file | grep '_' | awk '{print $2}' | tr ',' ' '`
for c in $cols
do
    mongoexport -h 127.0.0.1 -d $db -u ${UN} -p ${PW} -c $c -o "$out_dir/exp_${db}_${c}.json" --authenticationDatabase=admin
done
tar -czvf ${DUMPFILENAME} ${out_dir} || exit 1
/root/.local/bin/aws s3 cp ${DUMPFILENAME} s3://jbs-backup --region ap-southeast-1 || exit 2
rm -f ${DUMPFILENAME} || exit 3
rm -f $tmp_file || exit 4

exit 0