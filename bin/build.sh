#!/usr/bin/env bash
set -e
set -o pipefail


DEPLOY_PROD=./dist/deploy-prod
if test -f "$DEPLOY_PROD"; then
    echo "Deploying to prod"
    npm run publish
    exit 0
fi

DEPLOY_BETA=./dist/deploy-beta
if test -f "$DEPLOY_BETA"; then
    echo "Deploying to beta"
    npm run publish-beta
    touch ./dist/deploy-prod
    exit 0
fi

npm install
npm run gulp
touch ./dist/deploy-beta