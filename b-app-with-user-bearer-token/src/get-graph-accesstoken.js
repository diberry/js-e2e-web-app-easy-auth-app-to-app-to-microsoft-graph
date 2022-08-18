
// What is the import? 
import * as MSAL from '@azure/msal-node';

async function exchangeBackendTokenForGraphToken(backEndAccessToken){

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
      authority: process.env.WEBSITE_AUTH_OPENID_ISSUER
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
    authority: "https://graph.microsoft.com/.default",
    // this scope must already exist on the API app registration and visible in resources.azure.com app auth config
    scopes: ["user.read"]
  }

  const { accessToken } = await clientCredentialAuthority.acquireTokenOnBehalfOf(oboRequest);
  console.log(`graphAccessToken: ${accessToken}`);
  return accessToken;
}

module.exports = {
    getGraphToken: exchangeBackendTokenForGraphToken
};