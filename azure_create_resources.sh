# Delete previous random.log
rm random.log

# Create new random.log
random=$RANDOM
echo "$random" > random.log

# Create variables for names
resourcegroupname=$random-myAuthResourceGroup
appplanname=$random-plan
clientappname=$random-client-a
apiappname=$random-api-b

# Print out names
echo resource group name: $resourcegroupname
echo planname:            $appplanname
echo client app name:     $clientappname
echo api app name:        $apiappname

# Create Azure resources
echo "Create resource group"
az group create --name $resourcegroupname --location "West Europe"

echo "Create App plan"
az appservice plan create --name $appplanname --resource-group $resourcegroupname --sku B1 --is-linux

echo "Create client app"
az webapp create --resource-group $resourcegroupname --plan $appplanname --name $clientappname --runtime "node|14-lts" 

echo "Create api app"
az webapp create --resource-group $resourcegroupname --plan $appplanname --name $apiappname --runtime "node|14-lts" 

# Set API CORS
echo "Configure API app for CORS"
clientappurl=https://$clientappname.azurewebsites.net
az webapp cors add --name $apiappname --resource-group $resourcegroupname --allowed-origins $clientappurl

# Configure apps
echo "Configure client app for SCM_DO_BUILD_DURING_DEPLOYMENT"
az webapp config appsettings set --name $clientappname --resource-group $resourcegroupname --settings SCM_DO_BUILD_DURING_DEPLOYMENT=true

echo "Configure api app for SCM_DO_BUILD_DURING_DEPLOYMENT"
az webapp config appsettings set --name $apiappname --resource-group $resourcegroupname --settings SCM_DO_BUILD_DURING_DEPLOYMENT=true

# Set client app setting to request to API app URL
echo "Configure client app for api app's URL"
apiappurl=https://$apiappname.azurewebsites.net/get-profile
az webapp config appsettings set --name $clientappname --resource-group $resourcegroupname --settings API_B_URL=$apiappurl
