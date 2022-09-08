// <getDependencies>
// Express.js app server
import express from 'express';
import 'isomorphic-fetch';
import MSAL from '@azure/msal-node';
import graph from "@microsoft/microsoft-graph-client";
// </getDependencies>

// <getTenantId>
function getTenantId(){
  // process.env.WEBSITE_AUTH_OPENID_ISSUER should look something like: 
  // https://sts.windows.net/YOUR-TENANT-ID-AS-GUID/v2.0
  const openIdIssuer = process.env.WEBSITE_AUTH_OPENID_ISSUER;
  console.log(openIdIssuer);

  const apiBAppTenantId = openIdIssuer.replace(/https:\/\/sts\.windows\.net\/(.{1,36})\/v2\.0/gm, '$1');
  console.log(`apiBAppTenantId = ${apiBAppTenantId}`);

  return apiBAppTenantId; 
}
// </getTenantId>


// <getGraphToken>
async function getGraphToken(backEndAccessToken) {

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
      // "WEBSITE_AUTH_OPENID_ISSUER": "https://sts.windows.net/API-B-TENANT-ID/v2.0",
      // Who is issuer of token - should map to app registation
      // portal for AAD - Overview Endpoints - OAuth 2.0 authorization endpoint (v2)
      // should be: https://login.microsoftonline.com/API-B-TENANT-ID
      authority: `https://login.microsoftonline.com/${getTenantId()}`
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
// </getGraphToken>

// <getGraphProfile>
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
// </getGraphProfile>

// <create>
export const create = async () => {

  // Create express app
  const app = express();

  // Get api tenent
  app.get('/get-tenant', async (req, res) => {
    res.send(`Tenant Id = ${getTenantId()}`);
  })

  // Get Profile and return to client
  app.get('/get-profile', async (req, res) => {

    console.log("/get-profile");

    let profile;
    let accessToken;
    let bearerToken;

    try {

      bearerToken = req.headers['Authorization'] || req.headers['authorization'];
      if (!bearerToken) return res.status(401).json({ error: 'No bearer token found' });
      console.log(`bearerToken: ${bearerToken}`);

      accessToken = bearerToken.split(' ')[1];
      if (!accessToken) return res.status(401).json({ error: 'No access token found' });
      console.log(`accessToken: ${accessToken}`);

      profile = await getGraphProfile(accessToken);
      console.log(`profile: ${JSON.stringify(profile)}`);
      return res.status(200).json({
        profile,
        headers: req.headers,
        bearerToken,
        env: process.env,
        error: null
      });

    } catch (err) {
      console.log(`err: ${JSON.stringify(err)}`);
      return res.status(200).json({
        error: {
          "profile": "error",
          "server_response": err,
          "message": err.message
        }
      });
    }
  });

  // instead of 404 - just return home page
  app.get('*', (req, res) => {
    res.redirect('/');
  });

  return app;
};
// </create>
