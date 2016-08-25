#!/bin/bash

set -e

if [ "$1" = "karma" ]; then
    exec ./node_modules/karma/bin/karma start
fi

if [ "$1" = "test_api" ]; then
    exec node api_test.js
fi

if [ "$1" = "database" ]; then
    cd couchdb && ./blank_state.sh $DATABASE_NAME && cd ..
    exec true
fi

if [ "$1" = "uwazi" ]; then
    cd couchdb && ./restore_views.sh $DATABASE_NAME && cd ..
    exec node server "$@"
fi

exec "$@"
