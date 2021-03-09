const randomBytes = require('crypto').randomBytes;
const Messenger = require('./messenger.js');

const AWS = require('aws-sdk');

const ddb = new AWS.DynamoDB.DocumentClient();

const lambda = new AWS.Lambda({
  region: "eu-central-1"
});

const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const giveMeAJoke = require('give-me-a-joke');
const twilioClient = require('twilio')(twilioAccountSid, twilioAuthToken); // eslint-disable-line

module.exports.sendText = (event, context, callback) => {
  const messenger = new Messenger(twilioClient);

  const response = {
    headers: { 'Access-Control-Allow-Origin': '*' }, // CORS requirement
    statusCode: 200,
    body: JSON.stringify({
      To: event.body.to,
      message: event.body.message,
      RequestTime: new Date().toISOString(),
    })
  };

  Object.assign(event, { from: process.env.TWILIO_PHONE_NUMBER });

  messenger.send(event)
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
  .catch((err) => {
    console.error(err);
    errorResponse(err.message, context.awsRequestId, callback);
  });
};

module.exports.addTemplate = (event, context, callback) => {
  const templateId = toUrlString(randomBytes(16));
  saveTemplate(templateId, event.body.template)
  .then(() => {
    callback(null, {
      statusCode: 201,
      body: JSON.stringify({
        TemplateId: templateId,
        Template: event.body.template
      }),
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    });
  })
  .catch((err) => {
    console.error(err);
    errorResponse(err.message, context.awsRequestId, callback);
  })
};

module.exports.addUser = (event, context, callback) => {
  const userId = toUrlString(randomBytes(16));

  saveUser(userId, event.body.username, event.body.phoneNumber)
  .then(() => {
    callback(null, {
      statusCode: 201,
      body: JSON.stringify({
        UserId: userId,
        PhoneNumber: event.body.phoneNumber
      }),
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    });
  })
  .catch((err) => {
    console.error(err);
    errorResponse(err.message, context.awsRequestId, callback);
  });
};

module.exports.triggerJokes = (event, context, callback) => {
  const fakePhoneNumber = ['+48532390966', '+48532390966'];
  giveMeAJoke.getRandomCNJoke((joke) => {
    fakePhoneNumber.forEach(phoneNumber => {
      const params = {
        FunctionName: 'aws-lambda-message-sender-dev-sendText',
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify({
          body: {
            to: phoneNumber,
            message: joke
          }
        }),
      };

      return lambda.invoke(params, (error, data) => {
        if (error) {
          console.error(JSON.stringify(error));
          return new Error(`Error printing messages: ${JSON.stringify(error)}`);
        } else if (data) {
          console.log(data);
        }
      })
    });
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

function saveTemplate(templateId, template) {
  return ddb.put({
    TableName: 'message-templates-dev',
    Item: {
      TemplateId: templateId,
      Template: template,
    },
  }).promise();
}

function toUrlString(buffer) {
  return buffer.toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
}

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
