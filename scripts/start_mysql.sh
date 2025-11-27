#!/bin/bash
set -e

MYSQL_DATA_DIR="$PWD/mysql_data"
MYSQL_SOCKET="/tmp/mysql.sock"
MYSQL_PID="/tmp/mysql.pid"

echo "🚀 Starting MySQL Server..."

if [ ! -d "$MYSQL_DATA_DIR" ]; then
    echo "📁 Initializing MySQL data directory..."
    mysqld --initialize-insecure --datadir="$MYSQL_DATA_DIR" --user=runner
    echo "✅ MySQL data directory initialized"
fi

if [ -f "$MYSQL_PID" ]; then
    if ps -p $(cat "$MYSQL_PID") > /dev/null 2>&1; then
        echo "✅ MySQL is already running (PID: $(cat $MYSQL_PID))"
        exit 0
    else
        echo "⚠️  Removing stale PID file"
        rm -f "$MYSQL_PID"
    fi
fi

echo "🔧 Starting mysqld..."
mysqld \
    --datadir="$MYSQL_DATA_DIR" \
    --user=runner \
    --socket="$MYSQL_SOCKET" \
    --port=3306 \
    --bind-address=127.0.0.1 \
    --pid-file="$MYSQL_PID" \
    > /tmp/mysql.log 2>&1 &

echo "⏳ Waiting for MySQL to be ready..."
bash scripts/wait_for_mysql.sh

echo "✅ MySQL Server started successfully!"
echo "📊 Socket: $MYSQL_SOCKET"
echo "📋 PID: $(cat $MYSQL_PID)"
