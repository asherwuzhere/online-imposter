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
  { main: "How many times have you been horseback riding in your life?", imposter: "How many sleepaway camps have you been to?" },
  { main: "How many different cities have you spent the night in during the past year?", imposter: "How many different airports have you passed through this year?" },
  { main: "What's the longest you've ever stayed awake continuously?", imposter: "What's the longest single trip you've ever taken by car?" },
  { main: "How many unread emails or texts do you currently have?", imposter: "How many screenshots are saved on your phone right now?" },
  { main: "How many concerts have you attended in your life?", imposter: "How many live sports games have you been to?" },
  { main: "How many browser tabs do you have open right now?", imposter: "How many apps are currently open on your phone?" },
  { main: "How many times have you moved houses or apartments?", imposter: "How many different beds have you slept in this year?" },
  { main: "How many people have you blocked on social media?", imposter: "How many people do you follow that you’ve never met?" },
  { main: "How many hours of screen time did you average last week?", imposter: "How many hours did you spend listening to music last week?" },
  { main: "How many digital photos do you currently have saved?", imposter: "How many physical photos are displayed in your room?" },
  { main: "What’s the weirdest food you’ve ever tried and liked?", imposter: "What’s the most disgusting thing you’ve ever tasted?" },
  { main: "What’s the last movie you watched and genuinely enjoyed?", imposter: "What’s the last YouTube video you rewatched?" },
  { main: "How many different water bottles do you own?", imposter: "How many mugs or cups do you use regularly?" },
  { main: "How many alarms do you set to wake up in the morning?", imposter: "How many times do you hit snooze before getting up?" },
  { main: "How many times have you cried from laughter?", imposter: "How many times have you laughed at something that wasn’t funny?" },
  { main: "What’s the most niche hobby or interest you've had?", imposter: "What’s a skill you secretly wish you had?" },
  { main: "How many different school or work projects are you juggling right now?", imposter: "How many deadlines have you missed this year?" },
  { main: "How many songs are downloaded on your phone?", imposter: "How many playlists have you created?" },
  { main: "How many different games do you currently have installed?", imposter: "How many apps do you use daily?" },
  { main: "How many times have you changed your username online?", imposter: "How many email accounts do you actively use?" },
  { main: "How many different libraries have you visited in your life?", imposter: "How many different bookstores have you spent time in?" },
  { main: "How many languages can you understand at a basic level?", imposter: "How many programming languages have you tried to learn?" },
  { main: "How many times have you accidentally sent a message to the wrong person?", imposter: "How many times have you screenshot a chat by mistake?" },
  { main: "How many different backpacks have you used in the past 5 years?", imposter: "How many different pencil cases have you owned?" },
  { main: "How many hours did you sleep last Saturday?", imposter: "How many hours were you on your phone last Saturday?" },
  { main: "How many items are currently in your Amazon cart or wishlist?", imposter: "How many tabs are open on your phone browser right now?" },
  { main: "How many family members do you talk to weekly?", imposter: "How many group chats are you active in every week?" },
  { main: "How many photos are in your 'Favorites' album?", imposter: "How many videos are saved in your camera roll?" },
  { main: "How many times have you deleted social media apps?", imposter: "How many times have you reinstalled a deleted app?" },
  { main: "How many times have you been late to something important?", imposter: "How many times have you arrived embarrassingly early?" },
  { main: "How many receipts are in your wallet or bag right now?", imposter: "How many membership cards do you carry with you?" },
  { main: "How many pairs of shoes do you wear regularly?", imposter: "How many hoodies or sweatshirts do you rotate through?" },
  { main: "How many pets have you had in your life?", imposter: "How many plants have you tried to keep alive?" },
  { main: "How many games do you own but haven’t finished?", imposter: "How many books have you started but not completed?" },
  { main: "How many emails are in your spam folder?", imposter: "How many junk physical mail items do you get a week?" },
  { main: "How many people do you remember from your first school?", imposter: "How many teachers from elementary school can you name?" },
  { main: "How many phone chargers have you lost?", imposter: "How many headphones have broken on you?" },
  { main: "How many people have you shared your Netflix account with?", imposter: "How many people have asked for your Wi-Fi password?" },
  { main: "How many unread Discord messages do you have?", imposter: "How many unread notifications from school/work platforms?" },
  { main: "How many posters or prints are in your room?", imposter: "How many magnets are on your fridge?" },
  { main: "How many usernames have you created in your life?", imposter: "How many online accounts do you think you have total?" },
  { main: "How many different cafes have you worked or studied in?", imposter: "How many different public places have you cried in?" },
  { main: "How many drinks do you try before settling on a favorite?", imposter: "How many snack brands do you rotate between weekly?" },
  { main: "How many times have you accidentally liked an old post while stalking?", imposter: "How many times have you typed a message and never sent it?" },
  { main: "How many tabs are always open on your laptop?", imposter: "How many apps do you never close on your phone?" },
  { main: "How many times have you been in a group photo where you blinked?", imposter: "How many selfies are in your gallery that you never posted?" },
  { main: "How many total passwords do you remember off the top of your head?", imposter: "How many password variations do you keep trying before resetting?" },
  { main: "How many cups of tea or coffee do you have per week?", imposter: "How many energy drinks or sodas do you drink weekly?" },
  { main: "How many usernames have you recycled across platforms?", imposter: "How many nicknames do people call you by?" },
  { main: "How many birthdays do you remember without checking?", imposter: "How many contact names do you remember off memory?" },
  { main: "How many phone wallpapers have you had this year?", imposter: "How many lockscreen notifications do you usually have?" },
  { main: "How many photos of food are in your phone?", imposter: "How many mirror selfies are in your gallery?" },
  { main: "How many people have you high-fived in the last month?", imposter: "How many people have you bumped into awkwardly this month?" },
  { main: "How many keys are on your keychain?", imposter: "How many loyalty cards are in your wallet?" },
  { main: "How many times have you tripped in public this year?", imposter: "How many times have you dropped your phone this year?" },
  { main: "How many tabs do you open before doing homework?", imposter: "How many minutes do you spend procrastinating before starting?" },
  { main: "How many books have you started but never finished?", imposter: "How many Netflix series have you left halfway?" },
  { main: "How many games have you rage-quit?", imposter: "How many games do you return to even after losing often?" },
  { main: "How many flash drives or SD cards do you own?", imposter: "How many old phones are still in your house?" },
  { main: "How many cables do you have but don't know the purpose of?", imposter: "How many tech items do you have in a junk drawer?" },
  { main: "How many people from your school do you follow on social media?", imposter: "How many people from social media do you follow but never talk to?" },
  { main: "How many mugs do you currently own?", imposter: "How many bowls do you use regularly?" },
  { main: "How many bookmarks are saved in your browser?", imposter: "How many saved posts do you have on Instagram?" },
  { main: "How many outfits do you cycle through in a regular week?", imposter: "How many times do you change clothes in one day?" },
  { main: "How many group chats do you mute regularly?", imposter: "How many chats have you left in the past year?" },
  { main: "How many public transport systems have you used?", imposter: "How many Uber rides have you taken?" },
  { main: "How many people have you met online but never in person?", imposter: "How many online games have you played with strangers?" },
  { main: "How many places have you visited twice or more?", imposter: "How many cities are still on your bucket list?" },
  { main: "How many things in your room are older than 5 years?", imposter: "How many things in your room do you actually use daily?" },
  { main: "How many articles of clothing have you thrifted?", imposter: "How many things do you own that were hand-me-downs?" },
  { main: "How many people have seen you cry?", imposter: "How many people have you comforted while crying?" },
  { main: "How many water bottles do you lose every year?", imposter: "How many notebooks do you abandon halfway?" },
  { main: "How many YouTubers do you subscribe to?", imposter: "How many YouTube channels have you created?" },
  { main: "How many times have you changed your phone case?", imposter: "How many screen protectors have you cracked?" },
  { main: "How many celebrity crushes have you had?", imposter: "How many fictional characters have you had a crush on?" },
  { main: "How many Google Docs do you have saved?", imposter: "How many files are saved to your desktop right now?" },
  { main: "How many times have you rewatched a favorite movie?", imposter: "How many times have you watched a movie you hated?" },
  { main: "How many memes do you save per week?", imposter: "How many memes do you send to others per week?" },
  { main: "How many nights have you stayed up past 3 a.m. this year?", imposter: "How many all-nighters have you pulled this year?" },
  { main: "How many phone numbers are saved in your contacts?", imposter: "How many contacts do you actually talk to regularly?" },
  { main: "How many browser extensions do you use?", imposter: "How many Chrome profiles have you set up?" },
  { main: "How many random facts can you recall on command?", imposter: "How many trivia games have you ever won?" },
  { main: "How many photo albums are on your phone?", imposter: "How many folders are on your desktop?" },
  { main: "How many playlists have you created?", imposter: "How many songs have you added to your liked list?" },
  { main: "How many tote bags do you own?", imposter: "How many reusable straws or utensils do you have?" },
  { main: "How many things in your room are gifts?", imposter: "How many souvenirs do you keep on display?" },
  { main: "How many candles are in your house?", imposter: "How many essential oils or diffusers do you use?" },
  { main: "How many devices do you own that can connect to Wi-Fi?", imposter: "How many smart devices do you actually use?" },
  { main: "How many cousins do you know by name?", imposter: "How many second cousins have you met?" },
  { main: "How many childhood toys do you still have?", imposter: "How many photos from your childhood are still printed?" },
  { main: "How many passwords do you reuse?", imposter: "How many password managers have you tried?" },
  { main: "How many items are on your bucket list?", imposter: "How many things have you checked off your bucket list?" },
  { main: "How many times have you moved houses?", imposter: "How many times have you shared a room with someone?" },
  { main: "How many fortune cookies have you kept the message from?", imposter: "How many notes or letters have you saved over the years?" },
  { main: "How many different calendars or planners have you tried using?", imposter: "How many reminder apps are currently on your phone?" },
  { main: "How many passwords have you reset this month?", imposter: "How many login attempts do you usually make before succeeding?" },
  { main: "How many outfits have you coordinated for a theme party?", imposter: "How many costumes have you worn on Halloween?" },
  { main: "How many phone screens have you cracked?", imposter: "How many times have you paid for phone repairs?" },
  { main: "How many loyalty programs are you signed up for?", imposter: "How many free trials have you forgotten to cancel?" },
  { main: "How many bookmarks have you never gone back to?", imposter: "How many open tabs have been sitting untouched for days?" },
  { main: "How many notebooks have you filled completely?", imposter: "How many notebooks have only the first few pages used?" },
  { main: "How many birthdays do you have saved in your calendar?", imposter: "How many reminders do you have set for this week?" }
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
