const fs = require('fs');

const args = new Set(process.argv.slice(2));
const overWrite = args.has('--force') || args.has('-f');

if(!fs.existsSync('.env.server')) {
    console.error('No .env.server file found!');
    process.exit(1);
}

if(overWrite || !fs.existsSync('apps/server/.env')) {
    fs.copyFileSync('.env.server', 'apps/server/.env');
    console.log('Copied .env.server to apps/server/.env');
}
