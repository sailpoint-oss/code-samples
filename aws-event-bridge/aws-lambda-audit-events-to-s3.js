/*
* Copyright (c) 2021 SailPoint Technologies, Inc.
*
* SPDX-License-Identifier: MIT
*/

const AWS = require('aws-sdk');
const util = require('util');

// get reference to S3 client
const s3 = new AWS.S3();

// This is our S3 bucket
const s3bucket = "sailpoint-audit-records";

exports.handler = async (event, context, callback) => {

  // Our initial response
  var response = {
      statusCode: 200,
      body: JSON.stringify('Success'),
  };

  console.log( "Event input: " + JSON.stringify( event ) );

  // Get the audit data... we'll use a preview for our demo

  console.log( "Event Detail: " + JSON.stringify( event.detail ) );

  //const auditData = event.detail.searchResultsEvent.preview;


  const time = event.time;

  // Now upload the audit data into S3

  try {

    const dest_params = {
      Bucket: s3bucket,
      Key: time,
      Body: auditData,
      ContentType: "application/json"
    };

    const putResult = await s3.putObject(dest_params).promise();

  } catch (error) {
    console.log(error);
    return;
  }

  return response;
};

