const url = window.location.href;
let role = url.slice(url.lastIndexOf("/") + 1) === "host" ? "host" : "guest";
let hostUrl = `${url.slice(0, url.lastIndexOf("/") + 1)}host`;
let guestUrl = `${url.slice(0, url.lastIndexOf("/") + 1)}`;

console.log(`role: ${role}`);
console.log(`host-url: ${hostUrl}`); // ゲストのURL
console.log(`guest-url: ${guestUrl}`); // ホストのURL

(function (role) {
  const createArr = () => {
    let arr = [];
    for (let i = 1; i <= 75; i++) {
      arr.push(i);
    }
    return arr;
  };
  const startRoulette = (num) => {
    // dom 操作
    domOperation("init");
    checkListState();
    roulette = setInterval(changeNum, 100);
    setTimeout(() => {
      clearInterval(roulette);
      dom.numberDisplay.textContent = num;
      let out = Number(dom.numberDisplay.textContent);
      // dom 操作
      domOperation("shuffle");
      comeOutNum.push(out);
      // データ保存
      if (isHost === "host") {
        socket.emit("save", out);
      }
      // numArrを更新
      numArr.splice(numArr.indexOf(out), 1);
      checkComeOutNum();
      showHistory();
      if (numArr.length === 0) {
        dom.startBtn.style.display = "none";
      }
    }, 4000);
  };
  const resetBingo = () => {
    numArr = createArr();
    comeOutNum = [];
    // keyを初期化
    localStorage.setItem("comeOutNum", comeOutNum);
    // dom 操作
    domOperation("reset");
  };
  // dom操作
  const domOperation = (instruction) => {
    switch (instruction) {
      case "init":
        dom.numberDisplay.classList.remove("text-scale");
        dom.startBtn.classList.add("shuffle");
        dom.resetBtn.classList.add("shuffle");
        dom.numberList.classList.add("shuffle");
        dom.listBtn.classList.add("shuffle");
        dom.history.innerHTML = "";
        break;
      case "shuffle":
        let num = Number(dom.numberDisplay.textContent);
        let columnName = document.createElement("span");
        columnName.className = "column-name";
        dom.numberDisplay.dataset.num = num;
        columnName.textContent = setColumnName(num);
        dom.numberDisplay.appendChild(columnName);
        dom.numberDisplay.classList.add("text-scale");
        dom.startBtn.classList.remove("shuffle");
        dom.resetBtn.classList.remove("shuffle");
        dom.numberList.classList.remove("shuffle");
        dom.listBtn.classList.remove("shuffle");
        dom.endText.classList.add("shuffle");
        break;
      case "reset":
        let numberList = Array.from(dom.numberList.children);
        dom.numberDisplay.textContent = "Bingo";
        dom.numberDisplay.dataset.num = "";
        dom.numberDisplay.classList.remove("text-scale");
        dom.listBtn.classList.remove("bt-menu-open");
        dom.numberList.style.transform = "translateX(calc(-100% - 10px))";
        numberList.forEach((el, i) => {
          dom.numberList.children[i].classList.remove("out");
        });
        dom.history.innerHTML = "";
        dom.endText.classList.add("shuffle");
        break;
      default:
    }
  };
  const changeNum = () => {
    dom.numberDisplay.textContent = Math.floor(Math.random() * 75);
  };
  // 出た数字を
  const checkComeOutNum = () => {
    comeOutNum.forEach((el) => {
      dom.numberList.children[el - 1].classList.add("out");
    });
  };
  const showHistory = () => {
    let historyArr = comeOutNum.slice(-5).reverse();
    for (let i = 0; i < historyArr.length; i++) {
      let li = document.createElement("li");
      li.innerHTML = `<p>${
        comeOutNum.length - i
      }回目:</p><span style="position: absolute;left: 65px;">${setColumnName(
        historyArr[i]
      )}</span><span>${historyArr[i]}</span>`;
      dom.history.appendChild(li);
    }
  };
  const checkListState = () => {
    if (dom.listBtn.classList.length === 1) {
      dom.listBtn.classList.toggle("bt-menu-open");
      dom.numberList.style.transform = "translateX(0)";
    } else {
      dom.listBtn.classList.remove("bt-menu-open");
      dom.numberList.style.transform = "translateX(calc(-100% - 10px))";
    }
  };
  const setColumnName = (num) => {
    let word;
    if (num >= 1 && num <= 15) {
      word = "B";
    } else if (num >= 16 && num <= 30) {
      word = "I";
    } else if (num >= 31 && num <= 45) {
      word = "N";
    } else if (num >= 46 && num <= 60) {
      word = "G";
    } else if (num >= 61 && num <= 75) {
      word = "O";
    }
    return word;
  };
  // numArrの更新
  const updateNumArr = () => {
    for (let i = 0; i < comeOutNum.length; i++) {
      for (let j = 0; j < numArr.length; j++) {
        if (numArr[j] === comeOutNum[i]) {
          numArr.splice(j, 1);
        }
      }
    }
  };

  let roulette;
  let isHost = role === "host" ? "host" : "guest";
  let socket = io();
  let numArr = createArr();

  const dom = {
    body: document.querySelector("body"),
    numberDisplay: document.querySelector(".number-display span"),
    numberList: document.querySelector(".number-list"),
    resetBtn: document.querySelector(".reset"),
    startBtn: document.querySelector(".start"),
    history: document.querySelector(".history"),
    endText: document.querySelector(".end-text"),
    listBtn: document.querySelector(".bt-menu-trigger")
  };

  // ゲスト側のスタートボタンとリセットボタンを削除
  if (isHost !== "host") {
    dom.startBtn.remove();
    dom.resetBtn.remove();
    dom.history.style = "top: 20px";
  }

  // データ読み込み
  socket.on("readData", function (data) {
    // データを受け取りローカルストレージに保存
    let arr = data.value;
    localStorage.setItem("comeOutNum", arr);
    // リセット時の処理
    if (arr[1] === "reset") {
      resetBingo();
    }
    // ビンゴが終了したときの処理
    if (localStorage.getItem("comeOutNum").split(",").length === 75) {
      dom.startBtn.classList.add("shuffle");
      dom.endText.classList.remove("shuffle");
    }
  });

  // keyを取得
  let comeOutNum = localStorage.getItem("comeOutNum")
    ? localStorage
        .getItem("comeOutNum")
        .split(",")
        .map((el) => Number(el))
    : [];

  if (localStorage.getItem("comeOutNum") !== "") {
    updateNumArr();
    // 履歴表示
    dom.numberDisplay.textContent = comeOutNum[comeOutNum.length - 1];
    let columnName = document.createElement("span");
    columnName.className = "column-name";
    dom.numberDisplay.dataset.num = Number(comeOutNum[comeOutNum.length - 1]);
    columnName.textContent = setColumnName(
      Number(comeOutNum[comeOutNum.length - 1])
    );
    dom.numberDisplay.appendChild(columnName);
    showHistory();
  } else {
    dom.numberDisplay.textContent = "Bingo";
  }

  socket.on("roulette start", function (num) {
    startRoulette(num);
  });

  socket.on("reset", function () {
    resetBingo();
  });

  checkComeOutNum();

  // click event
  dom.startBtn.addEventListener("click", function () {
    let randomNumber = Math.floor(Math.random() * numArr.length);
    socket.emit("roulette start", numArr[randomNumber]);
  });
  dom.resetBtn.addEventListener("click", function () {
    if (confirm("ビンゴをリセットしますか？")) {
      socket.emit("reset", "");
      resetBingo();
    }
  });
  dom.listBtn.addEventListener("click", function () {
    checkListState();
  });
})(role);
