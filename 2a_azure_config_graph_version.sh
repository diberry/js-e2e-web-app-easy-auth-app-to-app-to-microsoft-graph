api_b_client_id=

id=$(az ad app show --id $api_b_client_id --query id --output tsv)
az rest --method PATCH --url https://graph.microsoft.com/v1.0/applications/$id --body "{'api':{'requestedAccessTokenVersion':2}}" 
