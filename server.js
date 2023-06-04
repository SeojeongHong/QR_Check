var express = require('express');
const mysql = require('mysql2');
var app = express();
const hostname = 'localhost';
const port = 3000;
// body-parser
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

var connection = null;
app.use(express.static(__dirname));

var server = app.listen(port, hostname, async () => {
  console.log(`Server running at http://${hostname}:${port}/`);
  try {
    // Mysql DB 정보
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

app.get('/:id', async (req, res) => {
  courseid = req.params.id;

  //과목번호(c_num)으로 과목 이름(c_name) 받아오는 쿼리
  const query = 'SELECT c_name FROM course WHERE c_num = ?';
  connection.query(query, [courseid], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      res.status(500).send('서버 오류');
      return;
    }


    if (results.length > 0) {
      const courseName = results[0].c_name;
      res.sendFile(__dirname + '/QR_Check.html');
      console.log(`과목: ${courseName}`);
    } else {
      res.status(404).send('과목을 찾을 수 없습니다.');
    }
  });

});

//출석 - 데이터 삽입
app.post('/insertData', async (req, res) => {

  const hakbun = req.body.qrdata.hakbun;
  let today = new Date();
  let minutes = today.getMinutes();

  console.log('server:' + hakbun);
  try {
    //출석 데이터 삽입 SQL
    //학번 - 과목코드 - 출석시간
    const insertQuery = `
    INSERT INTO QRCHECK (s_num, c_num, time)
    VALUES (?, ?, ?)
    `;

    const params = [hakbun, courseid, today];

    connection.query(insertQuery, params, (error, results) => { // 쿼리 실행 방식 수정
      if (error) {
        console.error('오류:', error);
        res.status(500).send('데이터 삽입 오류');
      } else {
        console.log('데이터 삽입 성공');
        res.send('데이터 삽입 성공');
      }
    });
  } catch (error) {
    console.error('오류:', error);
    res.status(500).send('데이터 삽입 오류');
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