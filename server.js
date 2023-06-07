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
//해당 과목 수업 시간 검사
var coureid;

app.get('/:id', async (req, res) => {
  courseid = req.params.id;
  //과목번호(c_num)으로 과목 정보 받아옴
  const query = 'SELECT * FROM course WHERE c_num = ?';
  connection.query(query, [courseid], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      res.status(500).send('서버 오류');
      return;
    }

    if (results.length > 0) {
      const courseName = results[0].c_name;
      const professor = results[0].professor;

      //과목정보 쿠키에 저장
      res.cookie('courseName', courseName);
      res.cookie('professor', professor);
      res.sendFile(__dirname + '/QR_Check.html');
      // console.log(`과목: ${courseName}`);
    } else {
      res.status(404).send('과목을 찾을 수 없습니다.');
    }
  });

});

//출석 - 데이터 삽입
//1. 수강 여부 검사
//2. 수업 시간 검사
app.post('/insertData', async (req, res) => {

  const hakbun = req.body.qrdata.hakbun;
  let today = new Date();
  const week = ['일', '월', '화', '수', '목', '금', '토'];
  let day = today.getDay();
  let minutes = today.getMinutes();


  console.log('server:' + hakbun);
  try {

  const rs = await connection.promise().query(`SELECT * FROM COURSE_TIME WHERE C_NUM=${courseid} AND DAY='${week[day]}'`);
  if(rs[0].length>0){
      console.log(week[day]+'요일 수업o');
      const start_time =rs[0].map(row => row.START_TIME);
      const end_time =rs[0].map(row => row.END_TIME);

      const date1 = new Date(`2023-06-05 ${start_time}`);
      const date2 = new Date(`2023-06-05 ${end_time}`);
      
      if (date1 < today && today <date2) {
        console.log(`수업중`);
      } else {
        console.log(`수업시간 아님`);
      }
    }else{
      //삽입X -> 해당 강의의 출석 시간이 아닙니다.
      console.log(week[day]+'요일 수업X');
    }
    
    //학번 - 과목코드 - 출석시간
    const insertQuery = `
      INSERT INTO QRCHECK (s_num, c_num, time)
        VALUES (?, ?, ?)
        `;
    const params = [hakbun, courseid, today];
    //1. 수강 여부 검사
    connection.promise().query('SELECT ' + hakbun + ' FROM ENROL WHERE C_NUM=' + courseid + ';')
      .then(([rows]) => {
        if (rows.length > 0) {
          console.log('수강 O');
          connection.query(insertQuery, params, (error, results) => {
            if (error) {
              console.error('오류:', error);
              res.status(500).send('데이터 삽입 오류');
            } else {
              console.log('데이터 삽입 성공');
              res.send('데이터 삽입 성공');
            }
          });
        } else {
          console.log('수강 X, 데이터 삽입X');
        }
      }).catch((error) => {
        console.error(error);
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