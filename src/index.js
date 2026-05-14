//getting start button and sound iniatalization
const sbtn = document.getElementById("START");
const selects = document.querySelectorAll("select");
const clickSound = new Audio("./assets/abc.mp3");
const explodeSound = new Audio("./assets/explode.mp3");
const bombSound = new Audio("./assets/bomb.mp3");
const teleportSound = new Audio("./assets/teleport.mp3");

//adding click sounds for each drop down and while changing the value
selects.forEach((select)=>{
    select.addEventListener("click",()=>{
        clickSound.currentTime = 0;
        clickSound.play();
    });
    select.addEventListener("change",()=>{
        clickSound.currentTime = 0;
        clickSound.play();
    });
});

//getting cells and players and defining what happens after clicking start
if(sbtn){
    sbtn.addEventListener("click",()=>{
        clickSound.currentTime = 0;
        clickSound.play();
        const cells = document.getElementById("cells").value;
        const players = document.getElementById("players").value;
        if(cells == "" || players == ""){
            alert("Select Proper Fields");
            return;
        }
        localStorage.setItem("Cells",cells);
        localStorage.setItem("Players",players);

        // Clear any previous game state so a new game starts fresh
        ["board","currentPlayer","alivePlayers","firstMove",
         "moveCount","bombUsed","teleportUsed","tt","pt"
        ].forEach(k => localStorage.removeItem(k));

        setTimeout(()=>{
            window.location.href = "./page2.html";
        },300);    
    });
}

// to create the board in page2 
let cells=localStorage.getItem("Cells");
let players=localStorage.getItem("Players");
const container = document.querySelector(".container");
let rows, cols;
if (cells == '36') {
    rows = 6;
    cols = 6;
    container.classList.add("size36");
}
else if (cells == '48') {
    rows = 8;
    cols = 6;
    container.classList.add("size48");
}
else if (cells == '64') {
    rows = 8;
    cols = 8;
    container.classList.add("size64");
}
for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
        const div = document.createElement("div");
        div.classList.add("cell");
        div.id = String(i + 1) + String(j + 1);
        container.appendChild(div);
    }
}

//adding the no of colors needed for no of players
let playerColors = [];
if(players == '2'){
    playerColors = ["red","blue"];
}
else if(players == '3'){
    playerColors = ["red","blue","yellow"];
}
else if(players == '4'){
    playerColors = ["red","blue","yellow","green"];
}
let currentPlayer = 0;//index of whose turn it is 
let alivePlayers = [...playerColors];//to get what colors are alive in game
let busy = false;//busy is used to stop players clicking while the cells are exploding (in future code it will be used)
let history = [];//to store the old board states for replay buttons to work
let historyIndex = -1;
let viewingHistory = false;//to check whether the player is veiwing history
let paused = false;// checks whether the game is paused


