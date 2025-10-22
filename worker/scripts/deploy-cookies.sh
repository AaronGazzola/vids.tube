#!/bin/bash
set -e

COOKIES_FILE="./worker/cookies/cookies.txt"

if [ ! -f "$COOKIES_FILE" ]; then
    echo "Error: Cookie file not found at $COOKIES_FILE"
    echo "Please run ./worker/scripts/update-cookies.sh first"
    exit 1
fi

echo "Deploying cookies to Railway..."

if ! command -v railway &> /dev/null; then
    echo "Error: Railway CLI not installed"
    echo "Install it with: npm i -g @railway/cli"
    exit 1
fi

COOKIE_CONTENT=$(cat "$COOKIES_FILE" | base64)

railway variables --set YT_COOKIES_CONTENT="$COOKIE_CONTENT"

echo "Cookies deployed successfully to Railway"
echo "The worker will decode and use these cookies on startup"
