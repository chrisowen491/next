const fs = require('fs');
var contents = fs.readFileSync('index.html', 'utf8');

exports.lambdaHandler = async function (event, context) {

    return {
     "isBase64Encoded": false,
     "headers": { 'Content-Type': 'text/html'},
     "statusCode": 200,
     "body": contents
     };
};