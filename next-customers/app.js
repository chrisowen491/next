const AWS = require('aws-sdk');
let dynamo = new AWS.DynamoDB.DocumentClient();

let response;

exports.lambdaHandler = async (event, context) => {
    
    try {
        var customers = await getCustomers();
        response = {
            'statusCode': 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': JSON.stringify(customers)
        }
    } catch(ex) {
        response = {
            'statusCode': 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': JSON.stringify(ex)
        }
    }

    return response
};

async function getCustomers() {

    var params = {
        TableName : "NextCustomerProfile"    };

    var result =  await dynamo.scan(params).promise();
    
    return result.Items;
};