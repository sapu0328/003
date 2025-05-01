// File: /ai-chat-webapp/ai-chat-webapp/src/app.js

const apiKey = 'YOUR_GEMINI_API_KEY'; // 請填入你的 Gemini API key
const messagesContainer = document.getElementById('messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const canvas = document.getElementById('raceCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('start-btn');
canvas.width = 600;
canvas.height = 400;

// 賽道彎道資料
const turns = [
    { x: 100, y: 200, radius: 60, name: "1號彎" },
    { x: 300, y: 100, radius: 60, name: "2號彎" },
    { x: 500, y: 200, radius: 60, name: "3號彎" },
    { x: 300, y: 300, radius: 60, name: "4號彎" }
];

// 玩家與AI初始狀態
let player = { x: 80, y: 200, angle: 0, speed: 0, color: "#1976d2", turnTimes: [] };
let ai = { x: 80, y: 230, angle: 0, speed: 0, color: "#d32f2f", turnTimes: [] };
let currentTurn = 0;
let aiCurrentTurn = 0;
let startTime = null;
let aiStartTime = null;
let finished = false;

sendButton.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
});

function sendMessage() {
    const message = userInput.value;
    if (message.trim() === '') return;

    appendMessage('You: ' + message);
    userInput.value = '';

    fetchResponseFromAI(message);
}

function appendMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

async function fetchResponseFromAI(message) {
    try {
        conversationHistory.push({
            role: "user",
            parts: [{ text: message }]
        });

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: conversationHistory
            })
        });

        const data = await response.json();
        
        if (data.candidates && data.candidates[0].content) {
            const aiResponse = data.candidates[0].content.parts[0].text;
            conversationHistory.push({
                role: "model",
                parts: [{ text: aiResponse }]
            });
            appendMessage('AI: ' + aiResponse);
        } else {
            throw new Error('Invalid response format');
        }
    } catch (error) {
        console.error('Error fetching response from AI:', error);
        appendMessage('AI: Sorry, I could not process your request.');
    }
}

// 畫賽道
function drawTrack() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#888";
    ctx.lineWidth = 20;
    ctx.beginPath();
    ctx.moveTo(80, 200);
    for (const turn of turns) {
        ctx.arcTo(turn.x, turn.y, turn.x, turn.y, turn.radius);
    }
    ctx.lineTo(80, 200);
    ctx.stroke();
    // 畫彎道標記
    ctx.fillStyle = "#222";
    ctx.font = "16px Arial";
    turns.forEach((turn, idx) => {
        ctx.fillText(turn.name, turn.x - 20, turn.y - 30);
    });
}

// 畫車
function drawCar(car) {
    ctx.save();
    ctx.translate(car.x, car.y);
    ctx.rotate(car.angle);
    ctx.fillStyle = car.color;
    ctx.fillRect(-10, -7, 20, 14);
    ctx.restore();
}

// 玩家操作
document.addEventListener('keydown', (e) => {
    if (finished) return;
    if (e.key === 'ArrowUp') player.speed = Math.min(player.speed + 0.2, 3);
    if (e.key === 'ArrowDown') player.speed = Math.max(player.speed - 0.2, 0);
    if (e.key === 'ArrowLeft') player.angle -= 0.08;
    if (e.key === 'ArrowRight') player.angle += 0.08;
});

// AI自動駕駛
function aiDrive() {
    if (aiCurrentTurn >= turns.length) return;
    const turn = turns[aiCurrentTurn];
    const dx = turn.x - ai.x;
    const dy = turn.y - ai.y;
    const targetAngle = Math.atan2(dy, dx);
    let diff = targetAngle - ai.angle;
    if (diff > Math.PI) diff -= 2 * Math.PI;
    if (diff < -Math.PI) diff += 2 * Math.PI;
    ai.angle += diff * 0.1;
    ai.speed = 2.5;
}

// 判斷是否進入彎道
function checkTurn(car, turnIdx) {
    if (turnIdx >= turns.length) return false;
    const turn = turns[turnIdx];
    const dx = car.x - turn.x;
    const dy = car.y - turn.y;
    return Math.sqrt(dx * dx + dy * dy) < turn.radius;
}