function updateBackground(){
    const color = alivePlayers[currentPlayer];//get the currrent players color
    const ptLabel = document.getElementById("pt-label");//to change the player time to reds time
    if(ptLabel){
        ptLabel.textContent =color.charAt(0).toUpperCase()+color.slice(1) +"'s Time";
    }
    if(color == "red"){
        document.body.style.backgroundColor ="rgba(255,0,0,0.70)";
    }
    else if(color == "blue"){
        document.body.style.backgroundColor =  "rgba(13,13,235,0.70)";
    }
    else if(color == "yellow"){
        document.body.style.backgroundColor = "rgba(255,217,2,0.7)";
    }
    else if(color == "green"){
        document.body.style.backgroundColor = "rgba(0,255,26,0.69)";
    }
    //if bomb or teleport button is selected what styles not selected what styles
    if(bombUsed[color]){
        bombBtn.style.opacity = "0.35";
        bombBtn.style.cursor = "not-allowed";
    }
    else{
        bombBtn.style.opacity = "1";
        bombBtn.style.cursor = "pointer";
    }
    if(teleportUsed[color]){
        teleportBtn.style.opacity = "0.35";
        teleportBtn.style.cursor = "not-allowed";
    }
    else{
        teleportBtn.style.opacity = "1";
        teleportBtn.style.cursor = "pointer";
    }
}
//to get the pause . next and replay button
const pauseBtn = document.getElementById("pauseBtn");
const backBtn = document.getElementById("backBtn");
const nextBtn = document.getElementById("nextBtn");
pauseBtn.addEventListener("click",()=>{
    clickSound.currentTime = 0;
    clickSound.play();
    paused = !paused;
    const icon = document.getElementById("pauseIcon");
    if(paused){
        icon.innerHTML = `
        <polygon points="8,5 19,12 8,19" fill="white"></polygon>
        `;
        document.body.style.filter = "brightness(0.7)";
    }
    else{
        icon.innerHTML = `
        <rect x="6" y="5" width="4" height="14" rx="1"></rect>
        <rect x="14" y="5" width="4" height="14" rx="1"></rect>
        `;
        document.body.style.filter = "brightness(1)";
    }

});
backBtn.addEventListener("click",()=>{
    clickSound.currentTime = 0;
    clickSound.play();
    if(historyIndex <= 0){
        return;
    }
    historyIndex--;
    loadState(historyIndex);//load the previous board state
    viewingHistory = true;
});
nextBtn.addEventListener("click",()=>{
    clickSound.currentTime = 0;
    clickSound.play();
    if(historyIndex < history.length - 1){
        historyIndex++;
        loadState(historyIndex);// load the next one if exists
    }
    if(historyIndex == history.length - 1){
        viewingHistory = false;
    }
});

//timer part for player time and total time 
let tt = 600;
let pt = 30;

function renderDots(cell,count,color){
    if(count == 1){
        cell.innerHTML = `<svg width="40" height="40"> <circle cx="20" cy="20" r="6" fill="${color}"/> </svg>`;
    } //to give a cell with one dot
    else if(count == 2){
        cell.innerHTML = `
        <svg width="40" height="40">
            <circle cx="12" cy="20" r="6" fill="${color}"/>
            <circle cx="28" cy="20" r="6" fill="${color}"/>
        </svg>`;
    }//to give a cell with two dot
    else if(count == 3){
        cell.innerHTML = `
        <svg width="40" height="40">
            <circle cx="20" cy="10" r="6" fill="${color}"/>
            <circle cx="10" cy="28" r="6" fill="${color}"/>
            <circle cx="30" cy="28" r="6" fill="${color}"/>
        </svg>`;
    }//to give a cell with three dot
    else if(count == 4){
        cell.innerHTML = `
        <svg width="40" height="40">
            <circle cx="12" cy="12" r="6" fill="${color}"/>
            <circle cx="28" cy="12" r="6" fill="${color}"/>
            <circle cx="12" cy="28" r="6" fill="${color}"/>
            <circle cx="28" cy="28" r="6" fill="${color}"/>
        </svg>`;
    }//to give a cell with four dot
    else{
        cell.innerHTML = "";
    }
}
const board = {};
//track how many explosion branches are still in flight
let pendingExplosions = 0;
let onExplosionsDone = null;

function goToWinners(){
    ["board","currentPlayer","alivePlayers","firstMove",
     "moveCount","bombUsed","teleportUsed","tt","pt"
    ].forEach(k => localStorage.removeItem(k));
    window.location.href = "./page3.html";
}//remove the data of the board last state and go to winners page

function saveState(){
    history = history.slice(0, historyIndex + 1);
    history.push(JSON.stringify(board));
    historyIndex = history.length - 1;
    updateHistoryButtons();

    //after reload the page2 also the game will stay
    localStorage.setItem("board", JSON.stringify(board));
    localStorage.setItem("currentPlayer", String(currentPlayer));
    localStorage.setItem("alivePlayers", JSON.stringify(alivePlayers));
    localStorage.setItem("firstMove", JSON.stringify(firstMove));
    localStorage.setItem("moveCount", JSON.stringify(moveCount));
    localStorage.setItem("bombUsed", JSON.stringify(bombUsed));
    localStorage.setItem("teleportUsed", JSON.stringify(teleportUsed));
    localStorage.setItem("tt", String(tt));
    localStorage.setItem("pt", String(pt));
}//to save each state

