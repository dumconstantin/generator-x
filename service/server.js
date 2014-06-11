var http = require('http');
var fs = require('fs'),
    index = fs.readFileSync('index.html'),
    url = require("url"),
    process = require('child_process');

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


function generate(ip, password) {

    process.exec('pwd', function (err, out) {
        var path = out
            .replace('test/plugins/generatorx/service', '')
            .replace(/[\n\s\r]/g, '');

        var child = process.fork('app.js' , 
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
            console.log('Received message');
            console.log(message);
        });
    });

}

http.createServer(function (req, res) {
    var query = url.parse(req.url, true),
        data = '';

    if (req.method == 'POST') {

        req.on('data', function (chunk) {
            data += chunk;
        });

        req.on('end', function () {
            var params = splitter(data);
            generate(params.ip, params.pass);
        });

    } else {
        res.writeHead(200, {'Content-Type': "text/html"});
        res.end(index); 
    }

}).listen(9615);