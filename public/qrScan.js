var video = document.createElement("video");
var isScanning = false;
var canvasElement = document.getElementById("canvas");
var canvas = canvasElement.getContext("2d");
var loadingMessage = document.getElementById("loadingMessage");
var outputData = document.getElementById("outputData");
var strTemp = "";
var mytimerId;
//현재 페이지 경로
const currentPath = window.location.pathname;
//화면에 표시될 현재 시간
var now_time = document.getElementById("now_time");
var status_msg = document.getElementById("status");
const msg_class = document.getElementById('msg_class');

//바코드 인식 네모 선
function drawLine(begin, end, color) {
  canvas.beginPath();
  canvas.moveTo(begin.x, begin.y);
  canvas.lineTo(end.x, end.y);
  canvas.lineWidth = 4;
  canvas.strokeStyle = color;
  canvas.stroke();
}

// Use facingMode: environment to attemt to get the front camera on phones
navigator.mediaDevices.getUserMedia({
  video: { facingMode: "environment" }
}).then(function (stream) {
  video.srcObject = stream;
  video.setAttribute("playsinline", true); // required to tell iOS safari we don't want fullscreen
  video.play();
  isScanning = true;
  requestAnimationFrame(tick);
});

function tick() {
  loadingMessage.innerText = "⌛ Loading video..."
  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    loadingMessage.hidden = true;
    canvasElement.hidden = false;

    canvasElement.height = video.videoHeight;
    canvasElement.width = video.videoWidth;
    canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
    var imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);
    //QR로 읽어들인 코드
    var code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "dontInvert",
    });

    //QR코드 인식 여부 판단
    if (code) {
      isScanning = false;
      strTemp = code.data;

      //인식한 문자열을 구조체로 저장
      let str = code.data;

      var qrdata = {
        check: str.slice(0, 2),       //올바른 QR코드 형식인지를 판단
        hakbun: str.slice(8, 17),     //학번
        date_y: str.slice(17, 21),    //날짜 - 연
        date_m: str.slice(21, 23),    //날짜 - 월
        date_d: str.slice(23, 25),    //날짜 - 일
        time_h: str.slice(25, 27),    //시간 - 시
        time_m: str.slice(27, 29),    //시간 - 분
        time_s: str.slice(29, 31)     //시간 - 초
      }

      if (qrdata.check == 'PK') {
        //현재 페이지가 강의 페이지인 경우 -> 출석
        if (currentPath.startsWith('/course')) {
          //출석체크 - 데이터 삽입
          axios.post('/insertData', { qrdata })
            .then(function (response) {
              console.log(response.data);
            })
            .catch(function (error) {
              console.error(error);
            });
        } else if (currentPath.startsWith('/search') || currentPath=='/') {
          location.href = "/search/" + qrdata.hakbun;
        }
      } else {
        setCookie('status', 'X');
        console.log('x');
      }



      ///쿠키 값 읽어서?css 변경
      drawLine(code.location.topLeftCorner, code.location.topRightCorner, "#FF3B58");
      drawLine(code.location.topRightCorner, code.location.bottomRightCorner, "#FF3B58");
      drawLine(code.location.bottomRightCorner, code.location.bottomLeftCorner, "#FF3B58");
      drawLine(code.location.bottomLeftCorner, code.location.topLeftCorner, "#FF3B58");
      if (currentPath.startsWith('/course')) {
      outputData.hidden = false;
      outputData.innerText = code.data;}
    } else {
      if (currentPath.startsWith('/course')) {
       outputData.hidden = true;}
    }
  }
  if (isScanning) {
    requestAnimationFrame(tick);
  } else {
    //멈춤 시간
    mytimerId = setInterval(myStopFunction, 2000);

  }
}

//쿠키 값 읽어오는 함수 -> 강의 정보 표시
function getCookie(cname) {

  var name = cname + "=";

  var decodedCookie = decodeURIComponent(document.cookie);

  var ca = decodedCookie.split(';');

  for (var i = 0; i < ca.length; i++) {

    var c = ca[i];

    while (c.charAt(0) == ' ') {

      c = c.substring(1);

    }

    if (c.indexOf(name) == 0) {

      return c.substring(name.length, c.length);

    }

  }

  return "";

}

function setCookie(name, value) {
  const date = new Date();
  date.setTime(date.getTime() + 2 * 1000); // 밀리초 단위로 계산하기 위해 1000을 곱합니다.
  const expires = 'expires=' + date.toUTCString();
  document.cookie = name + '=' + value + ';' + expires + ';path=/';
}

//t시간 지연 함수
function myStopFunction() {
  isScanning = true;
  clearInterval(mytimerId);
  clearData();
  requestAnimationFrame(tick);
}
function clearData() {
  strTemp = "";
}

//현재 시간
function clock() {
  function padZero(number) {
    return number < 10 ? "0" + number : number;
  }
  const week = ['일', '월', '화', '수', '목', '금', '토'];
  let today = new Date(); /* 날짜와 시간 */
  let year = today.getFullYear();
  let month = padZero(today.getMonth() + 1);
  let date = padZero(today.getDate()); // 일
  let day = today.getDay();
  let hour = padZero(today.getHours());
  let minutes = padZero(today.getMinutes());
  let seconds = padZero(today.getSeconds());
  //[2020-20-20 00;00]
  now_time.innerHTML = year + "/" + month + "/" + date + "(" + week[day] + ") " + hour + ":" + minutes + ":" + seconds; /* html에 출력 */


  //상태 메세지
  //수강X
  if (decodeURIComponent(getCookie('status')) == 'ERROR') {
    msg_class.classList.remove('alert-secondary');
    msg_class.classList.add('alert-danger');
    status_msg.innerHTML = "해당 과목에 등록되지 않은 QR입니다";
  } else if (decodeURIComponent(getCookie('status')) == 'PRESENT') {
    msg_class.classList.remove('alert-secondary');
    msg_class.classList.add('alert-success');
    status_msg.innerHTML = "정상적으로 출석되었습니다";
  } else if (decodeURIComponent(getCookie('status')) == 'DUPLICATE') {
    msg_class.classList.remove('alert-secondary');
    msg_class.classList.add('alert-warning');
    status_msg.innerHTML = "이미 출석된 QR입니다";
  }else if (decodeURIComponent(getCookie('status')) == 'LATE') {
    msg_class.classList.remove('alert-secondary');
    msg_class.classList.add('alert-warning');
    status_msg.innerHTML = "지각입니다";
  }else if (decodeURIComponent(getCookie('status')) == 'ABSENT') {
    msg_class.classList.remove('alert-secondary');
    msg_class.classList.add('alert-info');
    status_msg.innerHTML = "해당 과목의 출석 시간이 아닙니다";
  }else if (decodeURIComponent(getCookie('status')) == 'X') {
    msg_class.classList.remove('alert-secondary');
    msg_class.classList.add('alert-danger');
    status_msg.innerHTML = "잘못된 QR입니다";
  }else {
    msg_class.classList.remove('alert-success');
    msg_class.classList.remove('alert-warning');
    msg_class.classList.remove('alert-danger');
    msg_class.classList.remove('alert-info');
    msg_class.classList.add('alert-secondary');
    status_msg.innerHTML = "QR코드를 인식해 주세요";
  }
}
if (currentPath.startsWith('/course')) {
  clock();
  setInterval(clock, 1000);
}