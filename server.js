var express = require('express');
const mysql = require('mysql2');
var app = express();
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
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


//홈 : 모든 강의 조회
app.get('/', function (req, res) {
  const query = 'SELECT * FROM COURSE';
  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      res.status(500).send('서버 오류');
      return;
    }
    res.render('courselist.ejs', { results: results }, function (err, html) {
      if (err) {
        console.log(err)
      }
      res.send(html) // 응답 종료
    })
  })
});

//QR학번으로 수강하는 강의 목록 조회
app.get('/search/:hakbun', function (req, res) {
  //URL 경로에서 학번 추출
  hakbun = req.params.hakbun;

   //수강 목록을 검색하기 위한 쿼리
  const query = 'SELECT * FROM COURSE NATURAL JOIN ENROL WHERE S_NUM = ?';

  //쿼리 결과를 클라이언트(수강목록 페이지)로 전달
  connection.query(query, [hakbun], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      res.status(500).send('서버 오류');
      return;
    }

    res.render('courselist.ejs', { results: results }, function (err, html) {
      if (err) {
        console.log(err);
      }
      res.send(html); // 응답 종료
    })
  })
});

//과목번호(학수번호) -> url
//해당 과목 수업 시간 검사
var courseid;
app.get('/course/:id', async (req, res) => {
  //URL경로에서 학수번호 추출
  courseid = req.params.id;
  //강의 정보를 받아오기 위한 쿼리
  const query = 'SELECT * FROM COURSE WHERE C_NUM = ?';
  connection.query(query, [courseid], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      res.status(500).send('서버 오류');
      return;
    }
    res.render('QR_Check.ejs', { results: results }, function (err, html) {
      if (err) {
        console.log(err);
      }
      res.send(html);
    })
  });

});

// //시스템 시간 정보 -> 출석데이터로 사용
// let today = new Date();
// const week = ['일', '월', '화', '수', '목', '금', '토'];
// let day = today.getDay();
// //날짜 정보 - 시스템 시간
// let year = today.getFullYear();
// let month = String(today.getMonth() + 1).padStart(2, '0');
// let date = String(today.getDate()).padStart(2, '0');
// //mysql date 형식 yyy-mm-dd
// let mysqlDate = year + '-' + month + '-' + date;

// //시간 정보 - 시스템 시간
// let hours = String(today.getHours()).padStart(2, '0');
// let minutes = String(today.getMinutes()).padStart(2, '0');
// let seconds = String(today.getSeconds()).padStart(2, '0');
// //mysql time 형식 hh:mm:ss
// let mysqlTime = hours + ':' + minutes + ':' + seconds;

//출석 - 데이터 삽입
//1. 수강 여부 검사
//2. 수업 시간 검사
app.post('/insertData', async (req, res) => {
  
  let qrdata = req.body.qrdata;
  let hakbun = qrdata.hakbun;

  //시스템 시간 정보 -> 출석데이터로 사용
  //
let today = new Date();
const week = ['일', '월', '화', '수', '목', '금', '토'];
let day = today.getDay();
//날짜 정보 - 시스템 시간
let year = today.getFullYear();
let month = String(today.getMonth() + 1).padStart(2, '0');
let date = String(today.getDate()).padStart(2, '0');
//mysql date 형식 yyy-mm-dd
let mysqlDate = year + '-' + month + '-' + date;

//시간 정보 - 시스템 시간
let hours = String(today.getHours()).padStart(2, '0');
let minutes = String(today.getMinutes()).padStart(2, '0');
let seconds = String(today.getSeconds()).padStart(2, '0');
//mysql time 형식 hh:mm:ss
let mysqlTime = hours + ':' + minutes + ':' + seconds;

  //QR에 저장된 시간 정보
  let qr_date = qrdata.date_y + '-' + qrdata.date_m + '-' + qrdata.date_d;
  let qr_time = qrdata.time_h + ':' + qrdata.time_m + ':' + qrdata.time_s;

  //출석 상태 (출석, 지각, 결석)
  let status = 'null';
  try {
    //1. 수강 여부 검사 로직
    const q1 = await connection.promise().query(`SELECT * FROM ENROL WHERE C_NUM=? AND S_NUM=?;`, [courseid, hakbun]);

    if (q1[0].length > 0) {
      //수강O

      //2. 강의 시간 검사 로직
      const q2 = await connection.promise().query(`SELECT * FROM COURSE_TIME WHERE C_NUM=? AND DAY=?`, [courseid, week[day]]);
      if (q2[0].length > 0) {
        //오늘 수업ㅇ
        const start_time = q2[0][0].start_time;
        const end_time = q2[0][0].end_time;
        const qrdate = new Date(`${qr_date} ${qr_time}`);   //출석 기준 시간 : qrdate

        //출석 기준 시간 설정
        //출석 시작 시간 : 수업 시작 10분 전부터 출석 시작
        var set_presenttime = new Date(`${mysqlDate} ${start_time}`);
        set_presenttime.setMinutes(set_presenttime.getMinutes() - 10);

        //지각 시작 시간 : 수업 시작 후 10분까지 정상 출석
        var set_latetime = new Date(`${mysqlDate} ${start_time}`);
        set_latetime.setMinutes(set_latetime.getMinutes() + 10);

        //출석 종료 시간 : 수업 마치기 20분 전까지 지각 인정
        var set_endtime = new Date(`${mysqlDate} ${end_time}`);
        set_endtime.setMinutes(set_endtime.getMinutes() - 20);

        // console.log('QR 입력 시간 : ' + qrdate);
        // console.log('출석 시작 시간 : ' + set_presenttime);
        // console.log('지각 시작 시간 : ' + set_latetime);
        // console.log('출석 종료 시간 : ' + set_endtime);

        if (set_presenttime <= qrdate && qrdate < set_latetime) {
          status = 'PRESENT';
          console.log(`정상출석`);
        } else if (set_latetime <= qrdate && qrdate < set_endtime) {
          status = "LATE";
          console.log(`지각`);
        } else {
          status = "ABSENT";
          res.cookie('status', status, { maxAge: 2000 });
          console.log(`해당 과목의 출석 시간이 아닙니다`);
        }

        //                  학번 - 과목코드 - 출석날짜 - 출석시간 - 출석상태
        const insertQuery = `
        INSERT INTO QRCHECK (s_num, c_num, date, time, status)
                      VALUES (?, ?, ?, ?, ?)`;
        params = [hakbun, courseid, mysqlDate, mysqlTime, status];

        if (status =='PRESENT' ||status =='LATE' ){
        const results = await connection.promise().query(insertQuery, params);
      }

        // 데이터 삽입 성공
        res.cookie('status', status, { maxAge: 2000 });
        res.send('데이터 삽입 성공');
        console.log('데이터 삽입 성공');
        //실패 -> catch
      } else {
        status = "ABSENT";
        res.cookie('status', status, { maxAge: 2000 });
        res.send('결석');
        console.log(`해당 과목의 출석 시간이 아닙니다2`);
      }

    } else {
      //수강X
      status = "ERROR";
      res.cookie('status', status, { maxAge: 2000 });
      res.send('지각');
      console.log(`해당 과목을 수강하지 않습니다`);
    }

  } catch (error) {
    //데이터 삽입 오류 - 중복
    console.error('오류:', error);
    status = 'DUPLICATE';
    res.cookie('status', status, { maxAge: 2000 });
    res.status(500).send('중복 출석 오류');
    // console.log('중복'); 
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