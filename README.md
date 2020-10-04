# Invoice-Data-Extraction

## Target: Extract the data from uploaded invoice files and identify key pieces of information within those
documents.

### implement a service that does the following:

* Exposes an HTTP endpoint, `/upload`
  * e.g. `curl -F 'file=@"invoices/Invoice1.pdf"' -F
    'email=user@domain.com' localhost:3000/upload`
  * Accepts a .pdf document and a user email in the body of the request
  * Attempts to extract the following data from the document
    * *Vendor* (e.g. Starbucks, Home Depot, McDonalds)
    * *Invoice Date*
    * *Total Due* (a positive or negative value with at most 2 decimal
      places)
    * *Currency* (a three character currency code; e.g. CAD, GBP)
    * *Tax* (a positive or negative value with at most 2 decimal places)
  * Responds with a JSON payload containing an assigned document id:
  ```javascript
  {
    id: <someUniqueId>
  }
  ```
* Exposes an HTTP endpoint, `/document/:id`
  * `curl -XGET http://localhost:3000/document/:id`
  * Respond with the following payload:
  ```javascript
  {
    uploadedBy : '<userEmailAddress>',
    uploadTimestamp : '<timestamp>',
    filesize: '<filesize>',
    vendorName: '<vendorName>',
    invoiceDate: '<invoiceDate>',
    totalDue: '<totalDue>',
    currency: '<currency>',
    taxAmount: '<taxAmount>',
    processingStatus: '<status>',
  }
  ```
