const AWS = require('aws-sdk');
const contentful = require("contentful");
const client = contentful.createClient({
    space: process.env.CF_SPACE, 
    accessToken: process.env.CF_KEY
});
let dynamo = new AWS.DynamoDB.DocumentClient();

let response;

exports.lambdaHandler = async (event, context) => {
    
    try {
        var content = await client.getEntries({'content_type': 'questionBlockEntry'});

        var tags = {};
        var resultsCompleteness = [];
        for(var itemIdx in content.items) {
            var item = content.items[itemIdx];

            if(item.fields.requiredForResults) {
                for (var tagIdx in item.metadata.tags) {
                    var tag = item.metadata.tags[tagIdx];
                    if(tags[tag.sys.id]) {
                        if(item.fields.requiredFields) {
                            for (var fieldIdx in item.fields.requiredFields) {
                                tags[tag.sys.id].requiredAnswers.push(item.fields.requiredFields[fieldIdx])
                            }
                        }
                    } else {
                        tags[tag.sys.id] = {
                            context: tag.sys.id,
                            title: tag.sys.id,
                            requiredAnswers: item.fields.requiredFields ? item.fields.requiredFields : [] 
                        }
                    }
                }
            }
        }

        for (var prop in tags) {
            if (Object.prototype.hasOwnProperty.call(tags, prop)) {
                resultsCompleteness.push(tags[prop]);
            }
        }

        var customerId = event.queryStringParameters ? event.queryStringParameters.customerId : "";

        var customer = await getProfile(customerId);
        var results = [];

        for(var i=0; i < resultsCompleteness.length; i++) {
            var channel = resultsCompleteness[i];
            var totalQuestions = channel.requiredAnswers.length;
            var completeCounter=0;
            for(var x=0; x < channel.requiredAnswers.length; x++) {
                if(eval(channel.requiredAnswers[x])) {
                    completeCounter++;
                }
            } 
            results.push({
                details: channel,
                completenessPercentage: completeCounter/totalQuestions*100
            })
        }

        response = {
            'statusCode': 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': JSON.stringify(results)
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


async function getProfile(id) {

    var customer = {
        fields: {
            id: id
        }
    }

    var params = {
        TableName : "NextCustomerProfile",
        KeyConditionExpression: "#id = :id",
        ExpressionAttributeNames:{
            "#id": "id"
        },
        ExpressionAttributeValues: {
            ":id": id,
        }, 
        Limit: 1
    };
    var result =  await dynamo.query(params).promise();
    if(result.Items.length == 1) {
        customer.fields = result.Items[0];
    }
    return customer;
};