const oracledb = require('oracledb');

async function run() {
  let connection;

  try {
    // Oracle DB에 연결
    connection = await oracledb.getConnection({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECT_STRING
    });

    console.log('Oracle DB에 연결되었습니다.');

    // student 테이블 생성 쿼리
    const createTableQuery = `
      CREATE TABLE student (
        id NUMBER,
        name VARCHAR2(100),
        age NUMBER
      )
    `;

    // student 테이블 생성
    await connection.execute(createTableQuery);
    console.log('student 테이블이 성공적으로 생성되었습니다.');

  } catch (err) {
    console.error('오류:', err);
  } finally {
    // 연결 종료
    if (connection) {
      try {
        await connection.close();
        console.log('Oracle DB 연결이 닫혔습니다.');
      } catch (err) {
        console.error(err);
      }
    }
  }
}

run();
