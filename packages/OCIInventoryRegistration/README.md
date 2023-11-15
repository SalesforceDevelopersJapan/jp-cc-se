# Sample OCI inventory registration component
This component is used to edit inventory info in Salesforce platform.

You can see list of locations. 
![](images/list.png)

You can edit inventory info.
![](images/edit.png)

You can see future inventory info.
![](images/futures.png)

## Add this component to page
You can add this component named "OCI Inventory Registration Component" to any page and you can also use custom label named "{!$Label.OCI_INV_REG_InventoryRegistration}".

![](images/setting.png)


## Sample Data
```
sfdx force:apex:execute -f ./scripts/apex/data.apex -u {username or alias}
```

