// general dependencies

// <getDependencies>
// Express.js app server
import express from 'express';
import "isomorphic-fetch";

// decode jwt token
import jwt_decode from 'jwt-decode';
class HTTPResponseError extends Error {
  constructor(response, ...args) {
    super(`HTTP Error Response: ${response.status} ${response.statusText}`, ...args);
    this.response = response;
  }
}
export const create = async () => {
  const app = express();

  const homePathContent = `
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


    <h5>Client (1st web app)</h5>
    <p><a href="/access-token">Access token from x-ms-token-aad-access-token</a></p>
    <p><a href="/.auth/logout">Log out</a></p>

    <h5>Server (2nd web app)</h5>
    <p><a href="/get-profile">Get remote profile</a></p>
    <hr>
    <h5>Additional resources</h5>
    <p><a href="https://developer.microsoft.com/en-us/graph/graph-explorer">Explore with the Microsoft Graph interactive explorer</a></p>
    <p><a href="https://jwt.ms/">Decode access token with JWT.ms</a></p>
    <hr>
    <p>${JSON.stringify(process.env, null, 4)}</p>
    </body>
  </html>
  `;

  // <routeHome>
  // Display form and table
  app.get('/', async (req, res) => {
    return res.send(homePathContent);
  });
  // </routeHome>

  // <routeInjectedToken>
  app.get('/access-token', async (req, res) => {

    const accessToken = req.headers['x-ms-token-aad-access-token'];
    if (!accessToken) return res.send('No access token found');

    const decoded = JSON.stringify(jwt_decode(accessToken));

    return res.send(`${accessToken}<br><br>${decoded}<br><br>${JSON.stringify(process.env)}`);
  });
  // </routeInjectedToken>

  app.get('/get-profile', async (req, res) => {

    let profile;
    let accessToken;
    let remoteUrl = req.query["remoteUrl"] || process.env.REMOTE_GRAPH_URL;

    try {

      console.log(`remoteUrl: ${remoteUrl}`);

      accessToken = req.headers['x-ms-token-aad-access-token'];
      if (!accessToken) return res.status(400).send('No access token found');
      console.log(`accessToken: ${accessToken}`);

      // b-app URL with route is required
      if (!remoteUrl) return res.status(400).send('No remoteUrl found');

      const response = await fetch(remoteUrl, {
        cache: "no-store",
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      if (response.ok) {
        // response.status >= 200 && response.status < 300
        return res.send(`Server success ${JSON.stringify(await response.json())}`);
      } else {
        throw new HTTPResponseError(response);
      }
    } catch (error) {
      console.error(error);

      const errorBody = await error.response.text();
      console.error(`Error body: ${errorBody}`);
      return res.send(`Error: ${errorBody}`);
    }
  });

  // instead of 404 - just return home page
  app.get('*', (req, res) => {
    res.redirect('/');
  });

  return app;
};
