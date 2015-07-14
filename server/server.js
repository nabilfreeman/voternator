var mysql = require('mysql');
var http = require('http');
var url = require('url');

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

    if(request.method === "GET" && request.url === "/votes"){
        //let's get the referrer from the request.
        var refer_url = request.headers['referer'];

        if(refer_url === undefined){
            //direct access not allowed!
            response.writeHead(400);
            response.end();
            return;
        }

        //let's breakup our referrer URL into components like hostname, path, protocol etc
        var url_components = url.parse(refer_url);

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
        });

        return;
    }


}).listen(8000, function(){
    console.log("Listening!");
})
