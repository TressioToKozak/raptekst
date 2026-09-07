const tracks = [
  { artist: 'Mata', song: 'patointeligencja', clues: { easy: 'Dzieciaki z dobrych domów i ich ukryte problemy — cały refren opowiada o podwójnym życiu.', normal: 'Elitarna szkoła nie chroni przed chaosem. Pozory pękają po lekcjach.', hard: 'Matura nie uczy, jak udźwignąć presję.' } },
  { artist: 'White 2115', song: 'California', clues: { easy: 'Słońce, palmy i letni lot — refren przenosi ekipę prosto na zachodnie wybrzeże.', normal: 'Marzenie ma kolor zachodu słońca. Nocą miasto wygląda jak film.', hard: 'W głowie ciągle lato, niezależnie od pogody.' } },
  { artist: 'Białas', song: 'Zosia', clues: { easy: 'To gorzka historia relacji, która zamiast happy endu zostawia tylko ślad.', normal: 'Jedno imię wraca jak echo. Wspomnienia nie chcą ucichnąć.', hard: 'Nie każda bajka dobrze się kończy.' } },
  { artist: 'Bedoes', song: 'Biały i młody', clues: { easy: 'Głośny manifest młodego gracza — pewność siebie niesie cały refren.', normal: 'Wiek to nie hamulec, a ambicja nie zna granic. Wszystkie oczy patrzą.', hard: 'Młodość zamienia w swoją największą przewagę.' } }
];

const $ = s => document.querySelector(s);
const screens = { start: $('#startScreen'), game: $('#gameScreen'), result: $('#resultScreen') };
let level = 'normal', round = 0, score = 0, seconds = 10, timerId, deck = [], sound = true;
const normalize = value => value.trim().toLocaleLowerCase('pl').normalize('NFD').replace(/[\u0300-\u036f]/g, '');

document.querySelectorAll('.difficulty button').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('.difficulty button').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-checked', 'false'); });
  button.classList.add('active'); button.setAttribute('aria-checked', 'true'); level = button.dataset.level;
}));

function show(name) { Object.values(screens).forEach(s => s.classList.add('hidden')); screens[name].classList.remove('hidden'); }
function shuffle(items) { return [...items].sort(() => Math.random() - .5); }
function startGame() { round = 0; score = 0; deck = shuffle([...tracks, tracks[Math.floor(Math.random() * tracks.length)]]); show('game'); nextRound(); }
function nextRound() {
  if (round >= 5) return finish();
  const track = deck[round]; seconds = 10;
  $('#roundLabel').textContent = `RUNDA ${String(round + 1).padStart(2,'0')} / 05`;
  $('#scoreLabel').textContent = `WYNIK ${String(score).padStart(2,'0')}`;
  $('#quote').textContent = `„${track.clues[level]}”`;
  $('#artistInput').value = ''; $('#songInput').value = ''; $('#timer').textContent = seconds; $('#progressBar').style.width = '100%';
  clearInterval(timerId); requestAnimationFrame(() => $('#progressBar').style.width = '100%');
  timerId = setInterval(() => { seconds--; $('#timer').textContent = seconds; $('#progressBar').style.width = `${seconds * 10}%`; if (seconds <= 0) submit(true); }, 1000);
  $('#artistInput').focus();
}
function submit(timeout = false) {
  clearInterval(timerId); const track = deck[round]; let gained = 0;
  if (normalize($('#artistInput').value) === normalize(track.artist)) gained++;
  if (normalize($('#songInput').value) === normalize(track.song)) gained++;
  score += gained; toast(timeout ? `CZAS! ${track.artist} — ${track.song}` : `+${gained} PKT • ${track.artist} — ${track.song}`);
  round++; setTimeout(nextRound, 1200);
}
function finish() {
  show('result'); $('#finalScore').textContent = String(score).padStart(2,'0');
  $('#resultTitle').textContent = score >= 9 ? 'LEGENDA!' : score >= 6 ? 'MOCNY WYNIK!' : score >= 3 ? 'NIEŹLE!' : 'JESZCZE RAZ!';
  $('#resultCopy').textContent = score >= 6 ? 'Masz ucho do wersów. Wchodzisz w kolejną rundę?' : 'Rozgrzewka za Tobą. Następna runda będzie Twoja.';
}
function toast(message) { $('#toast').textContent = message; $('#toast').classList.add('show'); setTimeout(() => $('#toast').classList.remove('show'), 1000); }
function autocomplete(input, box, values) {
  input.addEventListener('input', () => {
    const q = normalize(input.value); box.innerHTML = '';
    if (!q) return;
    [...new Set(values)].filter(v => normalize(v).includes(q)).slice(0,4).forEach(v => {
      const button = document.createElement('button'); button.type = 'button'; button.textContent = v;
      button.onclick = () => { input.value = v; box.innerHTML = ''; }; box.appendChild(button);
    });
  });
  input.addEventListener('blur', () => setTimeout(() => box.innerHTML = '', 150));
}
autocomplete($('#artistInput'), $('#artistSuggestions'), tracks.map(t => t.artist));
autocomplete($('#songInput'), $('#songSuggestions'), tracks.map(t => t.song));
$('#answerForm').addEventListener('submit', e => { e.preventDefault(); submit(); });
$('#startBtn').addEventListener('click', startGame); $('#restartBtn').addEventListener('click', () => show('start'));
$('#soundBtn').addEventListener('click', e => { sound = !sound; e.currentTarget.classList.toggle('muted', !sound); e.currentTarget.setAttribute('aria-pressed', sound); });
