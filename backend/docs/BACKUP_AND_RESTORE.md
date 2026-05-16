# Encrypted MongoDB Backup and Restore

NUM Hospital stores sensitive hospital-service data, including patients, appointments, doctor visits, users, staff, services, resources, and reports. Production backups must therefore be automated, encrypted before leaving the server, and restorable only by an authorized operator who has the offline private key.

## Security Model

- Backups run daily at 03:00 server time.
- `mongodump` creates a compressed archive with `--archive --gzip`.
- The archive is encrypted locally with `age` public-key encryption before upload.
- AWS S3 stores only `.archive.gz.age` encrypted files.
- AWS does not store the age private decryption key.
- The backup server stores only the public age recipient key.
- The private key is required only during restore and must be kept offline or in an organization-controlled secure environment outside AWS.
- S3 server-side encryption (`--sse AES256`) is used as defense-in-depth only. The primary security layer is client-side age encryption before upload.
- S3 lifecycle retention deletes backup objects older than 7 days.

Never commit secrets, never upload the private key to AWS, never store the private key in S3, and never store the private key in the application repository.

## Required Tools

Install these on the Ubuntu VPS that runs backups:

```bash
sudo apt-get update
sudo apt-get install -y awscli
```

Install MongoDB Database Tools so `mongodump` and `mongorestore` are available. Follow the official MongoDB instructions for your Ubuntu version.

Install `age`:

```bash
sudo apt-get install -y age
```

If your distribution does not provide `age`, install it from the official age releases.

## Generate an Age Key Pair

Generate the key pair on a secure workstation, not on AWS:

```bash
age-keygen -o age-private-key.txt
```

The command prints a public recipient similar to:

```text
public key: age1...
```

Use the `age1...` public key on the backup server. Keep `age-private-key.txt` offline or in an organization-controlled secure environment outside AWS.

## Configure Backup Environment

Set these environment variables on the backup server:

```bash
export MONGODB_URI='mongodb+srv://...'
export AWS_REGION='ap-northeast-1'
export AWS_BACKUP_BUCKET='YOUR_BUCKET_NAME'
export BACKUP_AGE_RECIPIENT='age1...'
```

Alternative public-key file option:

```bash
export BACKUP_AGE_RECIPIENT_FILE='/etc/num-hospital/backup-age-recipient.txt'
```

The recipient file must contain only public age recipient values. Do not put the private key on the backup server if avoidable.

AWS credentials may come from an EC2 IAM role, AWS CLI configured credentials, or environment variables. The backup decryption private key must not be stored in AWS Secrets Manager, SSM Parameter Store, KMS, S3, Git, committed `.env` files, or the production backup server if avoidable.

## Run Backup Manually

From the backend directory:

```bash
cd /path/to/NUM-Hospital-service-main/backend
bash ./scripts/backup-mongodb-s3.sh
```

The script creates a secure temporary directory, runs:

```bash
mongodump --archive --gzip
```

Then it encrypts the archive with age and uploads only the encrypted file:

```text
s3://$AWS_BACKUP_BUCKET/backups/mongodb/mongodb-YYYY-MM-DD-HH-mm-ss.archive.gz.age
```

Temporary plain and encrypted local files are deleted after upload.

## Configure Cron: Daily at 03:00

Edit the crontab for the service user:

```bash
crontab -e
```

Add:

```cron
0 3 * * * cd /path/to/NUM-Hospital-service-main/backend && /bin/bash ./scripts/backup-mongodb-s3.sh >> /var/log/num-hospital-backup.log 2>&1
```

Ensure the cron environment provides `MONGODB_URI`, `AWS_REGION`, `AWS_BACKUP_BUCKET`, and either `BACKUP_AGE_RECIPIENT` or `BACKUP_AGE_RECIPIENT_FILE`. Prefer a root-readable environment file outside Git with strict permissions if needed.

## Apply 7-Day S3 Lifecycle Retention

The lifecycle policy applies only to:

```text
backups/mongodb/
```

Apply it:

```bash
aws s3api put-bucket-lifecycle-configuration \
  --bucket YOUR_BUCKET_NAME \
  --lifecycle-configuration file://backend/scripts/s3-lifecycle-backup-retention.json
```

This deletes backup objects older than 7 days.

## Verify Backup Objects in S3

List encrypted backups:

```bash
aws s3 ls s3://YOUR_BUCKET_NAME/backups/mongodb/
```

Objects should end with:

```text
.archive.gz.age
```

Plain `.archive` or `.archive.gz` files must never be uploaded.

## Restore From Backup

Restore requires the private age identity key manually. Do not keep this key in AWS or the repository.

1. Set environment variables:

```bash
export MONGODB_URI='mongodb+srv://...'
export AWS_REGION='ap-northeast-1'
export AWS_BACKUP_BUCKET='YOUR_BUCKET_NAME'
export AGE_IDENTITY_FILE='/secure/offline/location/age-private-key.txt'
```

2. Run restore with an S3 object key:

```bash
cd /path/to/NUM-Hospital-service-main/backend
bash ./scripts/restore-mongodb-s3.sh backups/mongodb/mongodb-YYYY-MM-DD-HH-mm-ss.archive.gz.age
```

The script:

1. Warns that restore can overwrite data.
2. Requires the operator to type `RESTORE`.
3. Downloads the selected encrypted object from S3.
4. Decrypts it locally with:

```bash
age -d -i "$AGE_IDENTITY_FILE"
```

5. Restores with:

```bash
mongorestore --gzip --archive
```

6. Deletes temporary local files.

Test restores on staging first before restoring production.

## Least-Privilege IAM Guidance

Restrict access to the exact bucket and prefix:

```text
arn:aws:s3:::BUCKET_NAME
arn:aws:s3:::BUCKET_NAME/backups/mongodb/*
```

Backup-only permission should generally include:

- `s3:PutObject`
- `s3:ListBucket` only if operationally needed

Restore permission additionally needs:

- `s3:GetObject`

If backup and restore are separated, the backup role should not need `s3:GetObject`.

Example policy shape:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject"],
      "Resource": "arn:aws:s3:::BUCKET_NAME/backups/mongodb/*"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": "arn:aws:s3:::BUCKET_NAME",
      "Condition": {
        "StringLike": {
          "s3:prefix": "backups/mongodb/*"
        }
      }
    }
  ]
}
```

## Operational Checklist

- Public age recipient is configured on the backup server.
- Private age key is stored offline or outside AWS under organizational control.
- S3 bucket lifecycle policy is applied.
- Cron runs daily at 03:00.
- Logs are monitored.
- Restore is tested regularly on staging.
- IAM permissions follow least privilege.
- No secrets or private keys are committed to Git.
