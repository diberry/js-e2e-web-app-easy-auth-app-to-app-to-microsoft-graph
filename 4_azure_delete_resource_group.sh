file="random.log"
random=$(cat "$file") 
resourcegroupname=$random-myAuthResourceGroup

az group delete --name $resourcegroupname