function loadState(index){
    const data = JSON.parse(history[index]);
    for(let id in data){
        board[id].count = data[id].count;
        board[id].color = data[id].color;
        renderDots(
            document.getElementById(id),
            board[id].count,
            board[id].color
        );
    }
    updateHistoryButtons();
}//to load each state

//during the other states the next and forward button should be disabled
function updateHistoryButtons(){
    if(historyIndex <= 0){
        backBtn.disabled = true;
    }
    else{
        backBtn.disabled = false;
    }
    if(historyIndex >= history.length - 1){
        nextBtn.disabled = true;
    }
    else{
        nextBtn.disabled = false;
    }
}

function addToCell(id,color){
    const currentCell = document.getElementById(id);
    let row = Number(id[0]);
    let col = Number(id[1]);
    let capacity;

    // to find whether it is a corner or edge or other cell and assign capacity for it
    if((row == 1 && col == 1) || (row == 1 && col == cols) || (row == rows && col == 1) || (row == rows && col == cols)){
        capacity = 2;
    }
    else if(row == 1 || row == rows || col == 1 || col == cols){
        capacity = 3;
    }
    else{
        capacity = 4;
    }
    // first move of the player to get max capacity-1 dots
    if(firstMove[color]){
        board[id].count = capacity - 1;
        board[id].color = color;
        renderDots(currentCell, board[id].count, color);//to get the how many dots what color anol
        firstMove[color] = false; //first move its over for that color
        return;
    }
    //not the first move
    board[id].count++;
    board[id].color = color;
    renderDots(currentCell, board[id].count, board[id].color);

    //if max capacity reaches for that cell
    if(board[id].count == capacity){
        explodeSound.currentTime = 0;
        explodeSound.play();
        board[id].count = 0;
        board[id].color = "";
        setTimeout(()=>{
            currentCell.innerHTML = "";
        },500);
        const neighbors=[]; //to get the neighbour cells
        if(row > 1){
            neighbors.push(String(row-1)+String(col));
        }
        if(row < rows){
            neighbors.push(String(row+1)+String(col));
        }
        if(col > 1){
            neighbors.push(String(row)+String(col-1));
        }
        if(col < cols){
            neighbors.push(String(row)+String(col+1));
        }
        // count each neighbor as a pending branch before scheduling
        pendingExplosions += neighbors.length;
        let onlyOneColor = true;

        // to check only one color is there in the entire board
        for(let key in board){
            if(board[key].color != "" && board[key].color != color){
                onlyOneColor = false;
                break;
            }
        }
        if(onlyOneColor){
            let scores = [];
            playerColors.forEach((clr)=>{
                let total = 0;
                for(let id in board){
                    if(board[id].color == clr){
                        total += board[id].count;
                    }
                }
                scores.push({
                    color:clr,
                    score:total
                });//scores for each color , we use the same set of codes in future part too
            });
            scores.sort((a,b)=>{
                return b.score - a.score;
            });
            localStorage.setItem("winner",color);
            localStorage.setItem("scores",JSON.stringify(scores));
            setTimeout(()=>{
                goToWinners();//winners page
            },500);
            return;
        }
        setTimeout(()=>{
            neighbors.forEach((neighborId)=>{
                addToCell(neighborId,color);
                // after processing each neighbor, reduce pending count
                // and fire the done callback only when ALL branches finish
                pendingExplosions--;
                if(pendingExplosions === 0 && onExplosionsDone){
                    const cb = onExplosionsDone;
                    onExplosionsDone = null;
                    setTimeout(cb, 0);
                }
            });
        },500);
    }
}
//does a player own a cell
function hasCells(color){
    for(let id in board){
        if(board[id].color == color){
            return true;
        }
    }
    return false;
}

function nextTurn(){
    currentPlayer++;
    if(currentPlayer >= alivePlayers.length){
        currentPlayer = 0;
    }
    updateBackground();
    busy = false;
}

