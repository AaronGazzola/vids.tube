#!/bin/bash
set -e

COOKIES_DIR="/Users/arongazzola/Documents/Projects/vids.tube/worker/cookies"
COOKIES_FILE="$COOKIES_DIR/cookies.txt"

echo "Attempting to extract YouTube cookies from browsers..."

if command -v yt-dlp &> /dev/null; then
    YT_DLP="yt-dlp"
elif [ -f "/Users/arongazzola/Library/Python/3.9/bin/yt-dlp" ]; then
    YT_DLP="/Users/arongazzola/Library/Python/3.9/bin/yt-dlp"
else
    echo "Error: yt-dlp not found"
    exit 1
fi

mkdir -p "$COOKIES_DIR"

for browser in chrome firefox safari edge; do
    echo "Trying $browser..."
    if $YT_DLP --cookies-from-browser "$browser" --cookies "$COOKIES_FILE" --skip-download "https://www.youtube.com/watch?v=dQw4w9WgXcQ" 2>/dev/null; then
        echo "Successfully extracted cookies from $browser"
        echo "Cookies saved to: $COOKIES_FILE"
        exit 0
    fi
done

echo "Could not extract cookies from any browser."
echo "Please ensure you are logged in to YouTube in at least one browser."
exit 1
