const gameOverSound = new Audio("./assets/game over.mp3");
gameOverSound.currentTime = 0;
gameOverSound.play();
const winnerText = document.getElementById("winnerText");
if(winnerText){
    const winner =
    localStorage.getItem("winner");
    const scores =
    JSON.parse(localStorage.getItem("scores"));
    document.getElementById("winnerText").textContent = winner.toUpperCase() + " WINS";
    document.getElementById("bgWinner").textContent = winner.toUpperCase();
    const scoreBoard =
    document.getElementById("scoreBoard");
    scores.forEach((item)=>{
        const div = document.createElement("div");
        div.classList.add("score");
        div.style.background = item.color;
        div.textContent =item.color.toUpperCase() + " : " +item.score;
        scoreBoard.appendChild(div);
    });
    let t = 5;
    const count = document.getElementById("count");
    count.textContent = "Returning Home In " + t;
    const timer =
    setInterval(()=>{
        t--;
        count.textContent = "Returning Home In " + t;
        if(t <= 0){
            clearInterval(timer);
            window.location.href ="./index.html";
        }
    },1000);
}