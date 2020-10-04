const supertest = require('supertest');
const mongoose = require('mongoose');
const keys = require('../config/keys');

describe('API Tests', () => {
  let server;
  let request;
  before(() => {
    const api = require('../index');
    server = api.server;
    mongoose.connect(keys.mongoURI);
    request = supertest(api.app);
  });

  after(() => {
    mongoose.connection.close();
    server.close();
  });

  it('The api works!', async () => {
    await request.get('/')
      .expect(200);
  });

  var invoiceId;
  /**
   * Testing post invoice endpoint
   */
    it('invoice is uploaded', function (done) {
        request.post('/upload')
            .field('email', 'invoice@test.com')
            .attach('file', 'invoices/Invoice1.pdf')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(201)
            .expect(function(res){
               if(!("id" in res.body) || !mongoose.Types.ObjectId.isValid(res.body.id)){
                    throw new Error("not able to upload the invoice");
               }
               invoiceId = res.body.id;
            })
            .end((err, res) => {
               if (err) return done(err);
               return done();
             });
    });

  /**
   * Testing post invoice endpoint with no invoice file posted
   */
    it('no invoice file is posted', function (done) {
        request.post('/upload')
            .field({"email": "invoice@test.com"})
            .set('Accept', 'application/json')
            .expect('Content-Type','text/html; charset=utf-8')
            .expect(400)
            .expect('Bad Request Invalid File')
            .end((err) => {
                if (err) return done(err);
                return done();
            });
    });

  /**
   * Testing post invoice endpoint with no email varibale posted
   */
    it('no email variable is posted', function (done) {
        request.post('/upload')
            .attach('file', 'invoices/Invoice1.pdf')
            .set('Accept', 'application/json')
            .expect('Content-Type','text/html; charset=utf-8')
            .expect(400)
            .expect('Bad Request Invalid Email')
            .end((err) => {
                if (err) return done(err);
                return done();
            });
    });

  /**
   * Testing post invoice endpoint with empty email
   */
    it('empty email is posted', function (done) {
        request.post('/upload')
            .field({"email": ""})
            .attach('file', 'invoices/Invoice1.pdf')
            .set('Accept', 'application/json')
            .expect('Content-Type','text/html; charset=utf-8')
            .expect(400)
            .expect('Bad Request Invalid Email')
            .end((err) => {
                if (err) return done(err);
                return done();
            });
    });

  /**
   * Testing post invoice endpoint with empty request
   */
    it('the upload invoice request is empty', function (done) {
        request.post('/upload')
            .set('Accept', 'application/json')
            .expect('Content-Type','text/html; charset=utf-8')
            .expect(400)
            .expect('Bad Request Invalid File')
            .end((err) => {
                if (err) return done(err);
                return done();
            });
    });

  /**
   * Testing get a invoice endpoint by giving an existing invoice id 5f2760044a94d3cddfb46570
   */

    it('get the invoice successfully', function (done) {
        request.get('/document/' + invoiceId)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .expect(function(res){
               if(!("uploadedBy" in res.body)) throw new Error("missing uploadedBy property");
               if(!("uploadTimestamp" in res.body)) throw new Error("missing uploadTimestamp property");
               if(!("fileSize" in res.body)) throw new Error("missing fileSize property");
               if(!("vendorName" in res.body)) throw new Error("missing vendorName property");
               if(!("invoiceDate" in res.body)) throw new Error("missing invoiceDate property");
               if(!("totalDue" in res.body)) throw new Error("missing totalDue property");
               if(!("currency" in res.body)) throw new Error("missing currency property");
               if(!("taxAmount" in res.body)) throw new Error("missing taxAmount property");
               if(!("processingStatus" in res.body)) throw new Error("missing processingStatus property");

               if(!res.body.uploadedBy) throw new Error("uploadedBy property is required");
               if(!res.body.uploadTimestamp) throw new Error("uploadTimestamp property is required");
            })
            .end((err) => {
                if (err) return done(err);
                return done();
            });
    });

  /**
   * Testing get a invoice endpoint by giving a invalid invoice id
   */
    it('invoice id is not valid', function (done) {
        request.get('/document/idisnonexisting')
            .set('Accept', 'application/json')
            .expect('Content-Type', 'text/html; charset=utf-8')
            .expect(400)
            .expect('Bad Request Invalid Id')
            .end((err) => {
                if (err) return done(err);
                return done();
            });
    });

  /**
   * Testing get a invoice endpoint by giving a invalid invoice id
   */
    it('invoice is not found', function (done) {
        request.get('/document/5f25c5087e7b5daad79102ae')
            .set('Accept', 'application/json')
            .expect('Content-Type', 'text/html; charset=utf-8')
            .expect(404)
            .expect("Invoice Not Found")
            .end((err) => {
                if (err) return done(err);
                return done();
            });
    });

});
