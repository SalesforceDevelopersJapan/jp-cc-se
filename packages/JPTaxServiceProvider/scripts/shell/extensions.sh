#!/bin/bash
# This code following https://git.soma.salesforce.com/communities/sfdx-stripe/blob/master/install_in_1cb2c.sh

set -e
set -v
set -x

if !(type "jq" > /dev/null 2>&1); then
  echo "You need get jq!"
  exit 1
fi

while getopts "u:" opts; do
  case ${opts} in
  u)
    orgUsername=$OPTARG
    ;;
  \?) echo "Usage: cmd -u orgUsername" ;;
  esac
done

if [ -z ${orgUsername+x} ]; then
  echo "Usage: ./extensions.sh -u orgUsername"
  exit 1
fi

user="-o ${orgUsername}"

createExtension() {
  apexClassName=$1
  extensionPoint=$2
  name=$3
  apexClassId=$(sfdx force:data:soql:query $user -q "SELECT Id FROM ApexClass WHERE Name='$apexClassName' LIMIT 1" --json | jq '.result.records[0].Id')
  sfdx data:record:create $user -s RegisteredExternalService -v "DeveloperName='$name' ExtensionPointName='$extensionPoint' ExternalServiceProviderId=$apexClassId ExternalServiceProviderType='Extension' MasterLabel='$name'"
}

createExtension "JapanTaxCalculationServiceDE" "Commerce_Domain_Tax_CartCalculator" "Japan_Tax_Service_DE"

