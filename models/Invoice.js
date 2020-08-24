const mongoose = require('mongoose');
const { Schema } = mongoose;

const invoiceSchema = new Schema({
  uploadedBy : {type : String, required : true},
  uploadTimestamp : {type : Date, required : true},
  fileSize : {type : String, required : true},
  vendorName : {type : String},
  invoiceDate : {type : String},
  totalDue : {type : mongoose.Types.Decimal128},
  currency : {type : String},
  taxAmount : {type : mongoose.Types.Decimal128},
  processingStatus : {type : String}
});

mongoose.model('invoices', invoiceSchema);
