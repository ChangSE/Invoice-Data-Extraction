const express = require('express');
const multer  = require('multer');
const mongoose = require('mongoose');
const moment = require("moment");
const pdfUtil = require('pdf-to-text');
const bodyParser = require('body-parser');
const keys = require('./config/keys');
require('./models/Invoice');

mongoose.connect(keys.mongoURI);


const Invoice = mongoose.model('invoices');

const app = express();
const port = 3000;

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'invoices/')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
})

const upload = multer({ storage: storage });

app.use(bodyParser.json());

app.get('/', (req, res) => res.send('Welcome!'));

app.post('/upload',  upload.single('file'), (req, res, next) => {

  // req.file is the uploaded file
  // req.body will hold the text fields, if there were any
  // e.g. req.body.email should have the email address
  var file = req.file;
  var email = req.body != undefined ? req.body.email : undefined;

  if(file == undefined || file.mimetype != "application/pdf"){
     return res.status(400).send('Bad Request Invalid File');
  }

  if(email == undefined || !email){
     return res.status(400).send('Bad Request Invalid Email');
  }


  pdfUtil.pdfToText(file.path, async function(err, data) {
    try{
      if (err) throw(err);

      var payload = {uploadedBy : email, uploadTimestamp : Date.now(), fileSize : file.size, processingStatus : "in-progress"};

      data = data.trim();

      //before invoice receipt
      var invoiceIndex = data.indexOf("Invoice");
      var receiptIndex = data.indexOf("Invoice Receipt");
      var vendorData = data.substring(invoiceIndex, receiptIndex);
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
             payload.invoiceDate = date;
             index += 4;
             break;
          }
      }

      var array = vendorData.split(/\r?\n/);
      var filtered = array.filter(function (elem) {
          return elem != "";
      });
      var vendor = filtered[2];
      payload.vendorName = vendor;

      //after invoice receipt
      if(receiptIndex !== -1){
         data = data.substring(receiptIndex);
      }

      if(data.indexOf("Tax") !== -1){
         var taxIndex = data.indexOf("Tax");
      }else{
         var taxIndex = data.indexOf("GST");
      }

      if(taxIndex !== -1){
          taxIndex = data.substring(taxIndex).indexOf("%");
          var dotIndex = taxIndex + data.substring(taxIndex).indexOf(".");
          var tax =  "."+ data.substring(dotIndex+1, dotIndex+3);
          dotIndex--;
          while(dotIndex >= 0){
             let char = data.charAt(dotIndex);
             if(char.match("[0-9]")){
               tax = char + tax;
               dotIndex--;
             }else{
               break;
             }
          }
          payload.taxAmount = tax.trim();
      }

      var str = "Total Due";
      var dueIndex = data.indexOf(str);
      if(dueIndex !== -1){
          var totalDue = "";
          var dotIndex =data.substring(0, dueIndex).lastIndexOf(".");
          totalDue = "."+ data.substring(dotIndex+1, dotIndex+3);
          dotIndex--;
          while(dotIndex >= 0){
             let char = data.charAt(dotIndex);
             if(char.match("[0-9]")){
               totalDue = char+ totalDue;
               dotIndex--;
             }else{
               break;
             }
          }
          payload.totalDue = totalDue.trim();

          var currencyIndex = data.indexOf(str) +str.length;
          var currency = "";
          while(currencyIndex < data.length){
              if(data.charAt(currencyIndex).match("[A-Z]")){
                 currency += data.substring(currencyIndex, currencyIndex+3);
                 break;
              }
              currencyIndex++;
          }
          payload.currency = currency;
      }


      if(payload.totalDue == '0.00'){
         payload.processingStatus = "complete";
      }

      const invoice = new Invoice(payload);
      await invoice.save();

      res.status(201).json({id : invoice._id});
      next();
    }catch(e){
      return res.status(500).send(e);
    }

  });


});

app.get('/document/:id', async (req, res, next) => {
      if(!mongoose.Types.ObjectId.isValid(req.params.id)){
         return res.status(400).send("Bad Request Invalid Id");
      }

      await Invoice.findById(req.params.id, function (err, docs) {
          if(err){
            return res.status(500).send("Internal Server Error");
          }

          if(!docs){
              return res.status(404).send("Invoice Not Found");
          }

          res.status(200).json({
            uploadedBy : docs.uploadedBy,
            uploadTimestamp : moment(docs.uploadTimestamp).format('YYYY-MM-DD HH:mm:ss'),
            fileSize : docs.fileSize,
            vendorName : docs.vendorName || null,
            invoiceDate : docs.invoiceDate || null,
            totalDue : docs.totalDue || null,
            currency : docs.currency || null,
            taxAmount : docs.taxAmount || null,
            processingStatus : docs.processingStatus
          });
          next();
      });
});

const server = app.listen(port, () => console.log(`listening on port ${port}!`))

module.exports = {
  app,
  server
};
