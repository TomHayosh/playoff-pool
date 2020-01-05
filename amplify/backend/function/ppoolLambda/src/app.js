/*
Copyright 2017 - 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
    http://aws.amazon.com/apache2.0/
or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and limitations under the License.
*/



const AWS = require('aws-sdk')
var awsServerlessExpressMiddleware = require('aws-serverless-express/middleware')
var bodyParser = require('body-parser')
var express = require('express')

AWS.config.update({ region: process.env.TABLE_REGION });

const dynamodb = new AWS.DynamoDB.DocumentClient();

let tableName = "ppool";
if(process.env.ENV && process.env.ENV !== "NONE") {
  tableName = tableName + '-' + process.env.ENV;
}

const userIdPresent = true; // TODO: update in case is required to use that definition
const partitionKeyName = "id";
const partitionKeyType = "S";
const sortKeyName = "";
const sortKeyType = "";
const hasSortKey = sortKeyName !== "";
const path = "/items";
const UNAUTH = 'UNAUTH';
const hashKeyPath = '/:' + partitionKeyName;
const sortKeyPath = hasSortKey ? '/:' + sortKeyName : '';
// declare a new express app
var app = express()
app.use(bodyParser.json())
app.use(awsServerlessExpressMiddleware.eventContext())

// Enable CORS for all methods
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
  next()
});

// convert url string param to expected Type
const convertUrlType = (param, type) => {
  switch(type) {
    case "N":
      return Number.parseInt(param);
    default:
      return param;
  }
}

const startTimesIndex = function(items) {
  var index = -1;
  for (var i = 0; i < items.length; i++) {
    if (items[i]['id'] === 'startTime') {
      index = i;
      // console.log("startTimes = " + index);
      break;
    }
  }
  return index;
}

const currentUserIndex = function(items, userid) {
  var index = -1;
  for (var i = 0; i < items.length; i++) {
    if (items[i]['id'] === userid) {
      index = i;
      // console.log("startTimes = " + index);
      break;
    }
  }
  return index;
}

const gameStarted = function(startTimes, round, game, now) {
  return (Date.parse(startTimes['r' + round + 'g' + game]) < now);
}

const processStartTimes = function(data, userid) {
  var newitems = [];
  var startTimes = startTimesIndex(data.Items);
  const now = Date.now();

  var i;
  for (i = 0; i < data.Items.length; i++) {
    if (data.Items[i]['realPerson'] === false) {
      newitems[i] = {...data.Items[i]};
    } else {
      var item = {};
      const keys = Object.keys(data.Items[i]);
      for (var j = 0; j < keys.length; j++) {
        if (keys[j].match(/r1g/) === null){
          item[keys[j]] = data.Items[i][keys[j]];
        } else {
          var k = Number.parseInt(keys[j][3]);
          const hasStarted = gameStarted(data.Items[startTimes], 1, k, now);
          item[keys[j]] = "";
          if (hasStarted || data.Items[i]['id'] === userid) {
            item[keys[j]] = data.Items[i][keys[j]];
          }
          item['edit-'+keys[j]] = false;
          if (!hasStarted && data.Items[i]['id'] === userid) {
            item['edit-'+keys[j]] = true;
          }
        }
      }
      newitems[i] = {...item};
    }
    /*
    var item = {};
    const keys = Object.keys(data.Items[i]);
    for (var j = 0; j < keys.length; j++) {
      if (key[j].match(/r1g/) !== null){
        item[key[j]] = data.Items[i][key[j]];
      } else {
        item[key[j]] = "pick";
      }
    }
    */
  }
  return newitems;
}

