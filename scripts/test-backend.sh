#!/usr/bin/env bash
set -euo pipefail
unset DEBUG
cd "$(dirname "$0")/.."
if [[ -d /opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home ]]; then
  export JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home
fi
if [[ -z "${DOCKER_HOST:-}" ]]; then
  export DOCKER_HOST="$(docker context inspect --format '{{.Endpoints.docker.Host}}')"
fi
export TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE=/var/run/docker.sock
exec mvn -Dmaven.repo.local=.tools/m2 -f backend/pom.xml spotless:check verify
