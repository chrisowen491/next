const AWS = require('aws-sdk');
let dynamo = new AWS.DynamoDB.DocumentClient();
exports.lambdaHandler = async (event, context) => {
    
    let result;
    try {
        var body = JSON.parse(event.body); 
        
        let updateExpression='set';
        let ExpressionAttributeNames={};
        let ExpressionAttributeValues = {};
        for (const property in body) {
            if(property != 'id' && body[property]) {  
                updateExpression += ` #${property} = :${property} ,`;
                ExpressionAttributeNames['#'+property] = property ;
                ExpressionAttributeValues[':'+property]=body[property];
            }
        }
        updateExpression= updateExpression.slice(0, -1);

        var params = {
            TableName:"NextCustomerProfile",
            Key:{
                "id": body.id
            },
            UpdateExpression: updateExpression,
            ExpressionAttributeNames: ExpressionAttributeNames,
            ExpressionAttributeValues: ExpressionAttributeValues,
            ReturnValues:"ALL_NEW"
        };

        result = await dynamo.update(params).promise();
    } catch (ex) {
        result = ex;
    }
    return {
        'statusCode': 200,
        body: JSON.stringify(result),
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}
    }
};
