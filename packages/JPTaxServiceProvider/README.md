# Sample japan tax service provider
This is sample code for [tax calculation service](https://help.salesforce.com/s/articleView?id=sf.comm_set_up_tax.htm&type=5) for Japan consumption tax.

## Prerequirement
- You need to Scan for state and country/territory data from **Data > State and Country/Territory Picklists** in setup screan.
- You need to have sfdx and jq command to run tax.sh script
- You need to set up tax treatment to all products following [this help](https://help.salesforce.com/s/articleView?id=sf.comm_what_is_tax_solution.htm&type=5). But You dont need to set up defaut tax policy in store.

## Setup Instruction
1. Deploy all sources.
1. Run command below.
    ```
    sh scripts/shell/tax.sh -u {your org user} -a JapanTaxCalculationService
    ```
1. Link integration called "Japan Tax Service" following [this help](https://help.salesforce.com/s/articleView?id=sf.comm_set_up_tax.htm&type=5).


## Limitation
- This sample code work only with store having Net tax type.
- Default tax rate is setup with tax.sh and it fetched in Apex class. Please change archtecture as needed.  
