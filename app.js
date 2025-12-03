require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//뷰 엔진 설정
app.set("view engine", "ejs");
app.set("views", "views");

//라우트 사용 설정
app.use("/", require("./routes/mainRoutes"));

//정적 파일 및 에셋 파일 사용
app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.listen(port, () => {
    console.log(`${port}번 포트에서 서버 실행 중`);
});