// 遊戲主迴圈
function gameLoop() {
    drawTrack();
    drawCar(player);
    drawCar(ai);

    // 玩家移動
    player.x += Math.cos(player.angle) * player.speed;
    player.y += Math.sin(player.angle) * player.speed;

    // AI移動
    aiDrive();
    ai.x += Math.cos(ai.angle) * ai.speed;
    ai.y += Math.sin(ai.angle) * ai.speed;

    // 玩家過彎計時
    if (!finished && checkTurn(player, currentTurn)) {
        if (!player.turnTimes[currentTurn]) {
            player.turnTimes[currentTurn] = Date.now() - (startTime || Date.now());
            currentTurn++;
            if (currentTurn === turns.length) {
                finished = true;
                showResult();
            }
        }
    }
    // AI過彎計時
    if (!finished && checkTurn(ai, aiCurrentTurn)) {
        if (!ai.turnTimes[aiCurrentTurn]) {
            ai.turnTimes[aiCurrentTurn] = Date.now() - (aiStartTime || Date.now());
            aiCurrentTurn++;
        }
    }

    if (!finished) requestAnimationFrame(gameLoop);
}

// 顯示結果並請AI分析
function showResult() {
    exitFullscreen();
    canvas.width = 600;
    canvas.height = 400;
    let msg = "🏁 遊戲結束！<br>你的每彎耗時：<br>";
    player.turnTimes.forEach((t, i) => {
        msg += `${turns[i].name}：${(t / 1000).toFixed(2)} 秒<br>`;
    });
    msg += "<br>AI每彎耗時：<br>";
    ai.turnTimes.forEach((t, i) => {
        msg += `${turns[i].name}：${(t / 1000).toFixed(2)} 秒<br>`;
    });
    messagesContainer.innerHTML = msg + "<br>分析生成中...";
    showStartBtn();
    analyzePerformance();
}

// 呼叫 Gemini API 分析
async function analyzePerformance() {
    // 組合分析 prompt
    let prompt = "請以專業賽車教練角度，針對以下彎道表現，分析玩家每一彎的缺點與改進建議：\n";
    player.turnTimes.forEach((t, i) => {
        prompt += `${turns[i].name}：${(t / 1000).toFixed(2)} 秒\n`;
    });
    prompt += "請針對每個彎道給出具體建議，並指出明顯的駕駛缺點。";

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ role: "user", parts: [{ text: prompt }] }]
                })
            }
        );
        const data = await response.json();
        if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts[0].text) {
            messagesContainer.innerHTML += "<br><b>AI 賽道分析：</b><br>" + data.candidates[0].content.parts[0].text.replace(/\n/g, "<br>");
        } else {
            messagesContainer.innerHTML += "<br>AI 無法分析，請再試一次。";
        }
    } catch (e) {
        messagesContainer.innerHTML += "<br>分析失敗，請檢查網路或 API Key。";
    }
}

// 進入全螢幕
function enterFullscreen() {
    if (canvas.requestFullscreen) {
        canvas.requestFullscreen();
    } else if (canvas.webkitRequestFullscreen) {
        canvas.webkitRequestFullscreen();
    } else if (canvas.msRequestFullscreen) {
        canvas.msRequestFullscreen();
    }
}

// 離開全螢幕
function exitFullscreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
    }
}

// 隱藏開始按鈕
function hideStartBtn() {
    if (startBtn) startBtn.style.display = 'none';
}
// 顯示開始按鈕
function showStartBtn() {
    if (startBtn) startBtn.style.display = '';
}

// 初始化
function startGame() {
    hideStartBtn();
    enterFullscreen();
    // 若要讓畫布自動填滿螢幕
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    player = { x: 80, y: 200, angle: 0, speed: 0, color: "#1976d2", turnTimes: [] };
    ai = { x: 80, y: 230, angle: 0, speed: 0, color: "#d32f2f", turnTimes: [] };
    currentTurn = 0;
    aiCurrentTurn = 0;
    finished = false;
    startTime = Date.now();
    aiStartTime = Date.now();
    messagesContainer.innerHTML = "遊戲開始！請用方向鍵操作賽車。";
    gameLoop();
}

// 綁定按鈕事件
if (startBtn) startBtn.onclick = startGame;

// 若要自動開始
// startGame();