const logUserAttributes = async function(req, res) {
  // To get this to work, add AmazonCognitoReadOnly policy to the lambda function (playoffpoolLambdaRole207e11a6-devppool)
  // Do this in iAM -> Roles. Select the lambda function backend role then click Attach Policy
  var nameAndEmail = {
    "Name": "",
    "Email": ""
  }
  // Based on https://janhesters.com/how-to-access-the-user-in-lambda-functions-with-amplify/https://janhesters.com/how-to-access-the-user-in-lambda-functions-with-amplify/
  try {
    const IDP_REGEX = /.*\/.*,(.*)\/(.*):CognitoSignIn:(.*)/;
    const authProvider =
      req.apiGateway.event.requestContext.identity
        .cognitoAuthenticationProvider;
    const [, , , userId] = authProvider.match(IDP_REGEX);

    // But the next 4 lines are from https://serverless-stack.com/chapters/mapping-cognito-identity-id-and-user-pool-id.html
    const parts = authProvider.split(':');
    const userPoolIdParts = parts[parts.length - 3].split('/');

    const userPoolId = userPoolIdParts[userPoolIdParts.length - 1];
    const userPoolUserId = parts[parts.length - 1];
    // Needed to get userPoolId for use in the next section

    const cognito = new AWS.CognitoIdentityServiceProvider();
    const listUsersResponse = await cognito
      .listUsers({
        UserPoolId: userPoolId,
        Filter: `sub = "${userId}"`,
        Limit: 1,
      })
      .promise();
    const user = listUsersResponse.Users[0];
    const j = user["Attributes"].length;
    var i;
    for (i = 0; i < j; i++) {
      if (user["Attributes"][i]["Name"] === "name") {
        nameAndEmail["Name"] = user["Attributes"][i]["Value"]
        console.log("Just set Name to " + user["Attributes"][i]["Value"]);
      } else if (user["Attributes"][i]["Name"] === "email") {
        nameAndEmail["Email"] = user["Attributes"][i]["Value"]
        console.log("Just set Email to " + user["Attributes"][i]["Value"]);
      }
      console.log(user["Attributes"][i]["Name"] + " : " + user["Attributes"][i]["Value"]);
    }
//    res.json({ user, message: 'get call succeed!', url: req.url });
  } catch (error) {
    console.log("Got an error");
    console.log(error);
    // res.json({ error, message: 'get call failed' });
  }
  console.log(nameAndEmail["Name"] + ", " + nameAndEmail["Email"]);
}

/********************************
 * HTTP Get method for list objects *
 ********************************/

app.get(path, function(req, res) {
  var condition = {}
  condition[partitionKeyName] = {
    ComparisonOperator: 'EQ'
  }
  console.log(req.apiGateway.event);

  const game1start = Date.parse('28 Dec 2019 20:00:00 GMT');
  if (Date.now() < game1start) {
    console.log("The game has not started");
  } else {
    console.log("You cannot change this pick. The game has started");
  }
  res.json({fake: 'In the temp get function'});

  /*
  if (userIdPresent && req.apiGateway) {
    condition[partitionKeyName]['AttributeValueList'] = [req.apiGateway.event.requestContext.identity.cognitoIdentityId || UNAUTH ];
  } else {
    try {
      condition[partitionKeyName]['AttributeValueList'] = [ convertUrlType(req.params[partitionKeyName], partitionKeyType) ];
    } catch(err) {
      res.statusCode = 500;
      res.json({error: 'Wrong column type ' + err});
    }
  }

  let queryParams = {
    TableName: tableName,
    KeyConditions: condition
  }

  dynamodb.query(queryParams, (err, data) => {
    if (err) {
      res.statusCode = 500;
      res.json({error: 'Could not load items: ' + err});
    } else {
      res.json(data.Items);
    }
  });
  */
});

app.get(path + hashKeyPath, function(req, res) {
  var condition = {}
  condition[partitionKeyName] = {
    ComparisonOperator: 'EQ'
  }

  if (userIdPresent && req.apiGateway) {
    condition[partitionKeyName]['AttributeValueList'] = [req.apiGateway.event.requestContext.identity.cognitoIdentityId || UNAUTH ];
  } else {
    try {
      condition[partitionKeyName]['AttributeValueList'] = [ convertUrlType(req.params[partitionKeyName], partitionKeyType) ];
    } catch(err) {
      res.statusCode = 500;
      res.json({error: 'Wrong column type ' + err});
    }
  }

  let queryParams = {
    TableName: tableName,
    KeyConditions: condition
  }

  dynamodb.query(queryParams, (err, data) => {
    if (err) {
      res.statusCode = 500;
      res.json({error: 'Could not load items: ' + err});
    } else {
      res.json(data.Items);
    }
  });
});

