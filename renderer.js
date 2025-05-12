// renderer.js

let audio,
  playPauseBtn,
  prevBtn,
  nextBtn,
  progressBar,
  cancelBtn,
  sleepBtn,
  queueBtn,
  bottomMenu,
  sleepContent,
  queueContent,
  queueList,
  songName,
  artistName,
  songImg,
  currentTimeEl,
  totalTimeEl,
  sleepTimerText;

let sleepTimeout = null;
let sleepInterval = null;
let sleepEndTime = null;
let songs = [];
let songIndex = 0;
let isPlaying = false;

window.addEventListener("DOMContentLoaded", async () => {
  // Get elements
  playPauseBtn = document.getElementById("play-pause");
  prevBtn = document.getElementById("prev");
  nextBtn = document.getElementById("next");
  progressBar = document.getElementById("progress-bar");
  songName = document.querySelector(".song-name");
  artistName = document.querySelector(".artist-name");
  songImg = document.querySelector(".song-img");
  currentTimeEl = document.getElementById("current-time");
  totalTimeEl = document.getElementById("total-time");
  sleepBtn = document.getElementById("sleep-timer");
  queueBtn = document.getElementById("queue");
  bottomMenu = document.getElementById("bottom-menu");
  sleepContent = document.getElementById("sleep-content");
  queueContent = document.getElementById("queue-content");
  queueList = document.getElementById("queue-list");
  cancelBtn = document.getElementById("close-menu");
  sleepTimerText = document.getElementById("sleep-timer-text");

  // Create and insert audio element
  audio = new Audio();
  document.body.appendChild(audio);

  // Fetch songs
  fetch("https://eros1012.github.io/music-assets/songs.json")
    .then((response) => response.json())
    .then((data) => {
      songs = shuffle(data);
      loadSong(songs[songIndex]);
      setupEventListeners();
    })
    .catch((err) => console.error("Failed to load songs:", err));
});

function loadSong(song) {
  songName.textContent = song.name;
  artistName.textContent = song.artist;
  audio.src = song.src;
  songImg.src = song.image;

  audio.addEventListener("loadedmetadata", () => {
    totalTimeEl.textContent = formatTime(audio.duration);
  });
}

// Shuffle function to randomize the song order
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]; // Swap elements
  }
  return array;
}

function playSong() {
  audio.play();
  isPlaying = true;
  playPauseBtn.querySelector("img").src = "icons/pause.svg";
  playPauseBtn.querySelector("img").alt = "Pause";
  populateQueue(); // update queue UI with icon
}


function pauseSong() {
  audio.pause();
  isPlaying = false;
  playPauseBtn.querySelector("img").src = "icons/play.svg";
  playPauseBtn.querySelector("img").alt = "Play";
  populateQueue(); 
}


function togglePlayPause() {
  isPlaying ? pauseSong() : playSong();
}

function playNext() {
  songIndex = (songIndex + 1) % songs.length; // Continue looping through the shuffled list
  loadSong(songs[songIndex]);
  playSong();
}

function playPrev() {
  songIndex = (songIndex - 1 + songs.length) % songs.length; // Loop back to the last song if at the start
  loadSong(songs[songIndex]);
  playSong();
}

function updateProgressBar() {
  if (audio.duration) {
    progressBar.value = (audio.currentTime / audio.duration) * 100;
    currentTimeEl.textContent = formatTime(audio.currentTime);
  }
}

