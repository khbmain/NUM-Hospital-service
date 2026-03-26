import { S3Client } from "@aws-sdk/client-s3";
import { AWS_ACCESS_KEY, AWS_REGION, AWS_SECRET_KEY } from "./constants";

export const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY as string,
    secretAccessKey: AWS_SECRET_KEY as string,
  },
});
