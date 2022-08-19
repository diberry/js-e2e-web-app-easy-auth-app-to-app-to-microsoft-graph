
const express = require('express');

require('isomorphic-fetch');

const MSAL = require('@azure/msal-node');
const graph = require("@microsoft/microsoft-graph-client");

async function getGraphToken(backEndAccessToken){

  const config = {

    // grab env vars from App Service - they should already be there from easy auth AAD

    auth: {
      // this is the API CLIENT ID (in this example, App B with scopes to Graph)
      // CONFIG NAME set by easy auth
      clientId: process.env.WEBSITE_AUTH_CLIENT_ID,
      // CONFIG NAME set by easy auth
      clientSecret: process.env.MICROSOFT_PROVIDER_AUTHENTICATION_SECRET,
      // how do I know where to find this value from my app registration?
      // is this the authority to Graph? 
      // "WEBSITE_AUTH_OPENID_ISSUER": "https://sts.windows.net/51397421-87d6-42c1-8bab-98305329d75c/v2.0",
      // Who is issuer of token - should map to app registation
      // portal for AAD - Overview Endpoints - OAuth 2.0 authorization endpoint (v2)
      // should be: https://login.microsoftonline.com/51397421-87d6-42c1-8bab-98305329d75c/oauth2/v2.0/authorize
      authority: "https://login.microsoftonline.com/51397421-87d6-42c1-8bab-98305329d75c"
    },
    system: {
      loggerOptions: {
        loggerCallback(loglevel, message, containsPii) {
          console.log(message);
        },
        piiLoggingEnabled: true,
        logLevel: MSAL.LogLevel.Verbose,
      }
    }
  };

  const clientCredentialAuthority = new MSAL.ConfidentialClientApplication(config);

  const oboRequest = {
    oboAssertion: backEndAccessToken,
    // do I need to set this?
    // this scope must already exist on the API app registration and visible in resources.azure.com app auth config
    scopes: ["https://graph.microsoft.com/.default"]
  }

  // Easy auth is validating token in runtime
  // from headers that can't be set externally

  // If you aren't using Easy Auth with App Service, 
  // you must validate your access token


  const { accessToken } = await clientCredentialAuthority.acquireTokenOnBehalfOf(oboRequest);
  console.log(`graphAccessToken: ${accessToken}`);
  return accessToken;
}
function getAuthenticatedClient(accessToken) {
  // Initialize Graph client
  const client = graph.Client.init({
    // Use the provided access token to authenticate requests
    authProvider: (done) => {
      done(null, accessToken);
    }
  });

  return client;
}

async function getGraphProfile(accessToken) {
  try {

    console.log(`getUsersProfile::accessToken: ${accessToken}`);

    const graphToken = await getGraphToken(accessToken);
    const graphClient = getAuthenticatedClient(graphToken);

    const profile = await graphClient
      .api('/me')
      .get();

    return profile;

  } catch (err) {
    console.log(err);
    throw err;
  }
}
// </getGraph>

const create = async () => {
  const app = express();

  // <routeInjectedToken>
  app.get('/view-injected-token', async (req, res) => {

    const accessToken = req.headers['x-ms-token-aad-access-token'];
    if (!accessToken) return res.send('No access token found');
    console.log(`accessToken: ${accessToken}`);

    return res.json(accessToken);
  });
  // </routeInjectedToken>

  // <routeHome>
  // Display form and table
  app.get('/', async (req, res) => {
    return res.send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="ie=edge">
        <title>Easy auth - Microsoft Graph Profile</title>
      </head>
      <body>
      <h1>Easy auth</h1>


      <h5>1 app</h5>
      <p><a href="/get-access-token">x-ms-token-aad-access-token</a></p>

      <h5>2 apps (client)</h5>
      <p><a href="/get-remote-profile-client-app">Get remote profile</a></p>

      <h5>Logout</h5>
      <p><a href="/.auth/logout">Log out</a></p>
      <hr>
      <h5>Additional resources</h5>
      <p><a href="https://developer.microsoft.com/en-us/graph/graph-explorer">Explore with the Microsoft Graph interactive explorer</a></p>
      <p><a href="https://jwt.ms/">Decode access token with JWT.ms</a></p>
      <hr>
      <p>${JSON.stringify(process.env, null, 4)}</p>
      </body>
    </html>
    `);
  });
  // </routeHome>

  app.get('/get-access-token', async (req, res) => {
    let accessToken;

    try {
      // should have `x-ms-token-aad-access-token`
      // insert from App Service if
      // MS AD identity provider is configured
      accessToken = req.headers['x-ms-token-aad-access-token'];
      if (!accessToken) return res.status(401).send('No access token found');
      console.log(`accessToken: ${accessToken}`);

      res.json({ accessToken: accessToken })

    } catch (err) {
      console.log(`err: ${JSON.stringify(err)}`);
      return res.status(202).json(JSON.stringify(err));
    }
  });

  app.get('/get-profile', async (req, res) => {

    console.log("/get-profile");

    let profile;
    let accessToken;
    let bearerToken;

    try {

      bearerToken = req.headers['Authorization'] || req.headers['authorization'];
      if (!bearerToken) return res.status(401).json({error: 'No bearer token found'});
      console.log(`bearerToken: ${bearerToken}`);

      accessToken = bearerToken.split(' ')[1];
      if (!accessToken) return res.status(401).json({error: 'No access token found'});
      console.log(`accessToken: ${accessToken}`);

      profile = await getGraphProfile(accessToken);
      console.log(`profile: ${JSON.stringify(profile)}`);
      return res.status(200).json(profile);

    } catch (err) {
      console.log(`err: ${JSON.stringify(err)}`);
      return res.status(200).json({ 
        "server_response": err,
        "message": err.message
    });
    }
  });

  // </routeGetProfile>

  // instead of 404 - just return home page
  app.get('*', (req, res) => {
    res.redirect('/');
  });

  return app;
};

module.exports = {
  create
}