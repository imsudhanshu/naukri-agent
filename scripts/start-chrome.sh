#!/bin/bash

export HOME="/home/sudhanshu"
export USER="sudhanshu"

export DISPLAY=":0"
export XAUTHORITY="/run/user/1000/gdm/Xauthority"

export XDG_RUNTIME_DIR="/run/user/1000"
export DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/1000/bus"

export PATH="/home/sudhanshu/.nvm/versions/node/v20.18.0/bin:/usr/local/bin:/usr/bin:/bin"

PORT=9222
PROFILE="$HOME/naukri-agent/chrome-profile"
LOG_DIR="$HOME/naukri-agent/logs"

mkdir -p "$LOG_DIR"

# Already running?
if curl -s --max-time 2 \
    "http://127.0.0.1:$PORT/json/version" > /dev/null 2>&1
then
    echo "✅ Naukri Chrome already running"
    exit 0
fi

echo "🚀 Starting dedicated Chrome..."

google-chrome \
    --remote-debugging-address=127.0.0.1 \
    --remote-debugging-port="$PORT" \
    --user-data-dir="$PROFILE" \
    --no-first-run \
    --no-default-browser-check \
    --disable-sync \
    "https://www.naukri.com/mnjuser/homepage" \
    >> "$LOG_DIR/chrome.log" 2>&1 &

echo "⏳ Waiting for Chrome..."

for i in {1..20}
do
    if curl -s --max-time 2 \
        "http://127.0.0.1:$PORT/json/version" > /dev/null 2>&1
    then
        echo "✅ Chrome debugging available"
        exit 0
    fi

    sleep 1
done

echo "❌ Chrome failed to start"
exit 1