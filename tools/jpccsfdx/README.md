

# jpccsfdx

## About oclif
https://github.com/oclif/oclif

## Prerequirement
- [SFDX command](https://developer.salesforce.com/docs/atlas.en-us.242.0.sfdx_setup.meta/sfdx_setup/sfdx_setup_install_cli.htm)
- [Node.js version 16 or later](https://nodejs.org/en/download/?utm_source=blog)

## Install
```
npm install
```

## Basic Usage
```
## Command List
./bin/dev --help

## Execute
./bin/dev {command}

## Help
./bin/dev {command} --help

## Example
./bin/dev oci:lightning:availability:imports:upload sample/test.csv -o DevHub
```

## OCI Commands
### Common
You can use these commands as tools
#### Convert CSV to/from JSON of availability records
```
./bin/dev oci:common:availability:imports:convert --help
```

### Lightning Platform API
You need sfdx org user to use this commmands. Please check org user name or alias with `sfdx force:org:list`.
#### Retrieve availability records
```
./bin/dev oci:lightning:availability:records --help
```
#### Upload CSV/JSON file to update availability records
```
./bin/dev oci:lightning:availability:imports:upload --help
```

### Commerce API
You can use commands if B2C Commerce is integrated to OCI.  
You need Account Manager client to use this commmands. Please refer to [help](https://documentation.b2c.commercecloud.salesforce.com/DOC3/topic/com.demandware.dochelp/content/b2c_commerce/topics/account_manager/b2c_account_manager_add_api_client_id.html?cp=0_11_17) to create API client.
#### Retrieve availability records
```
./bin/dev oci:commerce:availability:records --help
```
#### Delete availability import
```
./bin/dev oci:commerce:availability:imports:delete --help
``` 
#### Retrieve availability import list
```
./bin/dev oci:commerce:availability:imports:list --help
```
#### Upload CSV/JSON file to update availability records
```
./bin/dev oci:commerce:availability:imports:upload --help
```


## Spec of availability update 
### CSV Headers
```
type,location,onHand,sku,effectiveDate,safetyStockCount,futures.expectedDate,futures.quantity
```
### Type
You can put two following type of record. Then you need to put both `location` and `sku` as a key. 

`BASE` : It you put type `BASE`, `onHand`, `effectiveDate` and `safetyStockCount` is used to update.  
`FUTURE` : It you put type `FUTURE`, `futures.expectedDate` and `futures.quantity` is used to update.  

### Sample CSV for availability
`./sample/csv/oci/mix.csv`  
`./sample/csv/oci/base.csv`  
`./sample/csv/oci/future.csv`  

### Sample JSON for availability
`./sample/json/oci/mix.json`  
`./sample/json/oci/base.json`  
`./sample/json/oci/future.json` 

### Date string format
ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ) or "YYYY-MM-DD" format as UTC (e.g. "1970-01-01").  
Please refer to `dateString` in [help of Date object](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Date/Date#%E5%BC%95%E6%95%B0)

### Only BASE mode
You can put `-b` for only BASE mode which is faster and less memory usage than normal update.  
The mode is suitable for updating only BASE records (FUTURE record is skipped), for instance, updating massive numbers of products at initial implementation. 
This value is available only for CSV upload/convert.

### Note
> **Warning**  
> Because future records is overwritten, you need to keep existing records in CSV file.
