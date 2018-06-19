var express = require("express");
var router = express.Router();
var bodyParser = require("body-parser");
var jsonParser = bodyParser.json();
var sql = require('../db');

router.post("/check", jsonParser, function (request, response, next) {
    var newRequest = prepareNewRequest(request.body.orderTime, request.body.clocksize);
    sql.query('SELECT order_time, master_id, clocksize FROM orders WHERE city = ? AND order_date = ?', [request.body.city, request.body.orderDate],
        function (err, results, fields) {
            if (err) {
                console.log(err);
                response.sendStatus(500);
            }
            if (!results) request.lockedMasters = false;
            request.lockedMasters = checkMasters(prepareExOrders(results), newRequest);
            next();
        });
},
    function (request, response) {
        if (!request.lockedMasters) {
            sql.query('SELECT * FROM masters WHERE city = ?', [request.body.city], 
                function (err, results, fields) {
                    if (err) {
                        console.log(err);
                        response.send(500);
                    }
                    else response.json(results);
                });
        } else { sql.query('SELECT * FROM masters WHERE city = ? AND id NOT in (?)', [request.body.city, request.lockedMasters],
            function (err, results, fields) {
                if (err) {
                    console.log(err);
                    response.sendStatus(500);
                }
                else response.json(results);
            });
         }
    });

function prepareNewRequest(requestedTime, requestClocksize) {
    if(requestedTime.indexOf(':') === 1) 
        var timeStart = Number(requestedTime.slice(0, 1));
    else timeStart = Number(requestedTime.slice(0, 2));
    var timeEnd = timeStart;
    if (requestClocksize === 'small') timeEnd += 1;
    else if (requestClocksize === 'medium') timeEnd += 2;
    else timeEnd += 3;
    return [timeStart, timeEnd];
}

function prepareExOrders(existentOrders) {
    var madeOrders = [];
    existentOrders.forEach( (item, i) => {
        madeOrders.push([]);
        madeOrders[i].push( Number(item.order_time.slice(0, 2)) );
        madeOrders[i].push(item.master_id);
        madeOrders[i].push(item.clocksize);
        });
    madeOrders.map( (item) => {
        if(item[2] == 's') item[2] = item[0] + 1;
        else if(item[2] == 'm') item[2] = item[0] + 2;
        else item[2] = item[0] + 3;
    });
    return madeOrders;
}

function checkMasters(madeOrders, newRequest) {
    var lockedMasters = [];
    madeOrders.filter( (item) => {
        if(item[0] < newRequest[0] && item[2] < newRequest[0]) return true;
        else if(item[0] > newRequest[0] && item[0] > newRequest[1]) return true;
        else {
            if( lockedMasters.every( (item2) => item2 != item[1]) )
                lockedMasters.push(item[1]);
            return false;
        }
    });
    return (lockedMasters[0]) ? lockedMasters : false;        
}

module.exports = router;