#!/bin/sh

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
    echo "Usage: ./default_taxrate.sh -u orgUsername"
    exit 1
fi

user="-o ${orgUsername}"

# Default Tax Rate
sfdx data:record:create $user -s GeoCountry -v "IsoCode='JP'"
geoCountryId=$(sfdx force:data:soql:query $user -q "SELECT Id FROM GeoCountry WHERE IsoCode='JP' LIMIT 1" --json | jq '.result.records[0].Id')
sfdx data:record:create $user -s TaxRate -v "TaxCode='defalt_tax' Rate=10 Priority=0 GeoCountryId=$geoCountryId"
