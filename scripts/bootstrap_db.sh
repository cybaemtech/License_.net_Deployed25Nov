#!/bin/bash
set -e

MYSQL_SOCKET="/tmp/mysql.sock"
DB_NAME="${MYSQL_DATABASE:-license_management}"
SCHEMA_FILE="database_schema.sql"

echo "🗄️  Bootstrapping MySQL Database..."

if [ ! -S "$MYSQL_SOCKET" ]; then
    echo "❌ MySQL socket not found at $MYSQL_SOCKET"
    echo "Please run: bash scripts/start_mysql.sh"
    exit 1
fi

echo "📊 Creating database: $DB_NAME"
mysql --socket="$MYSQL_SOCKET" -u root <<SQL
CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
SQL

echo "✅ Database '$DB_NAME' created/verified"

if [ -f "$SCHEMA_FILE" ]; then
    echo "📥 Importing schema from $SCHEMA_FILE..."
    mysql --socket="$MYSQL_SOCKET" -u root "$DB_NAME" < "$SCHEMA_FILE"
    echo "✅ Schema imported successfully!"
else
    echo "⚠️  Schema file not found: $SCHEMA_FILE"
    echo "You'll need to import it manually"
fi

echo "🎉 Database bootstrap complete!"
echo "Default login credentials:"
echo "  Email: rohan.bhosale@cybaemtech.com"
echo "  Password: password"
