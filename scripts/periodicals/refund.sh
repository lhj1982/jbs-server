#!/bin/sh
export $(cat /root/jbs-server/scripts/periodicals/.env | sed 's/#.*//g' | xargs)
curl -X POST "https://api.boogoogoo.com/orders/refund" -H "accept: application/json" -H "Authorization: Bearer ${ACCESS_TOKEN}"

exit 0