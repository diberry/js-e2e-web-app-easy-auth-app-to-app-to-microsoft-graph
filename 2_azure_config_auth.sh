# This script adds the loginParameters property to the App Services.
# This additions can be made with the Azure CLI below or with the
# Azure resources explorer, https://resources.azure.com at URL like:
# http://resources.azure.com/subscriptions/YOUR-SUBSCRIPTION/resourcesGroups/YOUR-RESOURCE-GROUP/providers/Microsoft.Web/sites/YOUR-APP-SERVICE-NAME/config/authsettingsV2/list
# 
# Client (a) 
# loginParameters:
# [
#   "scope=openid offline_access api://API-B-ACTIVE-DIRECTORY-CLIENT-ID/user_impersonation",
#   "response_type=code id_token",
#   "prompt=consent"
# ]
#
# API (b)
# loginParameters:
# [
#   "response_type=code id_token",
#   "scope=openid offline profile"
# ]


file="random.log"
random=$(cat "$file") 
echo $random

# Active Directory client id for API app
apiappclientid=def2178d-8540-46c5-a165-9709ac8fbbe0
echo $apiappclientid

# Rehydrate variables
resourcegroupname=$random-myAuthResourceGroup
appplanname=$random-plan
clientappname=$random-client-a
apiappname=$random-api-b

# Client returns usable access token

firstParam="scope=openid offline_access api://$apiappclientid/user_impersonation"
secondParam="response_type=code id_token"
thirdParam="prompt=consent"

paramArrayObj=$( jq --null-input \
        --arg p1 "$firstParam" \
        --arg p2 "$secondParam" \
        --arg p3 "$thirdParam" \
        '{"loginParameters": [$p1, $p2, $p3]}' )
echo paramArrayObj= $paramArrayObj

authSettings=$(az webapp auth show -g $resourcegroupname -n $clientappname)
authSettings=$(echo "$authSettings" | jq '.properties' | jq --argjson p "$paramArrayObj" '.identityProviders.azureActiveDirectory.login += $p')
az webapp auth set --resource-group $resourcegroupname --name $clientappname --body "$authSettings"

# API returns usable access token - including Graph profile

apiFirstParam="response_type=code id_token"
apiSecondParam="scope=openid offline profile"

apiParamArrayObj=$( jq --null-input \
    --arg apiP1 "$apiFirstParam" \
    --arg apiP2 "$apiSecondParam" \
    '{"loginParameters": [$apiP1, $apiP2]}')
echo apiParamArrayObj= $apiParamArrayObj

apiAuthSettings=$(az webapp auth show -g $resourcegroupname -n $apiappname)
apiAuthSettings=$(echo "$apiAuthSettings" | jq '.properties' | jq --argjson v "$apiParamArrayObj" '.identityProviders.azureActiveDirectory.login += $v')
az webapp auth set --resource-group $resourcegroupname --name $apiappname --body "$apiAuthSettings"