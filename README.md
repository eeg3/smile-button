# smile-button

## Overview

Search an S3 Bucket for Pictures with Smiles using AWS Rekognition. Send the Smile via MMS/Text Message. Trigger it all with an AWS IoT Button to turn into a Smile Button! 

1. Obtain list of Objects in an S3 Bucket
2. Pick a random Object in the list, and pass it to [AWS Rekognition](https://aws.amazon.com/rekognition/) [DetectFaces](https://docs.aws.amazon.com/rekognition/latest/dg/API_DetectFaces.html) API.
3. Check to see if the Object contains a Smile at >=90% Confidence. If not, go back to Step 2.
4. Generate a [pre-signed URL](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#getSignedUrl-property) to the S3 Object that will last 60 seconds.
5. Use [Twilio](https://www.twilio.com/) to [send an MMS/Text Message](https://www.twilio.com/docs/api/messaging/send-messages) of the Object.


## Provisioning

### Pre-requisites

[Twilio](https://www.twilio.com/) is used to send the MMS/Text Messages. A free [trial account](https://www.twilio.com/try-twilio) can be used. Once an account is created, follow the standard setup, and then grab the `Account Sid` and `Auth Token`; these will be used during deployment so the text messages can be sent. Amazon SNS [cannot send MMS messages](https://aws.amazon.com/sns/faqs/#sms-related-questions), which is why Twilio is used.

Before running the deployment through CloudFormation, run `npm install` to add the twilio helper library.

### Configuration

#### config.parameters
Included is a template to deploy the code with AWS CloudFormation using a [SAM Template](https://docs.aws.amazon.com/lambda/latest/dg/deploying-lambda-apps.html). This template's parameters are configured through the `config.parameters` file (or Defaults manually changed in `deploy.yaml`), which requires:

1. **ImageBucketName**: The name of the S3 Bucket to create that will host the images.
2. **TwilioAccountSid**: The Twilio Account Sid 
3. **TwilioAuthToken**: The Twilio Auth Token
4. **TwilioFromNumber**: Phone number to use from Twilio Account
5. **TwilioToNumber**: Phone number to send the image.

#### package.json
Within the package.json are the commands to deploy through CloudFormation using `aws cloudformation package` and `aws cloudformation deploy`. Make sure to modify:

1. **[INSERT-LAMBDA-UPLOAD-BUCKET]**: This is the bucket where the Lambda function zip file will be uploaded so it can be deployed.
2. **[INSERT-STACK-NAME]**: The name of the CloudFormation [Stack](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/stacks.html).

### Deployment

Execute the following to deploy: `npm deploy`. A CloudFormation stack will be created with:

1. **AWS::S3::Bucket**: An S3 Bucket will be created to house the images.
2. **AWS::Lambda::Function**: The Lambda function that makes up the core of the application.
3. **AWS::IAM::Role**: An IAM Role that contains policies to allow Lambda execution, read access to the created S3 bucket, and access to Rekognition's DetectFaces functionality. 


## Execution

First, upload a bunch of images to the created S3 bucket. Make sure to add some with smiles, but also some without. Next, navigate to the created Lambda function, and run a Test of the function. If all is configured properly, an MMS with a smile should be sent!

To turn it into an actual button, configure an [AWS IoT button](https://aws.amazon.com/iotbutton/) to execute the Lambda function. I use the [AWS IoT Button Dev](https://itunes.apple.com/us/app/aws-iot-button-dev/id1178216626?mt=8) iOS App personally, but this could also be configured programmatically by adding the trigger to the CloudFormation template code.