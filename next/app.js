const AWS = require('aws-sdk');
let dynamo = new AWS.DynamoDB.DocumentClient();
const contentful = require("contentful");
const client = contentful.createClient({
    space: process.env.CF_SPACE, 
    accessToken: process.env.CF_KEY
});
const { v4: uuidv4 } = require('uuid');

let response;

exports.lambdaHandler = async (event, context) => {
    
    try {
        var tag = event.queryStringParameters ? event.queryStringParameters.context : "";
        var customerId = event.queryStringParameters ? event.queryStringParameters.customerId : "";

        var content = await client.getEntries({'metadata.tags.sys.id[in]': tag, 'content_type': 'questionBlockEntry', order: 'fields.priority'});
        var customer = await getProfile(customerId);

        var questionBlock = [];
        var optionsBlock = [];
        for(var i=0; i < content.items.length; i++) {
            var qb = content.items[i]
            if(qb.fields.conditionDisplayRule && eval(qb.fields.conditionDisplayRule)) {
                questionBlock.push(qb.fields.questionBlock.fields.block)
                optionsBlock.push(qb.fields.questionBlock.fields.optionsBlock)
            } else if(!qb.fields.conditionDisplayRule){
                questionBlock.push(qb.fields.questionBlock.fields.block)
                optionsBlock.push(qb.fields.questionBlock.fields.optionsBlock)
            }
        }

        response = {
            'statusCode': 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': JSON.stringify({
                customer: customer.fields,
                blocks: questionBlock,
                optionsBlock: optionsBlock
            })
        }
    } catch(ex) {
        response = {
            'statusCode': 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': JSON.stringify(ex)
        }
    }

    return response
};

async function createCustomerProfile(id) {
    var params = {
        TableName: "NextCustomerProfile",
        Item:{
            id: id
        }
    };
    
    return await dynamo.put(params).promise();
}

async function getProfile(identifier) {

    var id = identifier ? identifier : uuidv4();

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
    } else {
        await createCustomerProfile(id);
    }
    
    return customer;
};