# smile-button

## Installation

Create a Twilio account.

Edit the following files:
1. **config.parameters**: Modify Parameter defaults with your settings. Check the deploy.yaml file for descriptions of each Parameter.
2. **package.json**: Modify the scripts section and edit [INSERT-LAMBDA-UPLOAD-BUCKET] to be a bucket to host the Lambda zip package, and [INSERT-STACK-NAME] to be the preferred name of the stack.

Run `npm run deploy`.

Upload an image into your Images Bucket

Click Test in the Lambda function.

Create IOT Button trigger.

## Changing Config

To modify the configuration, simply edit the Environment Variables within the Lambda Function.