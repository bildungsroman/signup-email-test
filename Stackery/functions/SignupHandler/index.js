const AWS = require('aws-sdk')
const dynamodb = new AWS.DynamoDB();

module.exports = function handler(message, context, callback) {
  const signup = JSON.parse(message.body);
  const ports = JSON.parse(process.env.STACKERY_PORTS)

  // Copy the specific values we want to save into the Table record
  const params = {
    Item: {
      "First name": {
        S: signup.first_name
      }, 
      "Last name": {
        S: signup.last_name
      }, 
      "Email": {
        S: signup.email_input
      }
    },
    ReturnConsumedCapacity: "TOTAL", 
    TableName: ports[0][0].tableName
  }
  // Put the new record into the Table  
  return dynamodb.putItem(params).promise()
    // Send a 204 No Content response back to the client
    .then(() => { callback(null, {
      statusCode: 204,
      headers: {},
      body: JSON.stringify({}) 
    })});
}
