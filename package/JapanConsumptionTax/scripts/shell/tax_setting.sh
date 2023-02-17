#!/bin/sh

set -e
set -v
set -x

while getopts "u:" opts; do
  case ${opts} in
    u ) orgUsername=$OPTARG
      ;;
     \? ) echo "Usage: cmd -u orgUsername"
  esac
done

if [ -z ${orgUsername+x} ]; then
    echo "Usage: ./tax_setting.sh -u orgUsername"
    exit 1
fi


user="-u ${orgUsername}"
geoCountryId=$(sfdx force:data:record:create $user -s GeoCountry -v "IsoCode='JP'" --json | jq .result.id)


makeTaxSetting(){
  taxRate=$1
  taxCode="${taxRate}PercentTax"
  policyName="${taxRate}PercentPolicy"
  treatmentName="${taxRate}PercentTreatment"
  sfdx force:data:record:create $user -s TaxRate -v "TaxCode=$taxCode Rate=$taxRate GeoCountryId=$geoCountryId"
  treatmentId=$(sfdx force:data:record:create $user -s TaxTreatment -v "Name=$treatmentName Status='Draft' TaxCode=$taxCode" --json | jq .result.id)
  sfdx force:data:record:create $user -s TaxPolicy -v "Name=$policyName Status='Draft' TreatmentSelection='Manual' DefaultTaxTreatmentId=$treatmentId"
}

makeTaxSetting 8
makeTaxSetting 10