/********************************
 * HTTP Get method for list objects *
 ********************************/

app.get(path + '/week1' + hashKeyPath + sortKeyPath, function(req, res) {
  /*
  var condition = {}
  condition[partitionKeyName] = {
    ComparisonOperator: 'EQ'
  }

  if (userIdPresent && req.apiGateway) {
    condition[partitionKeyName]['AttributeValueList'] = [req.apiGateway.event.requestContext.identity.cognitoIdentityId || UNAUTH ];
  } else {
    try {
      condition[partitionKeyName]['AttributeValueList'] = [ convertUrlType(req.params[partitionKeyName], partitionKeyType) ];
    } catch(err) {
      res.statusCode = 500;
      res.json({error: 'Wrong column type ' + err});
    }
  }
  */

  let queryParams = {
    TableName: tableName/*,
    ProjectionExpression: "r1g1, fullname"*/
  }

  // dynamodb.query(queryParams, (err, data) => {
  dynamodb.scan(queryParams, (err, data) => {
    if (err) {
      res.statusCode = 500;
      res.json({error: 'Could not load items: ' + err});
      console.log("Error getting week1: " + err);
    } else {
      const items = processStartTimes(data, req.apiGateway.event.requestContext.identity.cognitoIdentityId);
      // res.json(data.Items);
      // console.log("Got " + data.Items.length + " items");
      res.json(items);
      // console.log("Got " + items.length + " items");
    }
  });
});

/*****************************************
 * HTTP Get method for get single object *
 *****************************************/

app.get(path + '/object' + hashKeyPath + sortKeyPath, function(req, res) {
  var params = {};
  if (userIdPresent && req.apiGateway) {
    params[partitionKeyName] = req.apiGateway.event.requestContext.identity.cognitoIdentityId || UNAUTH;
  } else {
    params[partitionKeyName] = req.params[partitionKeyName];
    try {
      params[partitionKeyName] = convertUrlType(req.params[partitionKeyName], partitionKeyType);
    } catch(err) {
      res.statusCode = 500;
      res.json({error: 'Wrong column type ' + err});
    }
  }
  if (hasSortKey) {
    try {
      params[sortKeyName] = convertUrlType(req.params[sortKeyName], sortKeyType);
    } catch(err) {
      res.statusCode = 500;
      res.json({error: 'Wrong column type ' + err});
    }
  }

  let getItemParams = {
    TableName: tableName,
    Key: params
  }

  dynamodb.get(getItemParams,(err, data) => {
    if(err) {
      console.log("In err");
      res.statusCode = 500;
      res.json({error: 'Could not load items: ' + err.message});
    } else {
      if (data.Item) {
        console.log("Found item");
        res.json(data.Item);
      } else {
        console.log("Did not find item");
        // res.json(data) ;
        res.json({newEntrant: true});
      }
    }
  });
});


/************************************
* HTTP put method for insert object *
*************************************/

app.put(path + '/putter' + hashKeyPath + sortKeyPath, function(req, res) {
// app.put(path + '/object' + hashKeyPath + sortKeyPath, function(req, res) {
// app.put(path, function(req, res) {

  console.log("In update ");// + req.params[partitionKeyName] + " " + req.body['content']);
  console.log(req.body['r1g1']);

  if (userIdPresent) {
//    req.body['userId'] = req.apiGateway.event.requestContext.identity.cognitoIdentityId || UNAUTH;
    req.body[partitionKeyName] = req.apiGateway.event.requestContext.identity.cognitoIdentityId || UNAUTH;
  }

  let putItemParams = {
    TableName: tableName,
    Key: { "id": req.body[partitionKeyName] },
//    Key: { "id": "1575911024048" },
    UpdateExpression: "set r1g1 = :g1",
    ExpressionAttributeValues: { ":g1": req.body['r1g1'] },
//    ExpressionAttributeValues: { ":c": "Updated" },
    ReturnValues: "UPDATED_NEW"
  }
  dynamodb.update(putItemParams, (err, data) => {
    if(err) {
      console.log("Update had an error " + err);
      res.statusCode = 500;
      res.json({error: err, url: req.url, body: req.body});
    } else{
      console.log("Update succeeded");
      res.json({success: 'put call succeed!', url: req.url, data: data})
    }
  });
});

