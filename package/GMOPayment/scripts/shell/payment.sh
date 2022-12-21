#!/bin/sh
# This code following https://git.soma.salesforce.com/communities/sfdx-stripe/blob/master/install_in_1cb2c.sh

set -e
set -v
set -x

while getopts "u:a:n:" opts; do
  case ${opts} in
    u ) orgUsername=$OPTARG
      ;;
    a ) adapterName=$OPTARG
      ;;
    n ) namedCredential=$OPTARG
      ;;
     \? ) echo "Usage: cmd -u orgUsername -a adapterName -n namedCredential"
  esac
done

if [ -z ${orgUsername+x} ] || [ -z ${adapterName+x} ] || [ -z ${namedCredential+x} ]; then
    echo "Usage: ./payment.sh -u orgUsername -a adapterName -n namedCredential"
    exit 1
fi


user="-u ${orgUsername}"
gateway="${adapterName}"
namedCredentialMasterLabel="${namedCredential}"
paymentGatewayAdapterName="${gateway}"
paymentGatewayProviderName="${gateway}_Gateway_Provider"
paymentGatewayName="${gateway}_Gateway"


###
### set the store to use the Payment Gateway in this project
###

# Creating Payment Gateway Provider
apexClassId=$(sfdx force:data:soql:query $user -q "SELECT Id FROM ApexClass WHERE Name='$paymentGatewayAdapterName' LIMIT 1" -r csv |tail -n +2)
sfdx force:data:record:create $user -s PaymentGatewayProvider -v "DeveloperName='$paymentGatewayProviderName' ApexAdapterId='$apexClassId' MasterLabel='$paymentGatewayProviderName' IdempotencySupported=Yes Comments=Comments"

# Creating Payment Gateway
paymentGatewayProviderId=$(sfdx force:data:soql:query $user -q "SELECT Id FROM PaymentGatewayProvider WHERE DeveloperName='$paymentGatewayProviderName' LIMIT 1" -r csv | tail -n +2)
namedCredentialId=$(sfdx force:data:soql:query $user -q "SELECT Id FROM NamedCredential WHERE MasterLabel='$namedCredentialMasterLabel' LIMIT 1" -r csv | tail -n +2)
sfdx force:data:record:create $user -s PaymentGateway -v "MerchantCredentialId='$namedCredentialId' PaymentGatewayName='$paymentGatewayName' PaymentGatewayProviderId='$paymentGatewayProviderId' Status=Active"

