# Commands
Taken from (here)[https://github.com/serverless/serverless]

- `serverless invoke local -f hello -l --data '{"Body": { "Message": "Your message", "DestPhoneNumber": "+48532390966"}}'` - invoke function with parameters to send message
- `serverless deploy function -f hello` - Deploy function with `hello` function name
- `serverless remove`