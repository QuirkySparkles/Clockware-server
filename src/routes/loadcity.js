var express = require("express");
var router = express.Router();
var sql = require('../db');

router.get("/loadcity", function(request, response) {
    sql.query("SELECT * FROM cities", function(err, results, fields) {
            if(err) {
                console.log(err);
                response.sendStatus(500);
            }
            var cities = [];
            results.forEach(item => cities.push(item.city));
            response.json(cities);
        });
    });

module.exports = router;