var AWS = require('aws-sdk');
var twilio = require('twilio'); // Twilio used to send images via MMS https://www.twilio.com/docs/api/messaging/send-messages

// Configure Twilio Client
var client = new twilio(process.env.TWILIO_ACCOUNTSID, process.env.TWILIO_AUTHTOKEN);

// Configure AWS S3 Client
var S3 = new AWS.S3({
    apiVersion: '2006-03-01'
});

// Configure AWS Rekognition Client
var rekognition = new AWS.Rekognition({
    region: process.env.AWS_REGION
});

// Bucket Object that houses name, directory listing, and a random file to check.
var bucket = {
    name: process.env.IMAGE_BUCKET,
    list: [],
    file: null
}

console.log("Sending Smiles from: " + process.env.TWILIO_FROMNUMBER);
console.log("Sending Smiles to: " + process.env.TWILIO_TONUMBER);

// Recursive function to get all objects in S3 Bucket. 
// S3.listObjects() only returns up to 1,000 items, and requires recursion with a marker to obtain remainder.
function s3ListObjects(parameters, cb) {
    S3.listObjects(parameters, function (err, data) {
        if (err) {
            console.log("Error:", err);
        } else {
            var contents = data.Contents;
            bucket.list = bucket.list.concat(contents);
            if (data.IsTruncated) { // True if there are more objects beyond what was returned
                parameters.Marker = contents[contents.length - 1].Key; // Set Marker to last returned key
                s3ListObjects(parameters, cb);
            } else {
                cb();
            }
        }
    });
}

// Function to check whether file contains a smile
function checkSmile(file, cb) {

    // Use AWS Rekognition's detectFaces() function to check for smiles in the file.
    // Function documentation: https://docs.aws.amazon.com/rekognition/latest/dg/API_DetectFaces.html
    rekognition.detectFaces({
        Attributes: ["ALL"],
        Image: {
            S3Object: {
                Bucket: bucket.name,
                Name: decodeURIComponent(file.replace(/\+/g, ' '))
            }
        }
    }, function (err, data) {
        var smile = false;

        if (err) {
            console.log(err, err.stack); // an error occurred
        } else {
            var numOfFaces = Object.keys(data["FaceDetails"]).length;
            console.log("Number of faces: " + numOfFaces)

            // For full FaceDetail structure information: https://docs.aws.amazon.com/rekognition/latest/dg/API_FaceDetail.html
            for (var i = 0; i < numOfFaces; i++) {
                if (data["FaceDetails"][i]["Smile"]["Value"] && data["FaceDetails"][i]["Smile"]["Confidence"] >= 90) {
                    smile = true;
                    break;
                }
            }

            if (smile == false) {
                console.log("No smile found. :(")
                bucket.file = bucket.list[Math.floor(Math.random() * bucket.list.length)];
                checkSmile(bucket.file.Key, cb); // Keep trying if there is no smile.
            } else {
                console.log("Smile found. :)");
                cb();
            }
        }
    });
}

exports.handler = (event, context, callback) => {
    bucket.list = [];

    // Get bucket listing, select random objects and check for smile until found, send object via MMS
    s3ListObjects({
        Bucket: bucket.name
    }, function () {

        bucket.file = bucket.list[Math.floor(Math.random() * bucket.list.length)];

        checkSmile(bucket.file.Key, function () {
            console.log("Found a smile: " + bucket.file.Key);

            var url = S3.getSignedUrl('getObject', {
                Bucket: bucket.name,
                Key: bucket.file.Key,
                Expires: 60
            });
            console.log("Pre-signed URL:", url);
            client.messages.create({
                    to: process.env.TWILIO_TONUMBER, // Text this number
                    from: process.env.TWILIO_FROMNUMBER, // From a valid Twilio number
                    mediaUrl: url
                })
                .then((message) => console.log(message.sid));

        });

    });

}