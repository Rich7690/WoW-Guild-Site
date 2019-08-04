#!/usr/bin/env bash
set -e
set -o pipefail


DEPLOY_PROD=./dist/deploy-prod
if test -f "$DEPLOY_PROD"; then
    echo "Deploying to prod"
    npm run publish
    exit 0
fi

npm install
npm run gulp
touch ./dist/deploy-prod