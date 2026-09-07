const $ = selector => document.querySelector(selector);
const screens = { start: $('#startScreen'), game: $('#gameScreen'), result: $('#resultScreen') };
let tracks = [], level = 'normal', round = 0, score = 0, seconds = 10;
let timerId, nextRoundId, deck = [], acceptingAnswer = false, sound = true;

const normalize = value => value.trim().toLocaleLowerCase('pl').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const randomItem = items => items[Math.floor(Math.random() * items.length)];
const shuffle = items => [...items].sort(() => Math.random() - .5);

async function loadSongs() {
  const button = $('#startBtn');
  button.disabled = true;
  button.firstChild.textContent = 'WCZYTYWANIE... ';
  try {
    const response = await fetch('./songs.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    tracks = data.filter(song => song.autor && song.title && song.text && Object.values(song.text).some(Array.isArray));
    if (!tracks.length) throw new Error('Brak poprawnych utworów');
    button.firstChild.textContent = 'ZACZYNAMY ';
    button.disabled = false;
    setupAutocomplete();
  } catch (error) {
    button.firstChild.textContent = 'BRAK BAZY ';
    toast('Nie udało się wczytać songs.json');
    console.error('Błąd wczytywania songs.json:', error);
  }
}

function createQuestion(song) {
  const sections = Object.values(song.text).filter(lines => Array.isArray(lines) && lines.length);
  const lines = randomItem(sections);
  if (level === 'easy') return lines.join('\n');
  if (level === 'hard' || lines.length === 1) return randomItem(lines);
  const start = Math.floor(Math.random() * (lines.length - 1));
  return lines.slice(start, start + 2).join('\n');
}

document.querySelectorAll('.difficulty button').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('.difficulty button').forEach(item => {
    item.classList.remove('active'); item.setAttribute('aria-checked', 'false');
  });
  button.classList.add('active'); button.setAttribute('aria-checked', 'true'); level = button.dataset.level;
}));

function show(name) {
  Object.values(screens).forEach(screen => screen.classList.add('hidden'));
  screens[name].classList.remove('hidden');
}

function startGame() {
  round = 0; score = 0;
  deck = shuffle(Array.from({ length: 5 }, (_, index) => tracks[index % tracks.length]));
  show('game'); nextRound();
}

function nextRound() {
  if (round >= 5) return finish();
  const track = deck[round];
  seconds = 10; acceptingAnswer = true;
  $('#roundLabel').textContent = `RUNDA ${String(round + 1).padStart(2, '0')} / 05`;
  $('#scoreLabel').textContent = `WYNIK ${String(score).padStart(2, '0')}`;
  $('#quote').textContent = `„${createQuestion(track)}”`;
  $('#artistInput').value = ''; $('#songInput').value = '';
  $('#timer').textContent = seconds; $('#progressBar').style.width = '100%';
  clearInterval(timerId);
  timerId = setInterval(() => {
    seconds -= 1; $('#timer').textContent = seconds;
    $('#progressBar').style.width = `${seconds * 10}%`;
    if (seconds <= 0) submit(true);
  }, 1000);
  $('#artistInput').focus();
}

function submit(timeout = false) {
  if (!acceptingAnswer) return;
  acceptingAnswer = false; clearInterval(timerId);
  const track = deck[round]; let gained = 0;
  if (normalize($('#artistInput').value) === normalize(track.autor)) gained += 1;
  if (normalize($('#songInput').value) === normalize(track.title)) gained += 1;
  score += gained;
  toast(timeout ? `CZAS! ${track.autor} — ${track.title}` : `+${gained} PKT • ${track.autor} — ${track.title}`);
  round += 1; nextRoundId = setTimeout(nextRound, 1200);
}

function finish() {
  clearInterval(timerId); clearTimeout(nextRoundId); show('result');
  $('#finalScore').textContent = String(score).padStart(2, '0');
  $('#resultTitle').textContent = score >= 9 ? 'LEGENDA!' : score >= 6 ? 'MOCNY WYNIK!' : score >= 3 ? 'NIEŹLE!' : 'JESZCZE RAZ!';
  $('#resultCopy').textContent = score >= 6 ? 'Masz ucho do wersów. Wchodzisz w kolejną rundę?' : 'Rozgrzewka za Tobą. Następna runda będzie Twoja.';
}

function toast(message) {
  $('#toast').textContent = message; $('#toast').classList.add('show');
  setTimeout(() => $('#toast').classList.remove('show'), 1100);
}

function autocomplete(input, box, getValues) {
  input.addEventListener('input', () => {
    const query = normalize(input.value); box.innerHTML = '';
    if (!query) return;
    [...new Set(getValues())].filter(value => normalize(value).includes(query)).slice(0, 6).forEach(value => {
      const button = document.createElement('button'); button.type = 'button'; button.textContent = value;
      button.addEventListener('mousedown', event => event.preventDefault());
      button.addEventListener('click', () => { input.value = value; box.innerHTML = ''; input.focus(); });
      box.appendChild(button);
    });
  });
  input.addEventListener('blur', () => { box.innerHTML = ''; });
}

function setupAutocomplete() {
  autocomplete($('#artistInput'), $('#artistSuggestions'), () => tracks.map(track => track.autor));
  autocomplete($('#songInput'), $('#songSuggestions'), () => {
    const artist = normalize($('#artistInput').value);
    return tracks.filter(track => !artist || normalize(track.autor) === artist).map(track => track.title);
  });
}

$('#answerForm').addEventListener('submit', event => { event.preventDefault(); submit(); });
$('#startBtn').addEventListener('click', startGame);
$('#restartBtn').addEventListener('click', () => { clearInterval(timerId); clearTimeout(nextRoundId); show('start'); });
$('#soundBtn').addEventListener('click', event => {
  sound = !sound; event.currentTarget.classList.toggle('muted', !sound); event.currentTarget.setAttribute('aria-pressed', sound);
});

loadSongs();
