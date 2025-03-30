// Firebase SDK modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import {
  getDatabase, ref, set, update, push, get, onValue, child
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-database.js";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let playerName = "";
let lobbyCode = "";
let isHost = false;
let questionPair = null;
let imposter = "";

const questions = [
  { main: "How many siblings do you have?", imposter: "How many close friends do you have?" },
  { main: "Favorite type of chip?", imposter: "Favorite type of cookie?" },
  { main: "Color of your water bottle?", imposter: "Color of your backpack?" },
  // Add more question pairs here
];

window.createLobby = async function () {
  playerName = document.getElementById("nameInput").value;
  lobbyCode = Math.random().toString(36).substring(2, 7).toUpperCase();
  isHost = true;
  await set(ref(db, `lobbies/${lobbyCode}`), {
    players: { [playerName]: true },
    host: playerName
  });
  enterLobby();
}

window.joinLobby = async function () {
  playerName = document.getElementById("nameInput").value;
  lobbyCode = document.getElementById("joinCodeInput").value.toUpperCase();
  await set(ref(db, `lobbies/${lobbyCode}/players/${playerName}`), true);
  enterLobby();
}

function enterLobby() {
  document.getElementById("home").classList.add("hidden");
  document.getElementById("lobby").classList.remove("hidden");
  document.getElementById("lobbyCodeDisplay").innerText = lobbyCode;

  const playerList = document.getElementById("playerList");
  onValue(ref(db, `lobbies/${lobbyCode}/players`), snapshot => {
    playerList.innerHTML = '';
    snapshot.forEach(child => {
      const li = document.createElement("li");
      li.innerText = child.key;
      playerList.appendChild(li);
    });
  });

  if (isHost) {
    document.getElementById("startGameBtn").classList.remove("hidden");
  }
}

window.startGame = async function () {
  const snapshot = await get(ref(db, `lobbies/${lobbyCode}/players`));
  const players = Object.keys(snapshot.val());
  imposter = players[Math.floor(Math.random() * players.length)];
  questionPair = questions[Math.floor(Math.random() * questions.length)];

  for (const p of players) {
    const q = p === imposter ? questionPair.imposter : questionPair.main;
    await set(ref(db, `lobbies/${lobbyCode}/questions/${p}`), {
      question: q,
      ready: false,
      vote: null
    });
  }

  update(ref(db, `lobbies/${lobbyCode}`), { phase: "questionPhase" });
}

onValue(ref(db, `lobbies/${lobbyCode}/phase`), snap => {
  const phase = snap.val();
  if (!phase) return;
  document.querySelectorAll("body > div").forEach(div => div.classList.add("hidden"));
  document.getElementById(phase).classList.remove("hidden");

  if (phase === "questionPhase") loadQuestion();
  if (phase === "votingPhase") loadVoting();
  if (phase === "revealPhase") loadReveal();
});

async function loadQuestion() {
  const snap = await get(ref(db, `lobbies/${lobbyCode}/questions/${playerName}`));
  document.getElementById("playerQuestion").innerText = snap.val().question;
}

window.markReady = async function () {
  await update(ref(db, `lobbies/${lobbyCode}/questions/${playerName}`), { ready: true });

  onValue(ref(db, `lobbies/${lobbyCode}/questions`), snapshot => {
    const allReady = Object.values(snapshot.val()).every(p => p.ready);
    if (allReady) update(ref(db, `lobbies/${lobbyCode}`), { phase: "readAnswers" });
  });
}

window.revealMainQuestion = function () {
  document.getElementById("readAnswers").classList.add("hidden");
  document.getElementById("mainReveal").classList.remove("hidden");
  document.getElementById("mainQuestionDisplay").innerText = questionPair.main;
}

window.goToVoting = function () {
  update(ref(db, `lobbies/${lobbyCode}`), { phase: "votingPhase" });
}

function loadVoting() {
  const list = document.getElementById("voteList");
  list.innerHTML = "";
  get(ref(db, `lobbies/${lobbyCode}/players`)).then(snapshot => {
    Object.keys(snapshot.val()).forEach(p => {
      if (p !== playerName) {
        const li = document.createElement("li");
        const btn = document.createElement("button");
        btn.innerText = `Vote ${p}`;
        btn.onclick = () => submitVote(p);
        li.appendChild(btn);
        list.appendChild(li);
      }
    });
  });
}

function submitVote(voted) {
  update(ref(db, `lobbies/${lobbyCode}/questions/${playerName}`), { vote: voted });
  document.getElementById("votingPhase").innerHTML = "<p>Thanks for voting!</p>";

  onValue(ref(db, `lobbies/${lobbyCode}/questions`), snapshot => {
    const votes = Object.values(snapshot.val()).filter(p => p.vote);
    const total = Object.keys(snapshot.val()).length;
    if (votes.length === total) update(ref(db, `lobbies/${lobbyCode}`), { phase: "revealPhase" });
  });
}

function loadReveal() {
  document.getElementById("revealText").innerText = `The imposter was ${imposter}!\nThey got the question: ${questionPair.imposter}`;
}
