#!/bin/sh
export $(cat .env | sed 's/#.*//g' | xargs)
curl -X POST "https://api.boogoogoo.com/leading-board" -H "accept: application/json" -H "Authorization: Bearer ${ACCESS_TOKEN}"

exit 0