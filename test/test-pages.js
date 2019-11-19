var expect  = require('chai').expect;
var request = require('request');

it('Main page content', function(done) {
    request('http://localhost:3000' , function(error, res) {
        expect(res.body.status).to.equals("success");
        //expect(res.body.result).to.equals(10);
        done();
    });
});