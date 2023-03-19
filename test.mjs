import {
  CreateBucketCommand,
  GetObjectCommand,
  ListObjectsCommand,
  PutObjectCommand,
  S3Client
} from '@aws-sdk/client-s3';

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import path from "path";
import {Readable} from "stream";
import * as fs from 'fs'

const s3Client = new S3Client({
  credentials: {
    accessKeyId: 'accessKey1',
    secretAccessKey: 'verySecretKey1'
  },
  region: 'us-west-2',
  forcePathStyle: true,
  endpoint: 'http://127.0.0.1:8000/'
});

// const input = {
//   "Body": path.join(__dirname, 'Share.png'),
//   "Bucket": "images",
//   "Key": "sample3.png"
// }
// const createBucketCommand = new CreateBucketCommand({
//   Bucket: "images"
// })
// const putObjectCMD = new PutObjectCommand(input)
const getObjCMD = new GetObjectCommand({
  Bucket: 'images',
  Key: 'a09ffce9-4958-4025-a4c1-6facda7e6338.jpeg'
})
const { Body: body } = await s3Client.send(
  getObjCMD
);
if (!(body instanceof Readable)) {
  throw new TypeError('body is not instance of Readable');
}

