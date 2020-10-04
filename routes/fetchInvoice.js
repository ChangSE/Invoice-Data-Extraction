const mongoose = require('mongoose');
const moment = require("moment");
const Invoice = mongoose.model('invoices');

module.exports = app => {
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
};
