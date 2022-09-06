# Client AAD app -> API server AAD app -> Microsoft Graph

This sample uses 2 Azure App Service apps to demonstrate:
* A Client (A) App Service secured with Active Directory (AD app 1) authentication provider (Easy auth) which authenticates user
    * Get an access token from the injected HTTP header by easy auth. 
    * When the user requests their profile from the API server, the client app passes the user's access token as the bearer token in the request.
* A API (B) App Service also secured with Active Directory (AD app 2) authentication provider (Easy auth) which requests API requests if they aren't valid for the API app. 
  * The API service 
      * Exchanges the bearer token for a token that can call Microsoft Graph
      
          ```
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
          ```
      
      * Requests the user's profile
      
          ```
          const profile = await graphClient
          .api('/me')
          .get();
          ```
