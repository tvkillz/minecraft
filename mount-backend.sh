#!/bin/bash

# =============================================================================
# Minecraft store constructor — mount shared constructor backend + sendmail
# =============================================================================

set +e

BASE_MC="/home/am/Desktop/projects/minecraft"
LOCAL_BACKEND="$BASE_MC/backend"
LOCAL_SENDMAIL="$BASE_MC/sendmail"
PERSISTENT_CACHE="/home/am/.rclone_cache"

REMOTE_BACKEND="/root/constructor-files/backend"
REMOTE_SENDMAIL="/root/constructor-files/sendmail"
RCLONE_BACKEND="sportsy:$REMOTE_BACKEND"
RCLONE_SENDMAIL="voidborn:$REMOTE_SENDMAIL"

echo "Cleaning up existing Minecraft constructor mounts..."

pkill -f "rclone mount ${RCLONE_BACKEND} ${LOCAL_BACKEND}" || true
pkill -f "rclone mount ${RCLONE_SENDMAIL} ${LOCAL_SENDMAIL}" || true
fusermount -uz "$LOCAL_BACKEND" 2>/dev/null || true
fusermount -uz "$LOCAL_SENDMAIL" 2>/dev/null || true

set -e

RCLONE_OPTS="
--vfs-cache-mode full
--vfs-cache-max-size 5G
--vfs-cache-max-age 168h
--vfs-read-chunk-size 32M
--vfs-read-chunk-size-limit 256M
--buffer-size 64M
--dir-cache-time 1000h
--poll-interval 15s
--vfs-write-back 0s
--async-read=true
--no-modtime
"

echo "Creating local mount directories..."
mkdir -p "$LOCAL_BACKEND" "$LOCAL_SENDMAIL"

echo "Mounting shared backend + sendmail..."

rclone mount "$RCLONE_BACKEND" "$LOCAL_BACKEND" \
    $RCLONE_OPTS --cache-dir "$PERSISTENT_CACHE/minecraft/backend" &

rclone mount "$RCLONE_SENDMAIL" "$LOCAL_SENDMAIL" \
    $RCLONE_OPTS --cache-dir "$PERSISTENT_CACHE/minecraft/sendmail" &

echo "------------------------------------------"
echo "Minecraft constructor mounts active."
echo "  Backend:  $LOCAL_BACKEND  ($RCLONE_BACKEND)"
echo "  Sendmail: $LOCAL_SENDMAIL  ($RCLONE_SENDMAIL)"
echo "------------------------------------------"

sleep infinity
