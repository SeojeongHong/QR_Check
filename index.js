var express = require('express')
var app = express()

const hostname = '127.0.0.1';
const port = 3000;


app.get('/', function (req, res) {
res.sendFile(__dirname + '/main.html');
})
app.listen(3000);

app.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
 