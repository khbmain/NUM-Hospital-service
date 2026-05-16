#!/usr/bin/env bash
set -euo pipefail

umask 077

log() {
  printf '[%s] %s\n' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')" "$*"
}

fail() {
  log "ERROR: $*"
  exit 1
}

require_command() {
  if command -v "$1" >/dev/null 2>&1; then
    return
  fi

  case "$1" in
    age)
      fail "Required command 'age' is not installed. On Ubuntu, try: sudo apt-get install -y age"
      ;;
    mongorestore)
      fail "Required command 'mongorestore' is not installed. Install MongoDB Database Tools for your Ubuntu version."
      ;;
    aws)
      fail "Required command 'aws' is not installed. On Ubuntu, try: sudo apt-get install -y awscli"
      ;;
    *)
      fail "Required command '$1' is not installed."
      ;;
  esac
}

require_env() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    fail "Required environment variable '$name' is not set."
  fi
}

require_command mongorestore
require_command aws
require_command age

require_env MONGODB_URI
require_env AWS_REGION
require_env AWS_BACKUP_BUCKET
require_env AGE_IDENTITY_FILE

if [[ ! -r "$AGE_IDENTITY_FILE" ]]; then
  fail "AGE_IDENTITY_FILE is not readable. Provide the offline private key path only for this restore session."
fi

S3_OBJECT_KEY="${1:-${S3_OBJECT_KEY:-}}"
if [[ -z "$S3_OBJECT_KEY" ]]; then
  printf 'Enter S3 object key to restore, for example backups/mongodb/mongodb-YYYY-MM-DD-HH-mm-ss.archive.gz.age: '
  read -r S3_OBJECT_KEY
fi

if [[ "$S3_OBJECT_KEY" != backups/mongodb/*.archive.gz.age ]]; then
  fail "S3 object key must match backups/mongodb/*.archive.gz.age"
fi

TMP_DIR="$(mktemp -d)"
cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

ENCRYPTED_FILE="${TMP_DIR}/restore.archive.gz.age"
DECRYPTED_FILE="${TMP_DIR}/restore.archive.gz"
S3_URI="s3://${AWS_BACKUP_BUCKET}/${S3_OBJECT_KEY}"

cat <<'WARNING'
WARNING: MongoDB restore can overwrite or replace production data.
Test restores on staging first, verify the selected backup object, and ensure an approved maintenance window.
WARNING

printf 'Type RESTORE to continue: '
read -r CONFIRMATION
if [[ "$CONFIRMATION" != "RESTORE" ]]; then
  fail "Restore cancelled by operator."
fi

log "Downloading encrypted backup from ${S3_URI}."
aws s3 cp "$S3_URI" "$ENCRYPTED_FILE" \
  --region "$AWS_REGION" \
  --only-show-errors

log "Decrypting backup with the operator-provided age private key."
age -d -i "$AGE_IDENTITY_FILE" -o "$DECRYPTED_FILE" "$ENCRYPTED_FILE"

rm -f "$ENCRYPTED_FILE"

log "Restoring MongoDB archive."
mongorestore --uri "$MONGODB_URI" --gzip --archive="$DECRYPTED_FILE"

rm -f "$DECRYPTED_FILE"
log "Restore completed successfully."
