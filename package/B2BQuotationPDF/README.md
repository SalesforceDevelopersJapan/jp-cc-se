1. Grant permissions to the APEX class (do this only once):

    1. Login to the org, e.g., `sfdx force:org:open -u <org username>`.
    1. Go to Setup -> Custom Code -> APEX Classes.
    1. On the `QuotationPDFController` class, click "Security".
    1. Assign the buyer user profile(s) or other user profiles that will use your components.
    1. Click Save.




Visualforce Pages
`QuotationPDF`