//touch
const allCell = document.querySelectorAll(".cell");
let firstMove = {};
let moveCount = {};
let bombUsed = {};
let teleportActive = false;
let teleportSelected = null;
let teleportUsed = {};
playerColors.forEach((color)=>{
    teleportUsed[color] = false;
});
playerColors.forEach((color)=>{
    firstMove[color] = true;
});
playerColors.forEach((color)=>{
    moveCount[color] = 0;
});
playerColors.forEach((color)=>{
    bombUsed[color] = false;
});

//initialize board object from DOM cells
allCell.forEach((cell)=>{
    board[cell.id] = {
        count:0,
        color:""
    };
});

//restore saved game state if a refresh happened 
const savedBoard = localStorage.getItem("board");
if(savedBoard){
    const parsedBoard = JSON.parse(savedBoard);
    for(let id in parsedBoard){
        if(board[id]){
            board[id].count = parsedBoard[id].count;
            board[id].color = parsedBoard[id].color;
            renderDots(document.getElementById(id), board[id].count, board[id].color);
        }
    }
    currentPlayer = Number(localStorage.getItem("currentPlayer")) || 0;
    alivePlayers  = JSON.parse(localStorage.getItem("alivePlayers")) || [...playerColors];
    firstMove = JSON.parse(localStorage.getItem("firstMove"))  || firstMove;
    moveCount = JSON.parse(localStorage.getItem("moveCount"))  || moveCount;
    bombUsed  = JSON.parse(localStorage.getItem("bombUsed")) || bombUsed;
    teleportUsed = JSON.parse(localStorage.getItem("teleportUsed")) || teleportUsed;
    tt = Number(localStorage.getItem("tt")) || 600;
    pt = Number(localStorage.getItem("pt"))  || 30;
}

