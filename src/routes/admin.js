var express = require("express");
var router = express.Router();
var jwt = require("jsonwebtoken");
var bodyParser = require("body-parser");
var jsonParser = bodyParser.json();
var mysql = require('mysql');

var sql = mysql.createConnection({
    host: 'localhost',
    user: 'server1',
    password: 'dnmgdsal2',
    database: 'clockbase',
    timezone: 'Z',
    multipleStatements: true
});

router.route("/")
    .get(function (request, response) {
        if (!request.headers['authorization']) return response.sendStatus(401);
        try {
            var cookie = request.headers['authorization'];
            cookie = cookie.slice( cookie.indexOf('=') + 1 );
            var admintoken = jwt.verify(cookie, "confidential");
            if (admintoken.login === "admin@example.com") response.sendStatus(200);
            else response.sendStatus(400);
        } catch (err) {
            console.log(err);
            return response.sendStatus(500);
        }
    });

router.route("/loaddata")
    .post(jsonParser, function (request, response) {
        sql.query('SELECT * FROM ??', request.body.table, 
        function (err, results, fields) {
            if (err) {
                console.log(err);
                response.sendStatus(500);
            }
            response.json(results);
        });
});

router.route("/deldata")
    .post(jsonParser, function (request, response) {
        var min = request.body.value.sort( (a, b) => a - b )[0] - 1;
        sql.query("DELETE from ?? WHERE number IN (?); SET @i:=?; UPDATE ?? SET number = @i:=@i+1 WHERE number > ?", [request.body.table, request.body.value, min, request.body.table, min], 
        function (err, results, fields) {
            if(err) {
                console.log(err);
                response.sendStatus(500);
            }
            else response.sendStatus(200);
        });
});

router.route("/cities")
    .post(jsonParser, function (request, response) {
        sql.query("INSERT into cities VALUES (?, ?)", [request.body.number, request.body.value], function (err, results, fields) {
            if(err) {
                console.log(err);
                response.sendStatus(500);
            }
            else response.sendStatus(200);
        });
});


router.route("/clients")
    .post(jsonParser, function (request, response) {
        if(request.body.clocksize[0] == "м") request.body.clocksize = "s";
        else if(request.body.clocksize[0] == "с") request.body.clocksize = "m";
        else request.body.clocksize = "l";
        sql.query('UPDATE clients SET name = ?, email = ?, clocksize = ?, city = ?, order_date = ? WHERE number = ?', [request.body.name, request.body.email, request.body.clocksize, request.body.city, request.body.order_date, request.body.number], function (err, results, fields) {
            if(err) {
                console.log(err);
                response.sendStatus(500);
            }
            else response.sendStatus(200);
        });
});

router.route("/orders")
    .post(jsonParser, function (request, response) {
        if(request.body.clocksize[0] == "м") request.body.clocksize = "s";
        else if(request.body.clocksize[0] == "с") request.body.clocksize = "m";
        else request.body.clocksize = "l";
        sql.query('UPDATE orders SET city = ?, client_email = ?, master_id = ?, clocksize = ?, order_date = ?, order_time = ? WHERE number = ?', [request.body.city, request.body.client_email, request.body.master_id, request.body.clocksize, request.body.order_date, request.body.order_time, request.body.number], function (err, results, fields) {
            if(err) {
                console.log(err);
                response.sendStatus(500);
            }
            else response.sendStatus(200);
        });
});

router.route("/masters")
    .post(jsonParser, function (request, response) {
        sql.query('UPDATE masters SET id = ?, name = ?, surname = ?, city = ?, rating = ? WHERE number = ?', [request.body.id, request.body.name, request.body.surname, request.body.city, request.body.rating, request.body.number], function (err, results, fields) {
            if(err) {
                console.log(err);
                response.sendStatus(500);
            }
            else response.sendStatus(200);
        });
});

router.route("/addmaster")
    .post(jsonParser, function (request, response) {
        sql.query("INSERT INTO masters VALUES (?, ?, ?, ?, ?, ?)", [request.body.number, request.body.id, request.body.name, request.body.surname, request.body.city, request.body.rating], function (err, results, fields) {
            if(err) {
                console.log(err);
                response.sendStatus(500);
            }
            else response.sendStatus(200);
        });
});

router.use("/admin", router);

module.exports = router;