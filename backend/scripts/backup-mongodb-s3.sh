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
    mongodump)
      fail "Required command 'mongodump' is not installed. Install MongoDB Database Tools for your Ubuntu version."
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

require_command mongodump
require_command aws
require_command age

require_env MONGODB_URI
require_env AWS_REGION
require_env AWS_BACKUP_BUCKET

if [[ -z "${BACKUP_AGE_RECIPIENT:-}" && -z "${BACKUP_AGE_RECIPIENT_FILE:-}" ]]; then
  fail "Set BACKUP_AGE_RECIPIENT or BACKUP_AGE_RECIPIENT_FILE. Generate a key with: age-keygen -o age-private-key.txt"
fi

if [[ -n "${BACKUP_AGE_RECIPIENT_FILE:-}" && ! -r "$BACKUP_AGE_RECIPIENT_FILE" ]]; then
  fail "BACKUP_AGE_RECIPIENT_FILE is not readable."
fi

TMP_DIR="$(mktemp -d)"
cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

TIMESTAMP="$(date -u '+%Y-%m-%d-%H-%M-%S')"
BACKUP_NAME="mongodb-${TIMESTAMP}.archive.gz"
BACKUP_FILE="${TMP_DIR}/${BACKUP_NAME}"
ENCRYPTED_FILE="${BACKUP_FILE}.age"
S3_KEY="backups/mongodb/${BACKUP_NAME}.age"
S3_URI="s3://${AWS_BACKUP_BUCKET}/${S3_KEY}"

log "Starting MongoDB backup."
log "Creating compressed MongoDB archive in a secure temporary directory."
mongodump --uri "$MONGODB_URI" --archive="$BACKUP_FILE" --gzip

log "Encrypting archive with age public-key encryption."
if [[ -n "${BACKUP_AGE_RECIPIENT_FILE:-}" ]]; then
  age -R "$BACKUP_AGE_RECIPIENT_FILE" -o "$ENCRYPTED_FILE" "$BACKUP_FILE"
else
  age -r "$BACKUP_AGE_RECIPIENT" -o "$ENCRYPTED_FILE" "$BACKUP_FILE"
fi

rm -f "$BACKUP_FILE"

log "Uploading encrypted backup to ${S3_URI}."
# S3 SSE is defense-in-depth only. The primary security layer is client-side
# age encryption before upload; AWS must not have the private decryption key.
aws s3 cp "$ENCRYPTED_FILE" "$S3_URI" \
  --region "$AWS_REGION" \
  --sse AES256 \
  --only-show-errors

rm -f "$ENCRYPTED_FILE"
log "Backup completed successfully: ${S3_URI}"
