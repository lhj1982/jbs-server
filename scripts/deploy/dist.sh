#!/bin/sh

EXPECTED_ARGS=1
REPO=git@github.com:adelablue/jbs-server.git
BRANCH=feature/user_credits

if [ $# -ne $EXPECTED_ARGS ]
then
	echo "Usage: `basename $0` {local/live}"
	exit 1
fi

if [ "$1" = "local" ]; then
	echo local
else
if [ "$1" = "live" ]; then
	REV=`git rev-parse HEAD`
	echo Deploy jbs-server - ${REV} from ${BRANCH} to live
	
	TMP=`mktemp -d`
	cd $TMP
	echo clone project...
	git clone -b $BRANCH $REPO jbs-server || exit 1
    
    #cp vdragon-api/app/config/app-template.php simpleshop/app/config/app.php
    echo build project
    cd jbs-server
    echo generating dependencies
    #pm install --production || exit 7
    
	echo Login to jbs-server uzjeyy22
    echo remove all migrations and seed files on remote
    rm -rf data/*
    rm -rf dist/logs/*
    scp -P 22000 -r ./ root@jbs-prod:~/jbs-server/ || exit 3
    echo Sync project to remote
	#rsync -vazr --exclude-from='/Users/hli36/projects/ademes/jbs/jbs-server/scripts/deploy/rsync_exclude' ./ root@jbs-prod:~/jbs-server/ || exit 3

	
	cd $TMP/..
	rm -rf $TMP || exit 4 
fi
fi

exit 0
