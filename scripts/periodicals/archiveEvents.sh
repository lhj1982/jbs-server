#!/bin/sh
export $(cat .env | sed 's/#.*//g' | xargs)
curl -X GET "https://api.boogoogoo.com/events/archive-events" -H "accept: application/json" -H "Authorization: Bearer ${ACCESS_TOKEN}"

exit 0