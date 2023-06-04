var video = document.createElement("video");
var isScanning = false;
var canvasElement = document.getElementById("canvas");
var canvas = canvasElement.getContext("2d");
var loadingMessage = document.getElementById("loadingMessage");
var outputData = document.getElementById("outputData");
var strTemp = "";
var mytimerId;
//화면에 표시될 현재 시간
var now_time = document.getElementById("now_time");

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
    video: { facingMode: "environment" } }).then(function (stream) {
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
            let splitStr = [...str];
            var qrdata = {
                check: str.slice(0, 2),       //올바른 QR코드 형식인지를 판단
                hakbun: str.slice(8, 17),     //학번
                date_y: str.slice(17, 21),    //날짜 - 연도
                date_m: str.slice(21, 23),    //날짜 - 월
                date_d: str.slice(23, 25),    //날짜 - 일
                time_h: str.slice(25, 27),    //시간 - 시
                time_m: str.slice(27, 29)    //시간 - 분
            }

            console.log('check: ' + qrdata.check);
            console.log('학번: ' + qrdata.hakbun);

            //출석체크 - 데이터 삽입
            axios.post('/insertData', {qrdata})
            .then(function (response) {
              console.log(response.data);
            })
            .catch(function (error) {
              console.error(error);
            });
            
            drawLine(code.location.topLeftCorner, code.location.topRightCorner, "#FF3B58");
            drawLine(code.location.topRightCorner, code.location.bottomRightCorner, "#FF3B58");
            drawLine(code.location.bottomRightCorner, code.location.bottomLeftCorner, "#FF3B58");
            drawLine(code.location.bottomLeftCorner, code.location.topLeftCorner, "#FF3B58");
            outputData.hidden = false;
            outputData.innerText = code.data;
        } else {
            outputData.hidden = true;
        }
    }
    if (isScanning) {
        requestAnimationFrame(tick);
      } else {
        //멈춤 시간
        mytimerId = setInterval(myStopFunction, 2000);

      }
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
    now_time.innerHTML = year + "/" + month + "/" + date + "("+week[day]+") " + hour + ":" + minutes + ":" + seconds; /* html에 출력 */
}
clock();
setInterval(clock, 1000);