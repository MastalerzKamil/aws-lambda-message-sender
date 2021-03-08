const randomBytes = require('crypto').randomBytes;
const Messenger = require('./messenger.js');

const AWS = require('aws-sdk');

const ddb = new AWS.DynamoDB.DocumentClient();



const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilioClient = require('twilio')(twilioAccountSid, twilioAuthToken); // eslint-disable-line

module.exports.sendText = (event, context, callback) => {
  const messenger = new Messenger(twilioClient);
  const userId = toUrlString(randomBytes(16));

  const response = {
    headers: { 'Access-Control-Allow-Origin': '*' }, // CORS requirement
    statusCode: 200,
    body: JSON.stringify({
      UserId: userId,
      User: event.body.username,
      To: event.body.to,
      message: event.body.message,
      RequestTime: new Date().toISOString(),
    })
  };

  Object.assign(event, { from: process.env.TWILIO_PHONE_NUMBER });

  messenger.send(event)
  .then(() => saveUser(userId, event.body.username, event.body.to))
  .then((message) => {
    // text message sent! ✅
    console.log(`message ${message.body}`);
    console.log(`date_created: ${message.date_created}`);
    response.body = JSON.stringify({
      message: 'Text message successfully sent!',
      data: message,
    });
    callback(null, response);
  })
  .catch((error) => {
    response.statusCode = error.status;
    response.body = JSON.stringify({
      message: error.message,
      error: error, // eslint-disable-line
    });
    callback(null, response);
  });
};

function saveUser(userId, username, phoneNumber) {
  return ddb.put({
      TableName: 'users-table-dev',
      Item: {
          UserId: userId,
          User: username,
          PhoneNumber: phoneNumber,
          RequestTime: new Date().toISOString(),
      },
  }).promise();
}

function toUrlString(buffer) {
  return buffer.toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
}