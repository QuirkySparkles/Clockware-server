var express = require("express");
var clockserver = express(),
    mailer = require("express-mailer");
var router = express.Router();
var sql = require('../db');
var bodyParser = require("body-parser");
var jsonParser = bodyParser.json();

mailer.extend(clockserver, {
    from: "support@clockware.com",
    host: "smtp.gmail.com",
    secureConnection: true,
    port: 465,
    transportMethod: "SMTP",
    auth: {
        user: process.env.MAILER_USER,
        pass: process.env.MAILER_PASS
    }
});

//шаблон и загрузчик для формирования писем, которые отправляются 
//клиентам при регистрации
clockserver.set('views', './views');
clockserver.set('view engine', 'pug');

router.post("/register", jsonParser, function (request, response, next) {
    checkLength(request, response, next);
},
    function (request, response, next) {
        checkEmail(request, response, next);
    },
    function (request, response, next) {
        sql.query("INSERT INTO orders VALUES (?, ?, ?, ?, ?, ?, ?)", [request.orderCount, request.body.email, request.body.city, request.body.masterId, request.body.clocksize[0], request.body.orderDate, request.body.orderTime], function (err, results, fields) {
            if (err) {
                console.log(err);
                response.sendStatus(500);
            }
            console.log("Order inserted!");
            next();
        });
    },
    function (request, response, next) {
        clockserver.mailer.send("email", prepareEmailForm(request), function (err) {
            if (err) {
                console.log(err);
            }
            if (request.newClient) next();
            else response.sendStatus(200);
        });
    },
    function (request, response) {
        sql.query("INSERT INTO clients VALUES (?, ?, ?, ?, ?, ?)",
            [request.clientCount, request.body.name, request.body.email, request.body.clocksize[0], request.body.city, request.body.orderDate],
            function (err, results, fields) {
                if (err) {
                    console.log(err);
                    response.sendStatus(500);
                }
                console.log("Client inserted!");
            });
        response.sendStatus(200);
    });

function checkLength(request, response, next) {
    sql.query("SELECT (SELECT COUNT(*) FROM orders) as orders, (SELECT COUNT(*) FROM clients) as clients", function(err, results, fields) {
            if (err) {
                console.log(err);
                response.sendStatus(500);
            }
        request.orderCount = results[0].orders + 1;
        request.clientCount = results[0].clients + 1;
        next();
    });
}

function checkEmail(request, response, next) {
    var template = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,5})+$/;
    if(!request.body.email.match(template)) response.sendStatus(400);
    sql.query("SELECT email FROM clients as email", 
        function(err, results, fields) {
            if (err) {
                console.log(err);
                response.sendStatus(500);
            }
        request.newClient = !results.some( index => index.email == request.body.email);
        next();
    });
}

function prepareEmailForm(request) {
    var time;
    var emailForm = {
        to: request.body.email,
        subject: "Компания Clockwork",
        name: request.body.name,
        city: request.body.city,
        time: request.body.orderTime
    };
    if(request.body.clocksize === "small") {
        emailForm.clocksize = "маленькие";
        time = "1 час";
    } else if(request.body.clocksize === "medium") {
        emailForm.clocksize = "средние";
        time = "2 часа";
    } else {
        emailForm.clocksize = "большие";
        time = "3 часа";
    }
    
    emailForm.message = `Починка Ваших часов займет примерно ${time}.`;
    
    emailForm.orderdate = `${request.body.orderDate.slice(8)}.${request.body.orderDate.slice(5, 7)}.${request.body.orderDate.slice(0, 4)}`;

    return emailForm;
}

module.exports = router;