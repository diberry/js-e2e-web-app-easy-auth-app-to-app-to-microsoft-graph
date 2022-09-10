file="random.log"
random=$(cat "$file") 

# Active Directory client id for API app
apiappclientid=

# Rehydrate variables
resourcegroupname=$random-myAuthResourceGroup
appplanname=$random-plan
clientappname=$random-client-a
apiappname=$random-api-b

firstParam="scope=openid offline_access api://$apiappclientid/user_impersonation"
echo $firstParam

paramArrayObj=$( jq --null-input \
        --arg p1 "$firstParam" \
        '{"loginParameters": [$p1]}' )
echo paramArrayObj= $paramArrayObj

authSettings=$(az webapp auth show -g $resourcegroupname -n $clientappname)
authSettings=$(echo "$authSettings" | jq '.properties' | jq --argjson p "$paramArrayObj" '.identityProviders.azureActiveDirectory.login += $p')
echo $authSettings
#az webapp auth set --resource-group $resourcegroupname --name $clientappname --body "$authSettings"

# Client returns usable access token
authSettings=$(az webapp auth show -g $resourcegroupname -n $clientappname)
authSettings=$(echo "$authSettings" | jq '.properties' | jq '.identityProviders.azureActiveDirectory.login += {"loginParameters":["scope=openid offline_access api://$apiappclientid/user_impersonation"]}')
az webapp auth set --resource-group $resourcegroupname --name $clientappname --body "$authSettings"

# API returns usable access token
authSettings=$(az webapp auth show -g $resourcegroupname -n $apiappname)
authSettings=$(echo "$authSettings" | jq '.properties' | jq '.identityProviders.azureActiveDirectory.login += {"loginParameters":["scope=openid offline_access profile"]}')
az webapp auth set --resource-group $resourcegroupname --name $apiappname --body "$authSettings"