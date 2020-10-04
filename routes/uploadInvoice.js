const bodyParser = require('body-parser');
const multer  = require('multer');
// const mongoose = require('mongoose');
const pdfUtil = require('pdf-to-text');
const invoiceParser = require('../services/invoiceParser.js').invoiceParser;
//const Invoice = mongoose.model('invoices');

module.exports = app => {
  var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'invoices/')
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname)
    }
  })

  const upload = multer({ storage: storage });

  app.post('/upload',  upload.single('file'), (req, res, next) => {
    // req.file is the uploaded file
    // req.body.email should have the email address
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

        var obj = new invoiceParser(email, file, data);
        var id =  await obj.parse();

        res.status(201).json({id : id});
        next();
      }catch(e){
        console.log(e);
        return res.status(500).send(e);
      }
    });
  });
};