function formatTime(time) {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function seekAudio(e) {
  const value = e.target.value;
  audio.currentTime = (value / 100) * audio.duration;
}

function setupEventListeners() {
  playPauseBtn.addEventListener("click", togglePlayPause);
  prevBtn.addEventListener("click", playPrev);
  nextBtn.addEventListener("click", playNext);
  progressBar.addEventListener("input", seekAudio);
  audio.addEventListener("timeupdate", updateProgressBar);
  audio.addEventListener("ended", playNext);
  playPauseBtn.addEventListener("click", togglePlayPause);
  prevBtn.addEventListener("click", playPrev);
  nextBtn.addEventListener("click", playNext);
  progressBar.addEventListener("input", seekAudio);
  audio.addEventListener("timeupdate", updateProgressBar);
  audio.addEventListener("ended", playNext);

  sleepBtn.addEventListener("click", () => {
    toggleBottomMenu("sleep");
  });

  queueBtn.addEventListener("click", () => {
    populateQueue();
    toggleBottomMenu("queue");
  });

  // Handle clicks in sleep menu
  sleepContent.addEventListener("click", handleSleepMenuClick);

  // Hide the menu when clicking cancel button
  cancelBtn.addEventListener("click", () => {
    bottomMenu.classList.add("hidden");
    sleepContent.classList.add("hidden");
    queueContent.classList.add("hidden");
  });
}

function toggleBottomMenu(type) {
  const isAlreadyVisible = !bottomMenu.classList.contains("hidden");

  // If already visible and clicking same button, close it
  if (
    isAlreadyVisible &&
    ((type === "sleep" && !sleepContent.classList.contains("hidden")) ||
      (type === "queue" && !queueContent.classList.contains("hidden")))
  ) {
    bottomMenu.classList.add("hidden");
    sleepContent.classList.add("hidden");
    queueContent.classList.add("hidden");
    return;
  }

  // Show the appropriate content
  bottomMenu.classList.remove("hidden");
  sleepContent.classList.toggle("hidden", type !== "sleep");
  queueContent.classList.toggle("hidden", type !== "queue");
}

function handleSleepMenuClick(e) {
  const target = e.target.closest("li");
  if (!target) return;

  const value = target.getAttribute("data-minutes");

  if (value === "cancel") {
    cancelSleepTimer();
  } else {
    const minutes = parseInt(value);
    setSleepTimer(minutes);
  }
  bottomMenu.classList.add("hidden");
  sleepContent.classList.add("hidden");
}

function populateQueue() {
  queueList.innerHTML = "";
  songs.forEach((song, index) => {
    const li = document.createElement("li");
    li.textContent = `${song.name}`;

    // Highlight the currently playing song
    if (index === songIndex) {
      const icon = document.createElement("img");
      icon.src = "icons/music-note.svg";
      icon.alt = "Now Playing";
      icon.classList.add("queue-icon");
      li.appendChild(icon);
      li.style.fontWeight = "bold"; // optional: visually highlight the row
    }

    li.addEventListener("click", () => {
      songIndex = index;
      loadSong(songs[songIndex]);
      playSong();
      populateQueue(); // refresh to update icon position
    });

    queueList.appendChild(li);
  });
}

function setSleepTimer(minutes) {
  if (sleepTimeout) clearTimeout(sleepTimeout);
  if (sleepInterval) clearInterval(sleepInterval);

  const durationMs = minutes * 60 * 1000;
  sleepEndTime = Date.now() + durationMs;

  sleepTimeout = setTimeout(() => {
    audio.pause();
    clearInterval(sleepInterval);
    sleepTimerText.textContent = "";
    sleepTimeout = null;
    sleepInterval = null;
    sleepEndTime = null;
  }, durationMs);

  sleepInterval = setInterval(() => {
    const remaining = sleepEndTime - Date.now();
    if (remaining <= 0) {
      sleepTimerText.textContent = "";
      clearInterval(sleepInterval);
      sleepInterval = null;
      return;
    }
    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000)
      .toString()
      .padStart(2, "0");
    sleepTimerText.textContent = `${mins}:${secs}`;
  }, 1000);
}

function cancelSleepTimer() {
  if (sleepTimeout) {
    clearTimeout(sleepTimeout);
    clearInterval(sleepInterval);
    sleepTimeout = null;
    sleepInterval = null;
    sleepEndTime = null;
    sleepTimerText.textContent = "";
  }
}

document.addEventListener("click", (event) => {
  const isClickInsideMenu = bottomMenu.contains(event.target);
  const isClickingButton = sleepBtn.contains(event.target) || queueBtn.contains(event.target);

  if (!isClickInsideMenu && !isClickingButton && !bottomMenu.classList.contains("hidden")) {
    bottomMenu.classList.add("hidden");
    sleepContent.classList.add("hidden");
    queueContent.classList.add("hidden");
  }
});
