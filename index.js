const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const keys = require('./config/keys');
require('./models/Invoice');

mongoose.connect(keys.mongoURI);

const app = express();
const port = 3000;


app.use(bodyParser.json());
require('./routes/fetchInvoice')(app);
require('./routes/uploadInvoice')(app);

app.get('/', (req, res) => res.send('Welcome!'));


const server = app.listen(port, () => console.log(`listening on port ${port}!`))

module.exports = {
  app,
  server
};