/************************************
* HTTP put method for insert object *
*************************************/

app.put(path, function(req, res) {
// app.put(path + '/object' + hashKeyPath + sortKeyPath, function(req, res) {
// app.put(path, function(req, res) {

  console.log("In update ");// + req.params[partitionKeyName] + " " + req.body['content']);
  console.log(req.body['r1g1']);

  let queryParams = {
    TableName: tableName
  }
  let tempBody = req.body;
  // dynamodb.query(queryParams, (err, data) => {
  dynamodb.scan(queryParams, (err, data) => {
    if (err) {
      res.statusCode = 500;
      res.json({error: 'Could not load items: ' + err});
      console.log("Error getting week1: " + err);
    } else {
      if (userIdPresent) {
        req.body[partitionKeyName] = req.apiGateway.event.requestContext.identity.cognitoIdentityId || UNAUTH;
      }

      var startTimes = startTimesIndex(data.Items);
      const now = Date.now();
      var gamesToUpdate = 0;
      var updateExpression = "set ";
      var expressionAttributeValues = "{ ";
      var round = 1;
      var game = 1;
      for (game = 4; game > 0; game--) {
        const hasStarted = gameStarted(data.Items[startTimes], round, game, now);
        if (hasStarted) {
          console.log("Can't update. Round " + round + " game " + game + " has started");
          //res.json({error: "Can't update. Round " + round + " game " + game + " has started", url: req.url, body: req.body})
          break;
        } else {
          console.log("Can update round " + round + " game " + game);
          if (gamesToUpdate > 0) {
            updateExpression += ", ";
            expressionAttributeValues += ", ";
          }
          gamesToUpdate++;
          rg = "r" + round + "g" + game;
          updateExpression += rg + " = :" + rg;
          // expressionAttributeValues[rg] = req.body[rg];
          // console.log(JSON.stringify(expressionAttributeValues));
          expressionAttributeValues += '":' + rg + '": ' + 10;
          // expressionAttributeValues += '":' + rg + '": ' + req.body['r'+round+'g'+game];
          console.log('r'+round+'g'+game);
          console.log(req.body['r'+round+'g'+game]);
          console.log("Game 2 is " + req.body['r1g2'] + " or " + tempBody['r1g2']);
          console.log(expressionAttributeValues);
        }
      }
      expressionAttributeValues += ' }';
      console.log("updateExpression = " + updateExpression);
      console.log(expressionAttributeValues);
      if (gamesToUpdate > 0) {
        let putItemParams = {
          TableName: tableName,
          Key: { "id": req.body[partitionKeyName] },
          // Key: { "id": "1575911024048" },
          UpdateExpression: updateExpression,//"set r1g1 = :g1",
          ExpressionAttributeValues: JSON.parse(expressionAttributeValues),//{ ":g1": req.body['r1g1'] },
          // ExpressionAttributeValues: { ":c": "Updated" },
          ReturnValues: "UPDATED_NEW"
        }
        dynamodb.update(putItemParams, (err, data) => {
          if(err) {
            console.log("Update had an error " + err);
            res.statusCode = 500;
            res.json({error: err, url: req.url, body: req.body});
          } else{
            console.log("Update succeeded");
            res.json({success: 'put call succeed!', url: req.url, data: data})
          }
        });
      }
    }
  });
});

/************************************
* HTTP post method for insert object *
*************************************/

