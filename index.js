const express = require('express');
const multer  = require('multer');
const mongoose = require('mongoose');
const moment = require("moment");
const pdfUtil = require('pdf-to-text');
const bodyParser = require('body-parser');
const keys = require('./config/keys');
require('./models/Invoice');

mongoose.connect(keys.mongoURI);

//const Invoice = mongoose.model('invoices');

const app = express();
const port = 3000;

// var storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, 'invoices/')
//   },
//   filename: function (req, file, cb) {
//     cb(null, file.originalname)
//   }
// })
//
// const upload = multer({ storage: storage });

app.use(bodyParser.json());
require('./routes/fetchInvoice')(app);
require('./routes/uploadInvoice')(app);

app.get('/', (req, res) => res.send('Welcome!'));


const server = app.listen(port, () => console.log(`listening on port ${port}!`))

module.exports = {
  app,
  server
};
