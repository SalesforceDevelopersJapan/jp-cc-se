#!/bin/sh

set -e
set -v
set -x

if !(type "jq" > /dev/null 2>&1); then
    echo "You need get jq!"
    exit 1
fi

while getopts "u:a:n:" opts; do
  case ${opts} in
    u ) orgUsername=$OPTARG
      ;;
    a ) apexClass=$OPTARG
      ;;
     \? ) echo "Usage: cmd -u orgUsername -a apexClass"
  esac
done

if [ -z ${orgUsername+x} ] || [ -z ${apexClass+x} ] ; then
    echo "Usage: ./tax.sh -u orgUsername -a apexClass"
    exit 1
fi


user="-o ${orgUsername}"

# Default Tax Rate
sfdx data:record:create $user -s GeoCountry -v "IsoCode='JP'"
geoCountryId=$(sfdx force:data:soql:query $user -q "SELECT Id FROM GeoCountry WHERE IsoCode='JP' LIMIT 1" --json | jq '.result.records[0].Id')
sfdx data:record:create $user -s TaxRate -v "TaxCode='defalt_tax' Rate=10 Priority=0 GeoCountryId=$geoCountryId"

# Creating Japan Tax Service
apexClassId=$(sfdx force:data:soql:query $user -q "SELECT Id FROM ApexClass WHERE Name='$apexClass' LIMIT 1" --json | jq '.result.records[0].Id')
sfdx data:record:create $user -s RegisteredExternalService -v "DeveloperName='Japan_Tax_Service' ExternalServiceProviderId=$apexClassId MasterLabel='Japan Tax Service' ExternalServiceProviderType='Tax'"





