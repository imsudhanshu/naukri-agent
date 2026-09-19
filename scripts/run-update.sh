#!/bin/bash

set -u

# -------------------------------------------------
# Environment
# -------------------------------------------------

export HOME="/home/sudhanshu"
export USER="sudhanshu"

export PATH="/home/sudhanshu/.nvm/versions/node/v20.18.0/bin:/usr/local/bin:/usr/bin:/bin"

export DISPLAY=":0"
export XAUTHORITY="/run/user/1000/gdm/Xauthority"
export XDG_RUNTIME_DIR="/run/user/1000"
export DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/1000/bus"

PROJECT_DIR="/home/sudhanshu/naukri-agent"
LOG_DIR="$PROJECT_DIR/logs"
CHROME_PROFILE="$PROJECT_DIR/chrome-profile"
PORT=9222

mkdir -p "$LOG_DIR"

LOG_FILE="$LOG_DIR/$(date '+%Y-%m-%d').log"

exec > >(tee -a "$LOG_FILE") 2>&1

echo ""
echo "=========================================="
echo "🚀 Naukri Agent started: $(date)"
echo "=========================================="

cd "$PROJECT_DIR" || exit 1

# -------------------------------------------------
# 1. Check Chrome
# -------------------------------------------------

echo "🔎 Checking dedicated Chrome..."

if curl -s --max-time 3 \
    "http://127.0.0.1:$PORT/json/version" > /dev/null 2>&1
then

    echo "✅ Dedicated Chrome already running"

else

    echo "🌐 Dedicated Chrome is not running"
    echo "🚀 Starting dedicated Chrome..."

    google-chrome \
        --remote-debugging-address=127.0.0.1 \
        --remote-debugging-port="$PORT" \
        --user-data-dir="$CHROME_PROFILE" \
        --no-first-run \
        --no-default-browser-check \
        --disable-sync \
        "https://www.naukri.com/mnjuser/homepage" \
        >> "$LOG_DIR/chrome.log" 2>&1 &

    CHROME_PID=$!

    echo "Chrome PID: $CHROME_PID"
    echo "⏳ Waiting for Chrome..."

    CHROME_READY=false

    for i in {1..30}
    do

        if curl -s --max-time 2 \
            "http://127.0.0.1:$PORT/json/version" > /dev/null 2>&1
        then
            CHROME_READY=true
            echo "✅ Chrome debugging available"
            break
        fi

        sleep 1

    done

    if [ "$CHROME_READY" = false ]; then
        echo "❌ Chrome failed to start"
        echo ""
        echo "Chrome log:"
        tail -50 "$LOG_DIR/chrome.log"
        exit 1
    fi

fi

# -------------------------------------------------
# 2. Give Chrome/Naukri time to initialise
# -------------------------------------------------

echo "⏳ Waiting for Naukri session..."

sleep 5

# -------------------------------------------------
# 3. Run Naukri Agent
# -------------------------------------------------

echo "🤖 Running Naukri Agent..."

"/home/sudhanshu/.nvm/versions/node/v20.18.0/bin/naukri-agent" update

RESULT=$?

# -------------------------------------------------
# 4. Result
# -------------------------------------------------

if [ "$RESULT" -eq 0 ]; then

    echo ""
    echo "✅ Naukri resume update completed successfully"

else

    echo ""
    echo "❌ Naukri resume update failed"

fi

echo "🏁 Finished: $(date)"

exit "$RESULT"