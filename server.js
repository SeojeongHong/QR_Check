var express = require('express');
const mysql = require('mysql2');
var app = express();
const hostname = 'localhost';
const port = 3000;

app.use(express.static(__dirname));

app.get('/', async (req, res) =>{
  res.sendFile(__dirname + '/QR_Check.html');
});


var server = app.listen(port, hostname, async () => {
  console.log(`Server running at http://${hostname}:${port}/`);

  try {
    // Oracle DB 정보
    const connection = mysql.createConnection({
      host: 'localhost',
      user: 'test',
      password: '1234',
      database: 'qr_check'
    });

    console.log('DB 연결 성공');

  } catch (err) {
    console.error('DB 연결 오류:', err);
  }
});

// 서버 종료 핸들러
process.on('SIGINT', async function () {
  try {
    await server.close();
    console.log('서버가 종료되었습니다.');
  } catch (err) {
    console.error('서버 종료 오류:', err);
  }
  process.exit(0);
});