//attach click handlers after board is ready 
allCell.forEach((cell)=>{
    cell.addEventListener("click",()=>{
        if(paused){
            return;
        }
        if(viewingHistory){
            return;
        }
        if(busy){
            return;
        }
        let currentColor = alivePlayers[currentPlayer];
        if(teleportActive){
            if(board[cell.id].color == ""){
                return;
            }
            if(!teleportSelected){
                teleportSelected = cell.id;
                cell.style.background = "rgba(255,255,255,0.35)";
                return;
            }
            if(teleportSelected == cell.id){
                return;
            }
            teleportSound.currentTime = 0;
            teleportSound.play();

            // helper: get capacity for any cell id
            function getCapacity(cid){
                let r = Number(cid[0]);
                let c = Number(cid[1]);
                if((r==1&&c==1)||(r==1&&c==cols)||(r==rows&&c==1)||(r==rows&&c==cols)) return 2;
                if(r==1||r==rows||c==1||c==cols) return 3;
                return 4;
            }

            let idA = teleportSelected;
            let idB = cell.id;
            let cellA = board[idA];
            let cellB = board[idB];

            //do the swap
            let tempCount = cellA.count;
            let tempColor = cellA.color;
            cellA.count = cellB.count;
            cellA.color = cellB.color;
            cellB.count = tempCount;
            cellB.color = tempColor;
            document.getElementById(idA).style.background = "";
            teleportUsed[currentColor] = true;
            teleportBtn.style.opacity = "0.35";
            teleportBtn.style.cursor = "not-allowed";
            teleportBtn.style.outline = "none";
            teleportSelected = null;
            teleportActive = false;
            pt = 30;
            //check both cells for overflow after swap
            let capA = getCapacity(idA);
            let capB = getCapacity(idB);
            let needsExplosion = (cellA.count >= capA) || (cellB.count >= capB);

            if(!needsExplosion){
                //no explosion needed, just dots and finish turn
                renderDots(document.getElementById(idA), cellA.count, cellA.color);
                renderDots(document.getElementById(idB), cellB.count, cellB.color);
                saveState();
                nextTurn();
            } else {
                //render current state first
                renderDots(document.getElementById(idA), cellA.count, cellA.color);
                renderDots(document.getElementById(idB), cellB.count, cellB.color);
                busy = true;
                pendingExplosions = 0;
                onExplosionsDone = null;

                //force explode a cell by setting its count to capacity so addToCell triggers explosion
                function forceExplode(cid, capForCell){
                    let bc = board[cid];
                    if(bc.count >= capForCell){
                        //set to one below capacity then call addToCell which will push it over
                        bc.count = capForCell - 1;
                        addToCell(cid, bc.color);
                    }
                }
                if(cellA.count >= capA) forceExplode(idA, capA);
                if(cellB.count >= capB) forceExplode(idB, capB);
                function finishTeleportTurn(){
                    alivePlayers = alivePlayers.filter((color)=>{
                        if(firstMove[color]) return true;
                        return hasCells(color);
                    });
                    if(alivePlayers.length == 1){
                        let everyonePlayed = true;
                        playerColors.forEach((color)=>{ if(firstMove[color]) everyonePlayed = false; });
                        if(everyonePlayed){
                            let scores = [];
                            playerColors.forEach((color)=>{
                                let total = 0;
                                for(let id in board){ if(board[id].color==color) total+=board[id].count; }
                                scores.push({color,score:total});
                            });
                            scores.sort((a,b)=>b.score-a.score);
                            localStorage.setItem("scores",JSON.stringify(scores));
                            localStorage.setItem("winner",alivePlayers[0]);
                            goToWinners();
                            return;
                        }
                    }
                    saveState();
                    currentPlayer++;
                    if(currentPlayer >= alivePlayers.length) currentPlayer = 0;
                    updateBackground();
                    busy = false;
                }
                if(pendingExplosions > 0){
                    onExplosionsDone = finishTeleportTurn;
                } else {
                    finishTeleportTurn();
                }
            }
            return;
        }
        if(bombActive){
            let row = Number(cell.id[0]);
            let col = Number(cell.id[1]);
            const targets = [];
            targets.push(cell.id);
            if(row > 1 && col > 1){
                targets.push(String(row-1)+String(col-1));
            }
            if(row > 1 && col < cols){
                targets.push(String(row-1)+String(col+1));
            }
            if(row < rows && col > 1){
                targets.push(String(row+1)+String(col-1));
            }   
            if(row < rows && col < cols){
                targets.push(String(row+1)+String(col+1));
            }
            targets.forEach((id)=>{
                board[id].count = 0;
                board[id].color = "";
                document.getElementById(id).innerHTML = "";
            });
            bombSound.currentTime = 0;
            bombSound.play();
            bombActive = false;
            bombBtn.style.outline = "none";
            bombBtn.style.transform = "scale(1)";
            bombUsed[currentColor] = true;
            bombBtn.style.opacity = "0.35";
            bombBtn.style.cursor = "not-allowed";
            bombBtn.style.outline = "none";
            bombBtn.style.transform = "scale(1)";
            pt = 30;
            currentPlayer++;
            alivePlayers = alivePlayers.filter((color)=>{
                if(firstMove[color]){
                    return true;
                }
                return hasCells(color);
            });
            if(alivePlayers.length == 1){
                    let scores = [];
                    playerColors.forEach((color)=>{
                        let total = 0;
                        for(let id in board){
                            if(board[id].color == color){
                                    total += board[id].count;
                            }
                        }
                        scores.push({
                            color:color,
                            score:total
                        });
                    });
                    scores.sort((a,b)=>{
                    return b.score - a.score;
                    });
                    localStorage.setItem("scores",JSON.stringify(scores));
                    localStorage.setItem("winner",alivePlayers[0]);
                    goToWinners();
                    return;
            }
            if(currentPlayer >= alivePlayers.length){
                currentPlayer = 0;
            }
            saveState();
            updateBackground();
            busy = false;
            return;
        }
        //on first move: only allow empty cells
        //after first move: only allow own cells 
        if(firstMove[currentColor]){
            if(board[cell.id].color != ""){
                return;
            }
        } else {
            if(board[cell.id].color != currentColor){
                return;
            }
        }
        busy = true;
        pt = 30;
        clickSound.currentTime = 0;
        clickSound.play();
        //reset explosion tracking before each click
        pendingExplosions = 0;
        onExplosionsDone = null;

        addToCell(cell.id,currentColor);
        moveCount[currentColor]++;

        function finishTurn(){
            alivePlayers = alivePlayers.filter((color)=>{
                if(firstMove[color]){
                    return true;
                }
                return hasCells(color);
            });
            if(alivePlayers.length == 1){
                let everyonePlayed = true;
                playerColors.forEach((color)=>{
                    if(firstMove[color]){
                        everyonePlayed = false;
                    }
                });
                if(everyonePlayed){
                    let scores = [];
                    playerColors.forEach((color)=>{
                        let total = 0;
                        for(let id in board){
                             if(board[id].color == color){
                                total += board[id].count;
                            }
                            }
                        scores.push({ color:color,score:total });
                    });
                scores.sort((a,b)=>{
                    return b.score - a.score;
                });
                localStorage.setItem( "scores", JSON.stringify(scores));
                localStorage.setItem( "winner", alivePlayers[0]);
                goToWinners();
                 }
            }
            saveState();
            currentPlayer++;
            if(currentPlayer >= alivePlayers.length){
                currentPlayer = 0;
            }
            updateBackground();
            busy = false;
        }
        if(pendingExplosions > 0){
            onExplosionsDone = finishTurn;
        }
        else{
            finishTurn();
        }
    });
});

