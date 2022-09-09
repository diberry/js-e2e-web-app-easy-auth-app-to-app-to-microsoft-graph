file="random.log"
random=$(cat "$file") 

# Client returns usable access token
authSettings=$(az webapp auth show -g $resourcegroupname -n <client-app-name>)
authSettings=$(echo "$authSettings" | jq '.properties' | jq '.identityProviders.azureActiveDirectory.login += {"loginParameters":["scope=openid offline_access api://<api-app-identity-provider-client-id>/user_impersonation"]}')
az webapp auth set --resource-group myAuthResourceGroup --name <client-app-name> --body "$authSettings"
