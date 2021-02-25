'use strict';
const request = require('request-promise-native')

module.exports.hello = async (context, event, callback) => {
  const { ACCOUNT_SID, AUTH_TOKEN, SEND_SMS_FROM, SEND_SMS_TO } = process.env;

  const requestBody = event.body;

  request.post({
    url: `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/Messages.json`,
    json: true,
    'auth': {
      'user': ACCOUNT_SID,
      'pass': AUTH_TOKEN
    },
    form: {
      From: SEND_SMS_FROM,
      To: requestBody.DestPhoneNumber,
      Body: requestBody.Message
    }
  })
  .then((data) => {
    console.log(`Message successfully sent to ${SEND_SMS_TO}`);
    callback(null, {
      statusCode: 201,
      body: JSON.stringify({
        To: requestBody.DestPhoneNumber,
        Message: requestBody.Message
      }),
      headers: {
          'Access-Control-Allow-Origin': '*',
      },
    });
  })
  .catch((err) => {
    console.error(err);
    errorResponse(err.message, context.awsRequestId, callback)
    return callback(err);
  });
};


function errorResponse(errorMessage, awsRequestId, callback) {
  callback(null, {
    statusCode: 500,
    body: JSON.stringify({
      Error: errorMessage,
      Reference: awsRequestId,
    }),
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  });
}
