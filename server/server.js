var mysql = require('mysql');
var http = require('http');
var url = require('url');
var qs = require('querystring');

var db_config = {
  host     : 'freeman-industries-1.cfxzsglbyoxx.us-east-1.rds.amazonaws.com',
  database : 'voternator',
  multipleStatements : true,
  user     : 'root',
  password : '3utZt(mdd65^%CK',
};

var choices = [];

var getEnabledChoices = function(){
    var connection = mysql.createConnection(db_config);
    connection.connect();

    connection.query('SELECT id FROM choices a WHERE a.enabled=1;', function(err, rows, fields) {
        if (err) throw err;

        var new_choices = [];
        rows.forEach(function(row){
            new_choices.push(row.id);
        });

        choices = new_choices;

        connection.end();
    });

    setTimeout(getEnabledChoices, 300000);
}

getEnabledChoices();




var server = http.createServer(function(request, response){



    // Set CORS headers
	response.setHeader('Access-Control-Allow-Origin', '*');
	response.setHeader('Access-Control-Request-Method', '*');
	response.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
	response.setHeader('Access-Control-Allow-Headers', '*');

	if ( request.method === 'OPTIONS' ) {
		response.writeHead(200);
		response.end();
		return;
	}
    // End CORS



    //let's get the referrer from the request.
    var refer_url = request.headers['referer'];

    if(refer_url === undefined){
        //direct access not allowed!
        console.log("NO!");
        response.writeHead(400);
        response.end();
        return;
    }

    //let's breakup our referrer URL into components like hostname, path, protocol etc
    var url_components = url.parse(refer_url);


    //GET /votes
    if(request.method === "GET" && request.url === "/votes"){

        //build connection
        var connection = mysql.createConnection(db_config);
        connection.connect();

        //construct query
        var query_string = "";

        //we gathered the enabled symbols up above. we're gonna run these queries just in case the hostname is new, or we added symbols since the last access.
        choices.forEach(function(choice){
            query_string += "INSERT IGNORE INTO `votes` (`hostname`, `path`, `choice`) VALUES (" + connection.escape(url_components.host) + ", " + connection.escape(url_components.path) + ", " + connection.escape(choice) + ");";
        });
        query_string += "SELECT hostname, path, choice, score, type, content FROM votes a LEFT JOIN choices b ON a.choice=b.id WHERE a.hostname=" + connection.escape(url_components.host) + "  AND a.path=" + connection.escape(url_components.path) + " AND b.enabled = 1;";
        // console.log(query_string); //for debugging

        //let's execute the query.
        connection.query(query_string, function(err, rows, fields) {
            if (err) throw err;

            var result = rows[rows.length - 1];

            var obj = {
                data: result
            };

            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify(obj));

            connection.end();
        });

        return;

    }



    //POST /vote/up
    if(request.method === "POST" && request.url === "/vote/up"){

        var body = '';
        request.on('data', function (data) {
            body += data;

            // Too much POST data, kill the connection!
            if (body.length > 1e2){
                request.connection.destroy();
            }
        });
        request.on('end', function () {
            var post = qs.parse(body);

            var id = parseInt(post['choice']);

            if( choices.indexOf(id) === -1 ){
                //something went wrong or someone is doing something bad.
                response.writeHead(400);
                response.end();
                return;
            }

            //build connection
            var connection = mysql.createConnection(db_config);
            connection.connect();

            //construct query
            var query_string = "";

            query_string = "UPDATE votes SET score = score + 1 WHERE hostname=" + connection.escape(url_components.host) + " AND path=" + connection.escape(url_components.path) + " AND choice = " + connection.escape(id) + ";";
            // console.log(query_string); //for debugging

            //let's execute the query.
            connection.query(query_string, function(err, rows, fields) {
                if (err) throw err;

                response.writeHead(200);
                response.end();

                connection.end();
            });
        });

        return;

    }



    //POST /vote/down
    if(request.method === "POST" && request.url === "/vote/down"){

        var body = '';
        request.on('data', function (data) {
            body += data;

            // Too much POST data, kill the connection!
            if (body.length > 1e2){
                request.connection.destroy();
            }
        });
        request.on('end', function () {
            var post = qs.parse(body);

            var id = parseInt(post['choice']);

            if( choices.indexOf(id) === -1 ){
                //something went wrong or someone is doing something bad.
                response.writeHead(400);
                response.end();
                return;
            }

            //build connection
            var connection = mysql.createConnection(db_config);
            connection.connect();

            //construct query
            var query_string = "";

            query_string = "UPDATE votes SET score = CASE WHEN score = 0 THEN 0 WHEN score > 0 THEN score - 1 END WHERE hostname=" + connection.escape(url_components.host) + " AND path=" + connection.escape(url_components.path) + " AND choice = " + connection.escape(id) + ";";
            // console.log(query_string); //for debugging

            //let's execute the query.
            connection.query(query_string, function(err, rows, fields) {
                if (err) throw err;

                response.writeHead(200);
                response.end();

                connection.end();
            });
        });

        return;

    }



});

//SERVER
var port = process.env.port !== undefined ? process.env.port : 80;
var ip = "127.0.0.1";

//RedHat Openshift stuff. ignore or delete if you are not hosting on Openshift.
port = process.env.OPENSHIFT_NODEJS_PORT !== undefined ? process.env.OPENSHIFT_NODEJS_PORT : port;
ip = process.env.OPENSHIFT_NODEJS_IP !== undefined ? process.env.OPENSHIFT_NODEJS_IP : ip;

console.log("Attempting to listen on " + ip + ":" + port + "...");
server.listen(port, ip);