app.post(path, async function(req, res) {

  if (userIdPresent) {
//    req.body['userId'] = req.apiGateway.event.requestContext.identity.cognitoIdentityId || UNAUTH;
    req.body[partitionKeyName] = req.apiGateway.event.requestContext.identity.cognitoIdentityId || UNAUTH;
  }

//  const nameAndEmail = await logUserAttributes(req, res).promise();
  // To get this to work, add AmazonCognitoReadOnly policy to the lambda function (playoffpoolLambdaRole207e11a6-devppool)
  // Do this in iAM -> Roles. Select the lambda function backend role then click Attach Policy
  var nameAndEmail = {
    "Name": "",
    "Email": ""
  }
  // Based on https://janhesters.com/how-to-access-the-user-in-lambda-functions-with-amplify/https://janhesters.com/how-to-access-the-user-in-lambda-functions-with-amplify/
  try {
    const IDP_REGEX = /.*\/.*,(.*)\/(.*):CognitoSignIn:(.*)/;
    const authProvider =
      req.apiGateway.event.requestContext.identity
        .cognitoAuthenticationProvider;
    const [, , , userId] = authProvider.match(IDP_REGEX);

    // But the next 4 lines are from https://serverless-stack.com/chapters/mapping-cognito-identity-id-and-user-pool-id.html
    const parts = authProvider.split(':');
    const userPoolIdParts = parts[parts.length - 3].split('/');

    const userPoolId = userPoolIdParts[userPoolIdParts.length - 1];
    const userPoolUserId = parts[parts.length - 1];
    // Needed to get userPoolId for use in the next section

    const cognito = new AWS.CognitoIdentityServiceProvider();
    const listUsersResponse = await cognito
      .listUsers({
        UserPoolId: userPoolId,
        Filter: `sub = "${userId}"`,
        Limit: 1,
      })
      .promise();
    const user = listUsersResponse.Users[0];
    const j = user["Attributes"].length;
    var i;
    for (i = 0; i < j; i++) {
      if (user["Attributes"][i]["Name"] === "name") {
        nameAndEmail["Name"] = user["Attributes"][i]["Value"]
        console.log("Just set Name to " + user["Attributes"][i]["Value"]);
      } else if (user["Attributes"][i]["Name"] === "email") {
        nameAndEmail["Email"] = user["Attributes"][i]["Value"]
        console.log("Just set Email to " + user["Attributes"][i]["Value"]);
      }
      console.log(user["Attributes"][i]["Name"] + " : " + user["Attributes"][i]["Value"]);
    }
//    res.json({ user, message: 'get call succeed!', url: req.url });
  } catch (error) {
    console.log("Got an error");
    console.log(error);
    // res.json({ error, message: 'get call failed' });
  }
  console.log(nameAndEmail["Name"] + ",,, " + nameAndEmail["Email"]);
  req.body['fullname'] = nameAndEmail["Name"];
  req.body['email'] = nameAndEmail["Email"];

  let putItemParams = {
    TableName: tableName,
    Item: req.body
  }
  dynamodb.put(putItemParams, (err, data) => {
    if(err) {
      res.statusCode = 500;
      res.json({error: err, url: req.url, body: req.body});
    } else{
      res.json({success: 'post call succeed!', url: req.url, data: data})
    }
  });
});

/**************************************
* HTTP remove method to delete object *
***************************************/

app.delete(path + '/object' + hashKeyPath + sortKeyPath, function(req, res) {
  var params = {};
  if (userIdPresent && req.apiGateway) {
    params[partitionKeyName] = req.apiGateway.event.requestContext.identity.cognitoIdentityId || UNAUTH;
  } else {
    params[partitionKeyName] = req.params[partitionKeyName];
     try {
      params[partitionKeyName] = convertUrlType(req.params[partitionKeyName], partitionKeyType);
    } catch(err) {
      res.statusCode = 500;
      res.json({error: 'Wrong column type ' + err});
    }
  }
  if (hasSortKey) {
    try {
      params[sortKeyName] = convertUrlType(req.params[sortKeyName], sortKeyType);
    } catch(err) {
      res.statusCode = 500;
      res.json({error: 'Wrong column type ' + err});
    }
  }

  let removeItemParams = {
    TableName: tableName,
    Key: params
  }
  dynamodb.delete(removeItemParams, (err, data)=> {
    if(err) {
      res.statusCode = 500;
      res.json({error: err, url: req.url});
    } else {
      res.json({url: req.url, data: data});
    }
  });
});
app.listen(3000, function() {
    console.log("App started")
});

// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file
module.exports = app
