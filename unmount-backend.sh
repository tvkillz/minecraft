#!/bin/bash

# =============================================================================
# Minecraft store constructor — unmount shared backend + sendmail
# =============================================================================

BASE_MC="/home/am/Desktop/projects/minecraft"
LOCAL_BACKEND="$BASE_MC/backend"
LOCAL_SENDMAIL="$BASE_MC/sendmail"
REMOTE_BACKEND="/root/constructor-files/backend"
REMOTE_SENDMAIL="/root/constructor-files/sendmail"
RCLONE_BACKEND="sportsy:$REMOTE_BACKEND"
RCLONE_SENDMAIL="voidborn:$REMOTE_SENDMAIL"

echo "Stopping Minecraft constructor rclone processes..."
pkill -f "rclone mount ${RCLONE_BACKEND} ${LOCAL_BACKEND}" || true
pkill -f "rclone mount ${RCLONE_SENDMAIL} ${LOCAL_SENDMAIL}" || true
sleep 1

echo "Unmounting (lazy)..."

for mnt in "$LOCAL_BACKEND" "$LOCAL_SENDMAIL"; do
    if [ -d "$mnt" ]; then
        echo "Unmounting $mnt..."
        fusermount -uz "$mnt" || true
        sudo umount -fl "$mnt" 2>/dev/null || true
    fi
done

echo "Cleanup done."
