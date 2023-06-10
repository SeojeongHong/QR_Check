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
  let ymd = today.getFullYear+'-'+today.getMonth+'-'+today.getDate;
  const week = ['일', '월', '화', '수', '목', '금', '토'];
  let day = today.getDay();  
  let minutes = today.getMinutes();
  let status='test';
  try {

    //학번 - 과목코드 - 출석시간
    const insertQuery = `
      INSERT INTO QRCHECK (s_num, c_num, time)
        VALUES (?, ?, ?)
        `;
    const params = [hakbun, courseid, today];

    //1. 수강 여부 검사 로직
    const q1 = await connection.promise().query(`SELECT * FROM ENROL WHERE C_NUM=${courseid} AND S_NUM=${hakbun};`);

    if(q1[0].length>0){
      //수강O

      //2. 강의 시간 검사 로직
      const q2 = await connection.promise().query(`SELECT * FROM COURSE_TIME WHERE C_NUM=${courseid} AND DAY='${week[day]}'`);
      if(q2[0].length>0){
        //오늘 수업ㅇ
          const start_time =q2[0][0].start_time;
          const end_time =q2[0][0].end_time;
    
          const date1 = new Date(`${ymd} ${start_time}`);
          const date2 = new Date(`${ymd} ${end_time}`);
          
          console.log(date1);
          console.log(today);
          console.log(date2);
          if (-1) {
            status="PRESENT";
            connection.query(insertQuery, params, (error, results) => {
              if (error) {
                console.error('오류:', error);
                res.status(500).send('데이터 삽입 오류');
              } else {
                console.log('데이터 삽입 성공');
                res.cookie('status', status,{ maxAge: 2000 });
                res.send('데이터 삽입 성공');
              }
            });
            
            console.log(`정상 출석`);
          } else {
            status="LATE";
            res.cookie('status', status,{ maxAge: 2000 });
                res.send('지각');
            console.log(`해당 과목의 출석 시간이 아닙니다1`);
          }
        }else{
          status="ABSENT";
          res.cookie('status', status,{ maxAge: 2000 });
          res.send('결석');
          console.log(`해당 과목의 출석 시간이 아닙니다2`);
        }

    }else{
      //수강X
      status="ERROR";
      res.cookie('status', status,{ maxAge: 2000 });
      res.send('지각');
      console.log(`해당 과목을 수강하지 않습니다`);
    }

    
  } catch (error) {
    console.error('오류:', error);
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