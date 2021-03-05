/*
* Copyright (c) 2021 SailPoint Technologies, Inc.
*
* SPDX-License-Identifier: Apache-2.0
*/


// import modules
const http = require("https");

// global information
const tenantConfig = {
    "url": "example.identitynow.com",
    "api-url": "example.api.identitynow.com",
    "client-id": "...",
    "client-secret": "..."
};

// These are headers which will be shared for all calls.
var headers = {
    "content-type": "application/json"
};

// get the access token (authentication and authorization)
function get_access_token() {
    return new Promise((resolve,reject) => {
        let _options = {
            "method": "POST",
            "hostname": tenantConfig["api-url"],
            "path": `/oauth/token?grant_type=client_credentials&client_id=${tenantConfig['client-id']}&client_secret=${tenantConfig['client-secret']}`,
            "headers": {
                "content-type": "application/json"
            }
        };
        var req = http.request(_options, function (res) {
            var chunks = [];
            res.on("data", function (chunk) {
                chunks.push(chunk);
            });
            res.on("end", function () {
                var body = (Buffer.concat(chunks)).toString();
                console.log("get_access_token: response body: " + body);
                var result = JSON.parse(body);
                if( result["access_token"] == undefined ) {
                    reject( { status:"error", error:result, token:"" } );
                } else {
                    headers["authorization"] = `Bearer ${result["access_token"]}`;
                    resolve( { status:"ok", error:"", token:result["access_token"] } );
                }
            });
        });
        req.end();
    });
}

// Creates a certification campaign for an identity
function create_cert_campaign( certifierId, identityId, identityName ) {
    return new Promise((resolve,reject) => {
        let _options = {
            "method": "POST",
            "hostname": tenantConfig["api-url"],
            "path": "/cc/api/campaign/create",
            "headers": headers
        };
        let req = http.request(_options, function (res) {
            var chunks = [];
            res.on("data", function (chunk) {
                chunks.push(chunk);
            });
            res.on("end", function () {
                var body = (Buffer.concat(chunks)).toString();
                console.log("create_cert_campaign: response body: " + body);
                var result = JSON.parse(body);
                resolve( { status:"ok", error:"", response:body, id:result["id"] } );
            });
        });
        var json_body = JSON.stringify({
            "accessInclusionList": null,
            "allowAutoRevoke": false,
            "deadline": "2021-04-01",
            "description": "This identity access review is generated on a department change event",
            "disableEmail": false,
            "identityIdList": [
                identityId
            ],
            "identityQueryString": null,
            "name": `Department Change Access Review for ${identityName}`,
            "staged": false,
            "staticReviewerId": certifierId,
            "timeZone": "GMT-0600",
            "type": "Identity"
        });
        console.log("create_cert_campaign: request body: " + json_body );
        req.write(json_body);
        req.end();
    });
}

// Creates a certification campaign for an identity
function activate_cert_campaign( campaignId ) {
     return new Promise((resolve,reject) => {
        let _options = {
            "method": "POST",
            "hostname": tenantConfig["api-url"],
            "path": "/cc/api/campaign/activate",
            "headers": headers
        };
        let req = http.request(_options, function (res) {
            var chunks = [];
            res.on("data", function (chunk) {
                chunks.push(chunk);
            });
            res.on("end", function () {
                var body = (Buffer.concat(chunks)).toString();
                console.log("activate_cert_campaign: response body: " + body);
                resolve( { status:"ok", error:"", response:body } );
            });
        });
        var json_body = JSON.stringify({
            "campaignId": campaignId,
            "timeZone": "GMT-06:00"
        });
        console.log("activate_cert_campaign: request body: " + json_body );
        req.write(json_body);
        req.end();
    });
}

exports.handler = async (event) => {

    // Our initial response
    var response = {
        statusCode: 200,
        body: JSON.stringify('Success'),
    };

    console.log( "Event input: " + JSON.stringify( event ) );

    const identityId = event.detail.identity.id;
    console.log( "identityId: " + identityId );

    const identityName = event.detail.identity.name;
    console.log( "identityName: " + identityName );

    // We have this certifier hardcoded to a person for this... in a real-world scenario, you might want this to be more dynamic.
    const certifierId = "ff80818155fe8c080155fe8d925b0316";
    console.log( "certifierId: " + certifierId );

    // Call SailPoint and get Access Token
    let _call1 = await get_access_token();

    // If access token was granted...
    if( _call1["status"] == "ok" ) {

        let _call2 = await create_cert_campaign( certifierId, identityId, identityName );

        if( _call2["status"] == "ok" && _call2["id"] ) {

            response.body = JSON.stringify('Success creating certification campaign. ' );

            let campaignId = _call2["id"];
            console.log("campaignId: " + campaignId );

            let _call3 = await activate_cert_campaign( campaignId );

            if( _call3["status"] == "ok" ) {
                response.body = JSON.stringify('Success creating certification campaign. ' );
            } else {
                response.body = JSON.stringify('Error creating certification campaign: ' + _call3["status"] );
            }
        } else {
            response.body = JSON.stringify('Error creating certification campaign: ' + _call2["status"] );
        }

    // Some problem with getting the access token.
    } else {
        response.body = JSON.stringify('Error getting Access Token: ' + _call1["status"]);
    }

    return response;
};

