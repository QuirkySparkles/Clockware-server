var express = require("express");
var cors = require("cors");
var clockserver = express();
var cookieParser = require("cookie-parser");
require('dotenv').config()


// Для обработки сложных CORS запросов, которые перед основным запросом
// делают предзапрос.
clockserver.use(function (request, response, next) {
        if (request.method === "OPTIONS") {
            response.header('Access-Control-Allow-Origin', 'http://localhost:8080');
            response.header('Access-Control-Allow-Credentials', true);
            response.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
            response.sendStatus(200);
        }
        else next();
});

clockserver.use(cors());
clockserver.use(cookieParser());

clockserver.use(require('./routes/check'));
clockserver.use(require('./routes/register'));
clockserver.use(require('./routes/auth'));
clockserver.use(require('./routes/admin'));
clockserver.use(require('./routes/loadcity'));

clockserver.listen(8081);