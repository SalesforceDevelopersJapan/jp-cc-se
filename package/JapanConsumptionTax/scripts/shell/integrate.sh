#!/bin/sh

set -e
set -v
set -x

while getopts "u:s:a:" opts; do
  case ${opts} in
    u ) orgUsername=$OPTARG
      ;;
    s ) storeId=$OPTARG
      ;;
    a ) apexName=$OPTARG
      ;;
     \? ) echo "Usage: cmd -u orgUsername -s storeId -a apexName"
  esac
done

if [ -z ${orgUsername+x} ] || [ -z ${storeId+x} ] || [ -z ${apexName+x} ]; then
    echo "Usage: ./integrate.sh -u orgUsername -s storeId -a apexName"
    exit 1
fi


user="-u ${orgUsername}"
store="${storeId}"
taxApexClassName="${apexName}"
developerName="COMPUTE_TAXES"
serviceProviderType="Tax"


# Creating RegisteredExternalService
apexClassId=$(sfdx force:data:soql:query $user -q "SELECT Id FROM ApexClass WHERE Name='$taxApexClassName' LIMIT 1" -r csv |tail -n +2)
sfdx force:data:record:create $user -s RegisteredExternalService -v "DeveloperName='$developerName' ExternalServiceProviderId='$apexClassId' ExternalServiceProviderType='$serviceProviderType' MasterLabel='$developerName'"

# Creating StoreIntegratedService
registeredExternalServiceId=$(sfdx force:data:soql:query $user -q "SELECT Id FROM RegisteredExternalService WHERE ExternalServiceProviderId='${apexClassId}' LIMIT 1" -r csv | tail -n +2)
sfdx force:data:record:create $user -s StoreIntegratedService -v "Integration='$registeredExternalServiceId' StoreId='$store' ServiceProviderType='$serviceProviderType'"

