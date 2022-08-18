// general dependencies

// <getDependencies>
// Express.js app server
import express from 'express';

// <getGraph>
// Microsoft Graph dependencies
import graph from '@microsoft/microsoft-graph-client';
import 'isomorphic-fetch';
import { getGraphToken } from './get-graph-accesstoken';

// Use access token to get user's profile from Graph
async function getUsersProfile(accessToken) {
  try {
    const graphClient = await getGraphToken(accessToken);

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
      return res.status(500).json(err.message);
    }
  });

  app.get('/get-profile', async (req, res) => {

    console.log("/get-profile");

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
      return res.status(229).send(JSON.stringify(err));
    }
  });

  // </routeGetProfile>

  // instead of 404 - just return home page
  app.get('*', (req, res) => {
    res.redirect('/');
  });

  return app;
};
