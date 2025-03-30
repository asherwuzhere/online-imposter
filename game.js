// Firebase SDK modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import {
  getDatabase, ref, set, update, push, get, onValue, child
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyA3JrnVvOPto_aQ95MasBEd68-du6gJmCA",
  authDomain: "online-imposter.firebaseapp.com",
  databaseURL: "https://online-imposter-default-rtdb.firebaseio.com",
  projectId: "online-imposter",
  storageBucket: "online-imposter.firebasestorage.app",
  messagingSenderId: "925601269436",
  appId: "1:925601269436:web:661f6b53a754b5ccbc32b9"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let playerName = "";
let lobbyCode = "";
let isHost = false;
let questionPair = null;
let imposter = "";

const questions = [
  { main: "How many times have you been horseback riding in your life?", imposter: "How many sleepaway camps have you been to?" }
];

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

  listenForPhaseChange();
}

function listenForPhaseChange() {
  onValue(ref(db, `lobbies/${lobbyCode}/phase`), snap => {
    const phase = snap.val();
    if (!phase) return;
    document.querySelectorAll("body > div").forEach(div => div.classList.add("hidden"));
    document.getElementById(phase).classList.remove("hidden");

    if (phase === "questionPhase") loadQuestion();
    if (phase === "readAnswers") loadAnswers();
    if (phase === "votingPhase") loadVoting();
    if (phase === "revealPhase") loadReveal();
  });
}

window.createLobby = async function () {
  playerName = document.getElementById("nameInput").value.trim();
  if (!playerName) return alert("Please enter a name.");
  lobbyCode = Math.random().toString(36).substring(2, 7).toUpperCase();
  isHost = true;

  await set(ref(db, `lobbies/${lobbyCode}`), {
    players: { [playerName]: true },
    host: playerName
  });
  enterLobby();
};

window.joinLobby = async function () {
  playerName = document.getElementById("nameInput").value.trim();
  lobbyCode = document.getElementById("joinCodeInput").value.trim().toUpperCase();
  if (!playerName || !lobbyCode) return alert("Please enter name and lobby code.");

  const lobbyRef = ref(db, `lobbies/${lobbyCode}`);
  const snapshot = await get(lobbyRef);
  if (!snapshot.exists()) {
    return alert("Lobby not found.");
  }

  await set(ref(db, `lobbies/${lobbyCode}/players/${playerName}`), true);
  enterLobby();
};

window.startGame = async function () {
  const snapshot = await get(ref(db, `lobbies/${lobbyCode}/players`));
  const players = Object.keys(snapshot.val());
  imposter = players[Math.floor(Math.random() * players.length)];
  questionPair = questions[Math.floor(Math.random() * questions.length)];

  for (const p of players) {
    const q = p === imposter ? questionPair.imposter : questionPair.main;
    await set(ref(db, `lobbies/${lobbyCode}/questions/${p}`), {
      question: q,
      answer: "",
      ready: false,
      vote: null
    });
  }

  update(ref(db, `lobbies/${lobbyCode}`), { phase: "questionPhase" });
};

async function loadQuestion() {
  const snap = await get(ref(db, `lobbies/${lobbyCode}/questions/${playerName}`));
  const question = snap.val().question;
  document.getElementById("playerQuestion").innerText = question;
  const answerInput = document.createElement("input");
  answerInput.placeholder = "Type your answer...";
  answerInput.id = "answerField";
  document.getElementById("playerQuestion").appendChild(answerInput);
}

window.markReady = async function () {
  const answer = document.getElementById("answerField").value;
  await update(ref(db, `lobbies/${lobbyCode}/questions/${playerName}`), { ready: true, answer });

  onValue(ref(db, `lobbies/${lobbyCode}/questions`), snapshot => {
    const allReady = Object.values(snapshot.val()).every(p => p.ready);
    if (allReady) update(ref(db, `lobbies/${lobbyCode}`), { phase: "readAnswers" });
  });
};

function loadAnswers() {
  get(ref(db, `lobbies/${lobbyCode}/questions`)).then(snapshot => {
    const container = document.createElement("ul");
    for (const [name, obj] of Object.entries(snapshot.val())) {
      const li = document.createElement("li");
      li.innerText = `${name}: ${obj.answer}`;
      container.appendChild(li);
    }
    document.getElementById("readAnswers").appendChild(container);
  });
}

window.revealMainQuestion = function () {
  document.getElementById("readAnswers").classList.add("hidden");
  document.getElementById("mainReveal").classList.remove("hidden");
  document.getElementById("mainQuestionDisplay").innerText = questionPair.main;
  speak(`The main question was: ${questionPair.main}`);
};

function speak(text) {
  const msg = new SpeechSynthesisUtterance(text);
  window.speechSynthesis.speak(msg);
}

window.goToVoting = function () {
  update(ref(db, `lobbies/${lobbyCode}`), { phase: "votingPhase" });
};

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
  get(ref(db, `lobbies/${lobbyCode}/questions`)).then(snapshot => {
    const votes = {};
    const votedFor = {};

    for (const [name, data] of Object.entries(snapshot.val())) {
      const voted = data.vote;
      if (!votes[voted]) votes[voted] = 0;
      votes[voted]++;
      if (!votedFor[voted]) votedFor[voted] = [];
      votedFor[voted].push(name);
    }

    let result = "<h3>Voting Results:</h3>";
    for (const [name, count] of Object.entries(votes)) {
      result += `<p>${name}: ${count} vote(s) - Voted by: ${votedFor[name].join(", ")}</p>`;
    }

    const topVoted = Object.entries(votes).sort((a, b) => b[1] - a[1])[0][0];
    const correct = topVoted === imposter;

    result += `<p><strong>${topVoted}</strong> was voted out. They were ${correct ? "the imposter ✅" : "not the imposter ❌"}.</p>`;
    result += `<p>The imposter was <strong>${imposter}</strong>, and their question was: \"${questionPair.imposter}\"</p>`;

    document.getElementById("revealText").innerHTML = result;
  });
}
