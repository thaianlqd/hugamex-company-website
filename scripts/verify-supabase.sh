#!/usr/bin/env bash
# Read-only checks. Environment values are never echoed or passed as CLI arguments.
set -euo pipefail
unset DEBUG
cd "$(dirname "$0")/.."
set -a
source backend/.env
set +a
if [[ -d /opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home ]]; then
  export JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home
fi
drivers=(.tools/m2/org/postgresql/postgresql/*/postgresql-*.jar)
if [[ ! -f "${drivers[0]}" ]]; then
  echo 'PostgreSQL JDBC driver missing; build the backend first.' >&2
  exit 1
fi
exec "${JAVA_HOME:+$JAVA_HOME/bin/}java" -cp "${drivers[0]}" scripts/SupabaseCheck.java "${1:-preflight}"
