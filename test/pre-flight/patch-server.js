const fs = require('fs');

const serverJSFilePath = `${process.cwd()}/node_modules/chat-engine/server.js`;
fs.readFile(serverJSFilePath, 'utf8', (readError, data) => {
    if (readError) {
        return console.log(`Unable to read server source code: ${readError}`);
    }
    let serverCode = data
        .replace(/publishKey:[ ]'[a-zA-Z0-9-]*'/g, 'publishKey: process.env.PUBLISH_KEY')
        .replace(/subscribeKey:[ ]'[a-zA-Z0-9-]*'/g, 'subscribeKey: process.env.SUBSCRIBE_KEY')
        .replace(/secretKey:[ ]'[a-zA-Z0-9-]*'/g, 'secretKey: process.env.SECRET_KEY')
        .replace(/console.log/g, '// console.log');

    fs.writeFile(serverJSFilePath, serverCode, 'utf8', (writeError) => {
        if (writeError) {
            return console.log(`Unable to write patched server code: ${writeError}`);
        }
    });
});
