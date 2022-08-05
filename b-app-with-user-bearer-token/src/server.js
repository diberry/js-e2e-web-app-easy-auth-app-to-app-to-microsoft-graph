// general dependencies

// <getDependencies>
// Express.js app server
import express from 'express';

// Microsoft 
import graph from '@microsoft/microsoft-graph-client';
import 'isomorphic-fetch';
// </getDependencies>

// Play with Microsoft Graph 
//    https://developer.microsoft.com/en-us/graph/graph-explorer
// Debug JWT token 
//    https://jwt.ms/
// <getGraphClient>
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
// </getGraphClient>

// <getUsersProfile>
async function getUsersProfile(accessToken) {
  try {
    const graphClient = getAuthenticatedClient(accessToken);

    const profile = await graphClient
      .api('/me')
      .get();

    console.log(`Profile: ${JSON.stringify(profile, null, 2)}`);

    return profile;

  } catch (err) {
    console.log(err.message);
    throw err;
  }
}
// </getUsersProfile>

export const create = async () => {
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
      <p><a href="/get-profile-access-token">x-ms-token-aad-access-token</a></p>

      <h5>2 apps (client)</h5>
      <p><a href="/get-remote-profile-client-app">Get remote profile</a></p>

      <h5>Logout</h5>
      <p><a href="/.auth/logout">Log out</a></p>
      <hr>
      <h5>Additional resources</h5>
      <p><a href="https://developer.microsoft.com/en-us/graph/graph-explorer">Explore with the Microsoft Graph interactive explorer</a></p>
      <p><a href="https://jwt.ms/">Decode access token with JWT.ms</a></p>
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

      res.json({accessToken: accessToken})

    } catch (err) {
      console.log(`err: ${JSON.stringify(err)}`);
      return res.status(500).json(err.message);
    }
  });
  // </routeGetProfile>

  // <routeGetProfile>
  app.get('/get-bearer-token', async (req, res) => {

    console.log("/get-bearer-token");

    let profile;
    let accessToken;
    let bearerToken;

    try {

      bearerToken = req.headers['authorization'];
      if (!bearerToken) return res.status(401).send('No bearer token found');
      console.log(`bearerToken: ${bearerToken}`);

      accessToken = bearerToken.split(' ')[1];
      if (!accessToken) return res.status(401).send('No access token found');
      console.log(`accessToken: ${accessToken}`);

      res.json({"bearerToken": bearerToken});

    } catch (err) {
      console.log(`err: ${JSON.stringify(err)}`);
      return res.status(500).json(JSON.stringify(err));
    } finally {
      return res.status(200).json(profile);
    }
  });
  // </routeGetProfile>

  // <routeGetProfile>
  // This API calls the downstream app service, 
  // passing the user's access token as the Authorization header
  // bearer token. This API receives the Microsoft Graph's User Profile
  // as a JSON object.
  app.get('/get-profile-access-token', async (req, res) => {

    let profile;
    let accessToken;

    try {
      // should have `x-ms-token-aad-access-token`
      // insert from App Service if
      // MS AD identity provider is configured
      accessToken = req.headers['x-ms-token-aad-access-token'];
      if (!accessToken) return res.status(401).send('No access token found');
      console.log(`accessToken: ${accessToken}`);

      profile = await getUsersProfile(accessToken);
      console.log(`profile: ${JSON.stringify(profile)}`);
      res.json(profile);
    } catch (err) {
      console.log(`err: ${JSON.stringify(err)}`);
      return res.status(500).json(err.message);
    }
  });
  // </routeGetProfile>

  // <routeGetProfile>
  app.get('/get-profile-bearer-token', async (req, res) => {

    console.log("/get-profile-bearer-token");

    let profile;
    let accessToken;
    let bearerToken;

    try {

      bearerToken = req.headers['Authorization'] || req.headers['authorization'];
      if (!bearerToken) return res.status(401).send('No bearer token found');
      console.log(`bearerToken: ${bearerToken}`);

      accessToken = bearerToken.split(' ')[1];
      if (!accessToken) return res.status(401).send('No access token found');
      console.log(`accessToken: ${accessToken}`);

      profile = await getUsersProfile(accessToken);
      console.log(`profile: ${JSON.stringify(profile)}`);
      res.json(profile);

    } catch (err) {
      console.log(`err: ${JSON.stringify(err)}`);
      return res.status(500).json(err.message);
    }
  });



  app.get('/get-remote-profile-client-app', async (req, res) => {

    console.log("/get-remote-profile-client-app");

    let profile;
    let accessToken;
    let remoteUrl = req.query["remoteUrl"];

    try {

      accessToken = req.headers['x-ms-token-aad-access-token'];
      if (!accessToken) return res.status(401).send('No access token found');
      console.log(`accessToken: ${accessToken}`);

      const response = await fetch(remoteUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      if (response.status >= 400) {
        console.log(`response.status: ${response.status}`);
        throw new Error("Bad response from server");
      }
      profile = await response.json();
      res.json(profile);

    } catch (err) {
      console.log(`err: ${JSON.stringify(err)}`);
      return res.status(500).json(err.message);
    }
  });
  app.get('/get-remote-profile-server-app', async (req, res) => {

    console.log("/get-profile-bearer-token");

    let profile;
    let accessToken;
    let bearerToken;

    try {

      bearerToken = req.headers['Authorization'] || req.headers['authorization'];
      if (!bearerToken) return res.status(401).send('No bearer token found');
      console.log(`bearerToken: ${bearerToken}`);

      accessToken = bearerToken.split(' ')[1];
      if (!accessToken) return res.status(401).send('No access token found');
      console.log(`accessToken: ${accessToken}`);

      profile = await getUsersProfile(accessToken);
      console.log(`profile: ${JSON.stringify(profile)}`);
      res.json(profile);

    } catch (err) {
      console.log(`err: ${JSON.stringify(err)}`);
      return res.status(500).json(err.message);
    }
  });

  // </routeGetProfile>

  // instead of 404 - just return home page
  app.get('*', (req, res) => {
    res.redirect('/');
  });

  return app;
};
