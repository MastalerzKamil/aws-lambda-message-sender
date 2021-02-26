# Getting Started
1. Remember abount changing phone number in `event.json` file
2. Use `aws-lambda-message-sender % serverless invoke local -f sendText -l --path event.jso` to invoke function locally with parameters from `event.json`
3. Use `serverless deploy function -f sendText` to deploy function with `sendText` function name
4. Use `serverless remove` to remove lamda function from cloud
# Sources

- [Serverless Github](https://github.com/serverless/serverless)
- [Twilio send messages example](https://github.com/serverless/examples/tree/master/aws-node-twilio-send-text-message)