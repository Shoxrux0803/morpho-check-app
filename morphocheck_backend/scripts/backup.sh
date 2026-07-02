#!/bin/bash
# ============================================================
# MorphoCheck Pro - Backup Script
# This script backs up PostgreSQL, MinIO, and local uploads
# and uploads them to Google Drive via rclone.
# ============================================================

# Directory to store backups locally before upload
BACKUP_DIR="./backups"
DATE=$(date +"%Y-%m-%d_%H-%M-%S")
DB_BACKUP_FILE="${BACKUP_DIR}/db_backup_${DATE}.sql"
FILES_BACKUP_FILE="${BACKUP_DIR}/files_backup_${DATE}.tar.gz"

mkdir -p $BACKUP_DIR

echo "[INFO] Starting database backup..."
# Assuming container is named 'morphocheck_db' and user 'morpho' database 'morphocheck'
# We extract DB credentials from .env if we wanted to be fully robust, but typically they are known from docker-compose.
docker exec morphocheck_db pg_dump -U morpho morphocheck > $DB_BACKUP_FILE

echo "[INFO] Starting files backup (MinIO and Uploads)..."
# The project folder name is usually used as a prefix for volumes. Change 'morpho-check-app' if different.
# If volumes are local folders, change this to a simple tar command.
# Below we use an alpine container to mount the docker volumes and tar them.
docker run --rm \
  -v morpho-check-app_minio_data:/data/minio:ro \
  -v morpho-check-app_uploads_data:/data/uploads:ro \
  -v $(pwd)/${BACKUP_DIR}:/backups \
  alpine tar -czvf /backups/files_backup_${DATE}.tar.gz /data/minio /data/uploads

echo "[INFO] Local backups created successfully:"
echo "       - $DB_BACKUP_FILE"
echo "       - $FILES_BACKUP_FILE"

# Upload to Google Drive using rclone
# Note: You MUST run 'rclone config' first and setup a remote named 'gdrive'
# connected to ortiqovshoxrux1996@gmail.com
echo "[INFO] Uploading backups to Google Drive..."
if command -v rclone &> /dev/null; then
    rclone copy $DB_BACKUP_FILE gdrive:MorphoCheck_Backups/
    rclone copy $FILES_BACKUP_FILE gdrive:MorphoCheck_Backups/
    echo "[INFO] Upload to Google Drive completed."
else
    echo "[WARNING] rclone is not installed. Skipping Google Drive upload."
    echo "          Please install rclone (https://rclone.org/) and configure it."
fi

# Cleanup old backups locally (keep last 7 days)
echo "[INFO] Cleaning up local backups older than 7 days..."
find $BACKUP_DIR -type f -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -type f -name "*.tar.gz" -mtime +7 -delete

echo "[INFO] Backup process finished!"
