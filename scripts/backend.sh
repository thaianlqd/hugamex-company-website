#!/usr/bin/env bash
set -euo pipefail
unset DEBUG
cd "$(dirname "$0")/../backend"
if [[ -f .env ]]; then set -a; source .env; set +a; fi
if [[ -d /opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home ]]; then export JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home; fi
exec mvn -Dmaven.repo.local=../.tools/m2 "${@:-spring-boot:run}"
