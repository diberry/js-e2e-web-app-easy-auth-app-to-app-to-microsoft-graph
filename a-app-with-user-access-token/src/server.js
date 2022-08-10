// general dependencies

// <getDependencies>
// Express.js app server
import express from 'express';

// decode jwt token
import jwt_decode from 'jwt-decode';

export const create = async () => {
  const app = express();

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


      <h5>Client (1st web app)</h5>
      <p><a href="/access-token">Access token from x-ms-token-aad-access-token</a></p>
      <p><a href="/.auth/logout">Log out</a></p>

      <h5>Server (2nd web app)</h5>
      <p><a href="/get-profile">Get remote profile - you must add `remoteUrl` param to querystring</a></p>
      <hr>
      <h5>Additional resources</h5>
      <p><a href="https://developer.microsoft.com/en-us/graph/graph-explorer">Explore with the Microsoft Graph interactive explorer</a></p>
      <p><a href="https://jwt.ms/">Decode access token with JWT.ms</a></p>
      </body>
    </html>
    `);
  });
  // </routeHome>

  // <routeInjectedToken>
  app.get('/access-token', async (req, res) => {

    const accessToken = req.headers['x-ms-token-aad-access-token'];
    if (!accessToken) return res.send('No access token found');

    const decoded = JSON.stringify(jwt_decode(accessToken));

    const curlCommandHello = `curl https://YOUR-RESOURCE-NAME.azurewebsites.net/hello -H "Accept: application/json" -H "Authorization: Bearer ${accessToken}"`;
    const curlCommandMe = `curl https://YOUR-RESOURCE-NAME.azurewebsites.net/me -H "Accept: application/json" -H "Authorization: Bearer ${accessToken}"`;
    return res.send(`${accessToken}<br><br>${decoded}<br><br>${curlCommandHello}<br><br>${curlCommandMe}`);
  });
  // </routeInjectedToken>

  app.get('/get-profile', async (req, res) => {

    let profile;
    let accessToken;
    let remoteUrl = req.query["remoteUrl"];

    try {

      accessToken = req.headers['x-ms-token-aad-access-token'];
      if (!accessToken) return res.status(401).send('No access token found');
      console.log(`accessToken: ${accessToken}`);

      // b-app URL with route is required
      if (!remoteUrl) return res.status(401).send('No query string param `remoteUrl` found');

      const response = await fetch(remoteUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      if (response.status >= 400) {
        console.log(`response.status: ${response.status}`);
        res.send(`Error: ${response.status}, ${response.statusText}`);
      } else {
      profile = await response.json();
      res.json(profile);
      }

    } catch (err) {
      console.log(`err: ${JSON.stringify(err)}`);
      return res.status(500).json(err.message);
    }
  });

  // instead of 404 - just return home page
  app.get('*', (req, res) => {
    res.redirect('/');
  });

  return app;
};
