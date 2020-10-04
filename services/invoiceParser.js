const mongoose = require('mongoose');
const Invoice = mongoose.model('invoices');

class invoiceParser {
    constructor(email, file, data) {
        this.email = email;
        this.file = file;
        this.data = data.trim();
        this.payload = {uploadedBy : email, uploadTimestamp : Date.now(), fileSize : file.size, processingStatus : "in-progress"};
    }

    /**
    * try to parse the invoice data and create an invoice entry in the invoices schema
    * @return {number} the assigned invoice id
    *
    */
    parse() {
      //begin to parse the invoice before invoice header
      var invoiceIndex = this.data.indexOf("Invoice");
      var receiptIndex = this.data.indexOf("Invoice Receipt");
      var vendorData = this.data.substring(invoiceIndex, receiptIndex);

      this.generateInvoiceDate(vendorData);
      this.generateVendorName(vendorData);

      //begin to parse the invoice after invoice header
      if(receiptIndex !== -1){
         this.data = this.data.substring(receiptIndex);
      }

      if(this.data.indexOf("Tax") !== -1){
         var taxIndex = this.data.indexOf("Tax");
      }else{
         var taxIndex = this.data.indexOf("GST");
      }

      if(taxIndex !== -1){
        this.generateTaxAmount(taxIndex);
      }

      var str = "Total Due";
      var dueIndex = this.data.indexOf(str);
      if(dueIndex !== -1){
          this.generateTotalDue(dueIndex);
          this.generateCurrency(this.data.indexOf(str) +str.length);
      }

      this.generateProcessingStatus();

      //create invoice data model
      const invoice = new Invoice(this.payload);
      invoice.save();

      return invoice._id;
    }

    /**
    * try to parse the invoice date and build the corresponding payload property
    * @params {String} the vendorData
    *
    */
    generateInvoiceDate(vendorData){
      var date = "";
      var month = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November','December'];
      for (let i=0;i<month.length;i++) {
          if (vendorData.indexOf(month[i]) !== -1) {
             date += month[i];
             var index = vendorData.indexOf(month[i]) + month[i].length;

             while(!vendorData.substring(index, index+4).match(/(19|20)\d{2}$/)){
                date += vendorData.charAt(index++);
             }

             date += vendorData.substring(index, index+4);
             this.payload.invoiceDate = date;
             index += 4;
             break;
          }
      }
    }

    /**
    * try to parse the invoice vendor name and build the corresponding payload property
    * @params {String} the vendorData
    *
    */
    generateVendorName(vendorData){
      var array = vendorData.split(/\r?\n/);
      var filtered = array.filter(function (elem) {
          return elem != "";
      });
      var vendor = filtered[2];
      this.payload.vendorName = vendor;
    }

    /**
    * try to parse the invoice tax amount and build the corresponding payload property
    * @params {String} the index
    *
    */
    generateTaxAmount(index){
      var index = this.data.substring(index).indexOf("%");
      var dotIndex = index + this.data.substring(index).indexOf(".");
      var tax =  "."+ this.data.substring(dotIndex+1, dotIndex+3);
      dotIndex--;
      while(dotIndex >= 0){
         let char = this.data.charAt(dotIndex);
         if(char.match("[0-9]")){
           tax = char + tax;
           dotIndex--;
         }else{
           break;
         }
      }
      this.payload.taxAmount = tax.trim();
    }

    /**
    * try to parse the invoice total due and build the corresponding payload property
    * @params {String} the index
    *
    */
    generateTotalDue(index){
      var totalDue = "";
      var dotIndex =this.data.substring(0, index).lastIndexOf(".");
      totalDue = "."+ this.data.substring(dotIndex+1, dotIndex+3);
      dotIndex--;
      while(dotIndex >= 0){
         let char = this.data.charAt(dotIndex);
         if(char.match("[0-9]")){
           totalDue = char+ totalDue;
           dotIndex--;
         }else{
           break;
         }
      }
      this.payload.totalDue = totalDue.trim();
    }

    /**
    * try to parse the invoice currency and build the corresponding payload property
    * @params {String} the index
    *
    */
    generateCurrency(index){
      var currency = "";
      while(index < this.data.length){
          if(this.data.charAt(index).match("[A-Z]")){
             currency += this.data.substring(index, index+3);
             break;
          }
          index++;
      }
      this.payload.currency = currency;
    }

    /**
    * try to update processingStatus and build the corresponding payload property
    *
    */
    generateProcessingStatus(){
      if(this.payload.totalDue == '0.00'){
         this.payload.processingStatus = "complete";
      }
    }
}

module.exports = {invoiceParser : invoiceParser};
