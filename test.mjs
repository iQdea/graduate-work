import {
  DeleteObjectsCommand,
  ListObjectsCommand,
  ListMultipartUploadsCommand,
  DeleteBucketCommand,
  ListBucketsCommand,
  AbortMultipartUploadCommand,
  S3Client
} from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  credentials: {
    accessKeyId: 'accessKey1',
    secretAccessKey: 'verySecretKey1'
  },
  region: 'us-east-1',
  forcePathStyle: true,
  endpoint: 'http://127.0.0.1:8000/'
});

const listBucketsCommand = new ListBucketsCommand({})
const { Buckets } = await s3Client.send(
  listBucketsCommand
);
console.info(Buckets)
// for (const bucket of Buckets) {
//   const { Uploads } = await s3Client.send(new ListMultipartUploadsCommand({
//     Bucket: bucket.Name
//   }))
//   if (Uploads) {
//     await Promise.all(Uploads.map(({Key, UploadId}) => s3Client.send(new AbortMultipartUploadCommand({
//       Bucket: bucket.Name,
//       Key,
//       UploadId
//     }))))
//   }
// }
for (const bucket of Buckets) {
  const listObjectsCommand = new ListObjectsCommand({
    Bucket: bucket.Name
  })
  const { Contents } = await s3Client.send(listObjectsCommand)

  // if (Contents) {
  //   await s3Client.send(
  //     new DeleteObjectsCommand({
  //       Bucket: bucket.Name,
  //       Delete: {Objects: Contents.map((x) => ({Key: x.Key}))}
  //     })
  //   );
  // }
}
// await Promise.all(Buckets.map((x)=> s3Client.send(new DeleteBucketCommand({
//   Bucket: x.Name
// }))))
