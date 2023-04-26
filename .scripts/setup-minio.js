const fs = require('fs');
const path = require('path');

const defaultBuckets = ['mikoto'];
const minioPath = 'data/minio';

defaultBuckets.forEach(bucket => {
    const bucketPath = path.join(minioPath, bucket);
    if(!fs.existsSync(bucketPath)) {
        fs.mkdirSync(bucketPath, true);
        console.log(`Created new bucket '${bucket}'`);
    }
});
