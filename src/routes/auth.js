var express = require("express");
var router = express.Router();
var cors = require("cors");
var bodyParser = require("body-parser");
var jsonParser = bodyParser.json();
var bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");

var corsOptions = {
    origin: 'http://localhost:8080',
    credentials: true
};

router.post("/auth", cors(corsOptions), jsonParser, function (request, response, next) {
    var adminLogin = "admin@example.com";
    var original = '$2b$10$jWTDY29jWWWL9eE2D0YgIudRIJvO9DcqZ1mkCD9thLynNuy78EEQ2';
    if (!request.body.login || !request.body.password)
        return response.sendStatus(400);
    if (request.body.login !== adminLogin) return response.sendStatus(400);
    bcrypt.compare(request.body.password, original, function (err, res) {
        if (err) return response.sendStatus(500);
        if (!res) return response.sendStatus(400);
        request.legit = res;
        next();
    });
},
    function (request, response) {
        if (!request.legit) return response.sendStatus(500);
        var token = jwt.sign({ login: request.body.login }, "confidential");
        response.cookie('access_token', token, { httpOnly: false }).send();
});

module.exports = router;