saveState();
updateHistoryButtons();
setTimeout(updateBackground,100);

//bomb and teleport button logic
let bombActive = false;
const bombBtn = document.getElementById("bombBtn");
const teleportBtn = document.getElementById("teleportBtn");
bombBtn.addEventListener("click",()=>{
    clickSound.currentTime = 0;
    clickSound.play();
     let currentColor = alivePlayers[currentPlayer];
     let everyonePlayedTwice = true;
    playerColors.forEach((color)=>{
        if(moveCount[color] < 2){
            everyonePlayedTwice = false;
        }
    });
    if(!everyonePlayedTwice){
        return;
    }
     if(bombUsed[currentColor]){
        return;
     }
    bombActive = !bombActive;
    if(bombActive){
        bombBtn.style.outline = "4px solid white";
        bombBtn.style.transform = "scale(1.08)";
    }
    else{
        bombBtn.style.outline = "none";
        bombBtn.style.transform = "scale(1)";
    }
});
teleportBtn.addEventListener("click",()=>{
    clickSound.currentTime = 0;
    clickSound.play();
    let currentColor = alivePlayers[currentPlayer];
    if(teleportUsed[currentColor]){
        return;
    }
    teleportActive = !teleportActive;
    if(teleportActive){
        teleportBtn.style.outline = "4px solid white";
    }
    else{
        teleportBtn.style.outline = "none";
        if(teleportSelected){
            document.getElementById(teleportSelected).style.background = "";
        }
        teleportSelected = null;
    }
});

//Timer parts 
const timer = document.getElementById("tt");
const ptimer = document.getElementById("pt");
if(timer && ptimer){
    const countdown = setInterval(() => {
    if(paused){
        return;
        }
    let minutes = Math.floor(tt / 60);
    let seconds = tt % 60;
    seconds = seconds < 10 ? "0" + seconds : seconds;
    minutes = minutes < 10 ? "0" + minutes : minutes;
    timer.textContent = minutes + ":" + seconds;
    tt--;
    ptimer.textContent = pt;
    pt--;

    // Save timers every tick so refresh restores the live countdown
    localStorage.setItem("tt", String(tt));
    localStorage.setItem("pt", String(pt));

    if(tt < 0){
        clearInterval(countdown);
        timer.textContent = "00:00";
        let maxScore = -1;
        let winner = "";
        let scores = [];
        playerColors.forEach((color)=>{
            let total = 0;
            for(let id in board){
                if(board[id].color == color){
                    total += board[id].count;
                }
            }
            scores.push({
                color:color,
                score:total
            });
            if(total > maxScore){
                maxScore = total;
                winner = color;
            }
        });
        scores.sort((a,b)=>{
            return b.score - a.score;
        });
        localStorage.setItem("winner",winner);
        localStorage.setItem("scores",JSON.stringify(scores));
        goToWinners();
    }
    if(pt < 0){
        ptimer.textContent = "0";
        currentPlayer++;
        if(currentPlayer >= alivePlayers.length){
            currentPlayer = 0;
        }
        pt = 30;
        saveState();
        updateBackground();
    }
},1000);
}
