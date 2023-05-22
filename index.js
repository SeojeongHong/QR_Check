var express = require('express');
var app = express();
const oracledb = require('oracledb');

const hostname = '127.0.0.1';
const port = 3000;

app.use(express.static(__dirname));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/QR_Check.html');
});
let connection;
var server = app.listen(port, hostname, async () => {
  console.log(`Server running at http://${hostname}:${port}/`);

  

  try {
    // Oracle DB 정보
    connection = await oracledb.getConnection({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECT_STRING
    });

    console.log('DB연결 성공');

  } catch (err) {
    console.error('오류:', err);
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

  if (connection) {
    try {
      await connection.close();
      console.log('DB연결 종료');
    } catch (err) {
      console.error('DB 연결 종료 오류:', err);
    }
  }

  process.exit(0);
});
