random=$RANDOM
user=deployuser-$random
password=Abcd$random!
echo user: $user 
echo password: $password

resourcegroupname=$random-myAuthResourceGroup
appplanname=$random-plan
clientappname=$random-client-a
apiappname=$random-api-b

# Create deployment user
az webapp deployment user set --user-name $user --password $password

# Create Azure resources
az group create --name $resourcegroupname --location "West Europe"
az appservice plan create --name $appplanname --resource-group $resourcegroupname --sku FREE --is-linux
az webapp create --resource-group $resourcegroupname --plan $appplanname --name $clientappname --runtime "node|14-lts" --deployment-local-git --query deploymentLocalGitUrl
az webapp create --resource-group $resourcegroupname --plan $appplanname --name $apiappname --runtime "node|14-lts" --deployment-local-git --query deploymentLocalGitUrl

# Configure apps
az webapp config appsettings set --name $clientappname --resource-group $resourcegroupname --settings SCM_DO_BUILD_DURING_DEPLOYMENT=true
az webapp config appsettings set --name $apiappname --resource-group $resourcegroupname --settings SCM_DO_BUILD_DURING_DEPLOYMENT=true
az webapp config appsettings set --name API_B_URL --resource-group $resourcegroupname --settings http://$apiappname.azurewebsites.net/get-profile
az webapp cors add --name $apiappname --resource-group $resourcegroupname --allowed-origins 'https://$clientappname.azurewebsites.net'

# Zip client - zip is available in Azure cloud shell
cd a-client-app-with-user-access-token && zip -r a-client.zip .
az webapp deploy --resource-group $resourcegroupname --name $clientappname --src-path a-client.zip
cd ..

# Zip API - zip is available in Azure cloud shell
cd b-api-app-with-user-bearer-token && zip -r b-api.zip .
az webapp deploy --resource-group $resourcegroupname --name $apiappname --src-path b-api.zip
cd ..

# Client returns usable access token
authSettings=$(az webapp auth show -g $resourcegroupname -n <client-app-name>)
authSettings=$(echo "$authSettings" | jq '.properties' | jq '.identityProviders.azureActiveDirectory.login += {"loginParameters":["scope=openid offline_access api://<api-app-identity-provider-client-id>/user_impersonation"]}')
az webapp auth set --resource-group myAuthResourceGroup --name <client-app-name> --body "$authSettings"
