file="random.log"
random=$(cat "$file") 

# Zip client - zip is available in Azure cloud shell
cd a-client-app-with-user-access-token && zip -r a-client.zip .
az webapp deploy --resource-group $resourcegroupname --name $clientappname --src-path a-client.zip
cd ..

# Zip API - zip is available in Azure cloud shell
cd b-api-app-with-user-bearer-token && zip -r b-api.zip .
az webapp deploy --resource-group $resourcegroupname --name $apiappname --src-path b-api.zip
cd ..