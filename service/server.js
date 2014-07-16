var http = require('http');
var fs = require('fs'),
    index = fs.readFileSync('index.html', 'utf8'),
    url = require("url"),
    childProcess = require('child_process'),
    path = require("path");

var mimeTypes = {
    "html": "text/html",
    "jpeg": "image/jpeg",
    "jpg": "image/jpeg",
    "png": "image/png",
    "js": "text/javascript",
    "css": "text/css"};

function splitter(data){
    var regExp = /name=\"([a-z]+)\"([a-z0-9\.]+)/gi,
        params,
        hash = {};
    
    data = data.replace(/[\n\r]/g, '');

    while ((params = regExp.exec(data)) !== null)
    {
        hash[params[1]] = params[2];
    }

    return hash;
}


function generate(ip, password, callback) {

    childProcess.exec('pwd', function (err, out) {
        var path = out
            .replace('test/plugins/generatorx/service', '')
            .replace(/[\n\s\r]/g, '');

        var child = childProcess.fork('app.js' , 
            ['-f', 'test/plugins', '-h', ip, '-P', password, '-p', 49494], 
            {
                cwd: path
            }, 
            function(err, out, code) {

                if (err instanceof Error) {
                    console.log(err);
                }

                console.log(err);
                console.log(out);
                console.log(code);
            });

        child.on('message', function (message) {
            console.log('The generator has finished. Sending response to user.');
            console.log(message);
            callback(JSON.stringify(message));
        });
    });

}

var finishedQueue = {};


http.createServer(function (req, res) {
    var query = url.parse(req.url, true),
        data = '';

    var uri = url.parse(req.url).pathname
    , filename = path.join(process.cwd(), uri);
  


    if (req.method == 'POST') {

        if (undefined === finishedQueue[req.connection.remoteAddress]) {
            res.end('{"finished": false}');
        } else {
            res.end(finishedQueue[req.connection.remoteAddress]);
        }

    } else {

          fs.exists(filename, function(exists) {
            if(!exists) {
            res.writeHead(200, {'Content-Type': "text/html"});
            res.end(index);


            generate(req.connection.remoteAddress, 'password', function (response) {
                finishedQueue[req.connection.remoteAddress] = response;
            });
              return;
            }
         
            if (fs.statSync(filename).isDirectory()) filename += '/index.html';
         
            fs.readFile(filename, "binary", function(err, file) {
              if(err) {        
                res.writeHead(500, {"Content-Type": "text/plain"});
                res.write(err + "\n");
                res.end();
                return;
              }
         
              res.writeHead(200);
              res.write(file, "binary");
              res.end();
            });
          });
    }

}).listen(9616);