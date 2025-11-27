#!/bin/bash
set -e

MYSQL_SOCKET="/tmp/mysql.sock"
MAX_WAIT=30
COUNTER=0

echo "⏳ Waiting for MySQL to be ready..."

while [ $COUNTER -lt $MAX_WAIT ]; do
    if mysqladmin ping --socket="$MYSQL_SOCKET" --silent 2>/dev/null; then
        echo "✅ MySQL is ready!"
        exit 0
    fi
    
    echo "⏳ Still waiting... ($COUNTER/$MAX_WAIT)"
    sleep 1
    COUNTER=$((COUNTER + 1))
done

echo "❌ MySQL did not start within $MAX_WAIT seconds"
echo "📄 Check logs at: /tmp/mysql.log"
exit 1
