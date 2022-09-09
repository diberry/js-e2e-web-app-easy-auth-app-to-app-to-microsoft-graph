file="random.log"
random=$(cat "$file") 

# Active Directory client id for API app
apiappclientid=

# Rehydrate variables
resourcegroupname=$random-myAuthResourceGroup
appplanname=$random-plan
clientappname=$random-client-a
apiappname=$random-api-b

# Client returns usable access token
authSettings=$(az webapp auth show -g $resourcegroupname -n $clientappname)
authSettings=$(echo "$authSettings" | jq '.properties' | jq '.identityProviders.azureActiveDirectory.login += {"loginParameters":["scope=openid offline_access api://$apiappclientid/user_impersonation"]}')
az webapp auth set --resource-group $resourcegroupname --name $clientappname --body "$authSettings"

# API returns usable access token
authSettings=$(az webapp auth show -g $resourcegroupname -n $apiappname)
authSettings=$(echo "$authSettings" | jq '.properties' | jq '.identityProviders.azureActiveDirectory.login += {"loginParameters":["scope=openid offline_access profile"]}')
az webapp auth set --resource-group $resourcegroupname --name $clientappname --body "$authSettings"