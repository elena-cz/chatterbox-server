var url = require('url');
var querystring = require('querystring');
var fs = require('fs');
var dataJson = require('./data.json');
var path = require('path');

var validPaths = {
  '/classes/messages': true,
  '/': true
};

var mimeTypes = {
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.html': 'text/html',
  '.gif': 'image/gif'
};

// These headers will allow Cross-Origin Resource Sharing (CORS).
// This code allows this server to talk to websites that
// are on different domains, for instance, your chat client.
//
// Your chat client is running from a url like file://your/chat/client/index.html,
// which is considered a different domain.
//
// Another way to get around this restriction is to serve you chat
// client from this domain by setting up static file serving.
var defaultCorsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'access-control-allow-headers': 'content-type, accept',
  'access-control-max-age': 10 // Seconds.
};

/*************************************************************

You should implement your request handler function in this file.

requestHandler is already getting passed to http.createServer()
in basic-server.js, but it won't work as is.

You'll have to figure out a way to export this function from
this file and include it in basic-server.js so that it actually works.

*Hint* Check out the node module documentation at http://nodejs.org/api/modules.html.

**************************************************************/

var requestHandler = function(request, response) {
  // Request and Response come from node's http module.
  //
  // They include information about both the incoming request, such as
  // headers and URL, and about the outgoing response, such as its status
  // and content.
  //
  // Documentation for both request and response can be found in the HTTP section at
  // http://nodejs.org/documentation/api/

  // Do some basic logging.
  //
  // Adding more logging to your server can be an easy way to get passive
  // debugging help, but you should always be careful about leaving stray
  // console.logs in your code.
  console.log('Serving request type ' + request.method + ' for url ' + request.url);
  var urlParts = url.parse(request.url);
  var pathname = urlParts.pathname;
  console.log(request.url);
  if (!validPaths[pathname]) {
    var filePath = './client' + pathname;
 
    if (fs.existsSync(filePath)) {
      // console.log(filePath);
      fs.readFile(filePath, (err, data) => {
        if (err) {     
          response.writeHead(500); response.end('Server Error!');
          return;
        }
        var statusCode = 200;
        // response.write(data.toString());
        var headers = {};
        headers['Content-Type'] = mimeTypes[path.extname(filePath)];
        console.log(headers['Content-Type']);
        response.writeHead(statusCode, headers);
        // response.write(data.toString());
        // console.log(data.toString());
        // response.write(data);
        console.log('---------------------------------------',filePath);
        response.end(data);
        return;
      });
    } else {
      var statusCode = 404;
      var headers = defaultCorsHeaders;
      headers['Content-Type'] = 'text/plain';
      response.writeHead(statusCode, headers);
      response.end(console.log('This resource does not exist'));
      return;
    }

  } else if (pathname === '/') {

    fs.readFile('./client/index.html', (err, data) => {
      if (err) {     
        response.writeHead(500); response.end('Server Error!');
        return;
      }
      var statusCode = 200;
      var headers = defaultCorsHeaders;
      headers['Content-Type'] = 'text/html';
      response.writeHead(statusCode, headers);
      response.end(data);
      return;
    });
  } else if (request.method === 'OPTIONS') {
    var statusCode = 200;
    var headers = defaultCorsHeaders;
    headers['Content-Type'] = 'text/plain';
    response.writeHead(statusCode, headers); 
    return response.end();
  } else if (request.method === 'GET' && pathname !== '/') {
    // The outgoing status.
    var statusCode = 200;
    // See the note below about CORS headers.
    var headers = defaultCorsHeaders;
    // Tell the client we are sending them plain text.
    //
    // You will need to change this if you are sending something
    // other than plain text, like JSON or HTML.
    headers['Content-Type'] = 'application/json';
    // .writeHead() writes to the request line and headers of the response,
    // which includes the status and all headers.
    response.writeHead(statusCode, headers);
    // Make sure to always call response.end() - Node may not send
    // anything back to the client until you do. The string you pass to
    // response.end() will be the body of the response - i.e. what shows
    // up in the browser.
    //
    // Calling .end "flushes" the response's internal buffer, forcing
    // node to actually send all the data over to the client.
    return response.end(JSON.stringify(dataJson));
  } else if (request.method === 'POST') {
    var body = '';
    var statusCode = 201;
    request.setEncoding('utf8');
    var headers = defaultCorsHeaders;
    headers['Content-Type'] = 'application/json';
    response.writeHead(statusCode, headers);
    request.on('data', (chunk) => {
      body += chunk;
    });
    request.on('end', () => {
      try {
        var data;
        if (body.startsWith('{')) {
          data = JSON.parse(body);
        } else {
          data = querystring.parse(body);
        }
        dataJson.results.unshift(data);
        response.end(JSON.stringify(dataJson));
        fs.writeFile('./server/data.json', JSON.stringify(dataJson), function(err) {
          if (err) {
            throw err;
          }
        });
      } catch (er) {
        response.statusCode = 400;
        return response.end('error!');
      } 
    });
  }
};

exports.requestHandler = requestHandler;