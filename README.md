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

## Clone sample repo

In a web browser, use the [Azure cloud shell](https://shell.azure.com/) with the _bash_ environment to run the following scripts. The resource group and resources are prepended with a random number, which is stored in `random.log`.

1. In the Azure Cloud Shell, clone this repo. 

    ```bash
    git clone https://github.com/Azure-Samples/js-e2e-web-app-easy-auth-app-to-app-to-microsoft-graph && cd js-e2e-web-app-easy-auth-app-to-app-to-microsoft-graph
    ```

### Script - Create Azure resources

1. Run the following script to create the required Azure apps. If you don't have any more free app plans left, you can change the `pricingtier` variable value to `B1` in the **azure_create_resources.sh** script before running it.

    ```bash
    bash 1_azure_create_resources.sh
    ```

### Portal - Create Azure Identity app registrations for each auth
1. Create both the client and API Active Directory apps with the Microsoft identity provider in the Azure portal - refer to documentation. You should have the Active Directory **client ID** for the API app before moving to the next step.
    * API Active Directory app 
        * api permissions are User.Read (or more restrictive would be profile)
        * authorized client applications
            * CLIENT's Active Directory app - you need the AD client ID and the authorized scope `api://API-AD-APP-CLIENT_ID/user_impersonation`.
    * CLIENT Active Directory app
        * api permissions are user-impersonation

### Script - Configure loginParameters

1. Open **azure_config_auth.sh** in the Azure cloud shell and set the value of `apiappclientid` to the API's Active Directory client ID.
1. Configure App Service loginParameters for each app. 

    ```bash
    bash 2_azure_config_auth.sh
    ```

### Script - Apply Graph version 

Not sure if this is still needed?

1. Configure 

    ```bash
    bash 2a_azure_config_graph_version.sh
    ```

### Script - Deploy apps to Azure

1. Execute script which creates zip files and deploy.

    ```bash
    bash 3_azure_deploy_apps.sh
    ```

## Test web app

In a browser, go to client (a) app, login, and select to get the profile. 

## Debugging

If you don't get a profile, both the client and api apps have /debug to see the current environment variables and http header values. 