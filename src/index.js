var express = require("express");
var app = require("express")();
var http = require("http").createServer(app);
var io = require("socket.io")(http);
var fs = require("fs");

const fsRead = () => {
  let comeOutNumber = fs
    .readFileSync("db/comeOutNumber.txt", {
      encoding: "utf8",
      flag: "r"
    })
    .split("\n");
  comeOutNumber.splice(comeOutNumber.length - 1, 1);
  return comeOutNumber;
};

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/index.html");
});
app.get("/host", function (req, res) {
  res.sendFile(__dirname + "/index.html");
});

app.use(express.static("public"));

io.on("connection", function (socket) {
  console.log("a user connected");
  io.emit("readData", { value: fsRead() });
  socket.on("roulette start", function (num) {
    console.log("roulette start", num);
    io.emit("roulette start", num);
  });
  // データ保存
  socket.on("save", function (data) {
    console.log("save", data);
    let str = `${data}\n`;
    fs.writeFile("db/comeOutNumber.txt", str, { flag: "a" }, (err) => {
      if (err) console.log(err);
    });
    let sendArr = fsRead();
    sendArr.push(String(data));
    io.emit("readData", { value: sendArr });
  });
  // リセット
  socket.on("reset", function (data) {
    fs.writeFile("db/comeOutNumber.txt", "", (err) => {
      if (err) console.log(err);
    });
    let sendArr = [data];
    sendArr.push("reset");
    io.emit("readData", { value: sendArr });
  });
});

http.listen(3000, function () {
  console.log("listening on *:3000");
});
