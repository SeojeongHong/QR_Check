var express = require('express');
const mysql = require('mysql2');
var app = express();
const hostname = 'localhost';
const port = 3000;
var connection=null;
app.use(express.static(__dirname));

var server = app.listen(port, hostname, async () => {
  console.log(`Server running at http://${hostname}:${port}/`);
  try {
    // Oracle DB 정보
    connection = mysql.createConnection({
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

//과목번호(학수번호) -> url
var coureid;

app.get('/:id', async (req, res) =>{
  courseid = req.params.id;

  //과목번호(c_num)으로 과목 이름(c_name) 받아오는 쿼리
  const query = 'SELECT c_name FROM course WHERE c_num = ?';
  connection.query(query, [courseid], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      res.status(500).send('서버 오류');
      return;
    }

    const courseName = results[0].c_name;

    if (courseName) {
      res.sendFile(__dirname + '/QR_Check.html');
      console.log(`과목: ${courseName}`);
    } else {
      res.status(404).send('과목을 찾을 수 없습니다.');
    }
  });

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