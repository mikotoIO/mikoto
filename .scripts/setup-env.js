const fs = require('fs');

if(!fs.existsSync('apps/server/.env')) {
    if(!fs.existsSync('.env.server')) {
        console.error('No .env.server file found!');
        process.exit(1);
    }
    fs.copyFileSync('.env.server', 'apps/server/.env');
    console.log('Copied .env.server to apps/server/.env');
}
