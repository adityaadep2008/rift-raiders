/**
 * DuoLingo 2006 Edition - Core Application & Game Engine
 * Retro Reboot 2026
 */

// ==========================================================================
// 1. Audio Synthesis Engine (Web Audio API)
// ==========================================================================
class RetroAudioEngine {
  constructor() {
    this.ctx = null;
    this.bgMusicRunning = false;
    this.bgAudio = null;
  }

  init() {
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        logToConsole(`[SYSTEM] Created new AudioContext successfully. State: "${this.ctx.state}".`);
      } catch (e) {
        logToConsole(`[SYSTEM ERROR] Failed to create AudioContext: ${e.message}`, 'error');
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().then(() => {
        logToConsole(`[SYSTEM] AudioContext resumed. State: "${this.ctx.state}".`);
      }).catch(err => {
        logToConsole(`[SYSTEM WARNING] AudioContext resume failed: ${err.message}`, 'warning');
      });
      
      // Play a microscopic silent buffer to force-unlock Safari/iOS Web Audio
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.00001, this.ctx.currentTime);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(0);
        osc.stop(0.001);
      } catch (err) {
        console.warn("Safari AudioContext unlock note failed:", err);
      }
    }
  }

  // Load and play backgroundsound.mp3 loop, keeping synthesized bird chirps intact!
  playBackgroundMusic() {
    this.init();
    if (!this.ctx) return;
    
    if (this.bgMusicRunning) return;
    this.bgMusicRunning = true;
    
    if (!this.bgAudio) {
      this.bgAudio = new Audio('backgroundsound.mp3');
      this.bgAudio.loop = true;
      this.bgAudio.volume = 0.25; // soft background music volume
    }
    
    this.bgAudio.play().then(() => {
      logToConsole(`[PHP] audio_bg_music: playing backgroundsound.mp3 loop.`, 'info');
    }).catch(err => {
      logToConsole(`[PHP WARNING] backgroundsound.mp3 play block: ${err.message}`, 'warning');
    });
    
    // Bird chirp synthesizer loop
    const playBirdChirp = () => {
      if (!this.bgMusicRunning || !this.ctx || this.ctx.state === 'suspended') return;
      const now = this.ctx.currentTime;
      
      // Multi-chirp burst
      const numChirps = Math.floor(Math.random() * 3) + 2;
      const startTime = now;
      
      for (let i = 0; i < numChirps; i++) {
        const chirpDelay = i * 0.15;
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        
        osc.type = 'sine';
        
        const startFreq = 2900 + Math.random() * 300;
        const endFreq = 3900 + Math.random() * 300;
        osc.frequency.setValueAtTime(startFreq, startTime + chirpDelay);
        osc.frequency.exponentialRampToValueAtTime(endFreq, startTime + chirpDelay + 0.08);
        
        gainNode.gain.setValueAtTime(0, startTime + chirpDelay);
        gainNode.gain.linearRampToValueAtTime(0.012, startTime + chirpDelay + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + chirpDelay + 0.08);
        
        osc.connect(gainNode);
        gainNode.connect(this.ctx.destination);
        
        osc.start(startTime + chirpDelay);
        osc.stop(startTime + chirpDelay + 0.08);
      }
      
      // schedule next chirp sweep in 8-15s
      setTimeout(playBirdChirp, (8 + Math.random() * 7) * 1000);
    };
    
    setTimeout(playBirdChirp, 1500);
  }

  stopBackgroundMusic() {
    this.bgMusicRunning = false;
    if (this.bgAudio) {
      this.bgAudio.pause();
    }
    logToConsole(`[PHP] audio_bg_music: backgroundsound.mp3 stopped.`, 'info');
  }

  // Windows Vista/XP inspired Startup Chime
  playStartup() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    const notes = [220, 330, 440, 554, 659, 880]; 
    notes.forEach((freq, index) => {
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      
      osc.type = index % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now + index * 0.1);
      
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.15, now + 0.2 + index * 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);
      
      osc.connect(gainNode);
      gainNode.connect(this.ctx.destination);
      
      osc.start(now);
      osc.stop(now + 2.6);
    });
  }

  // Simulated mechanical hard drive click
  playHddClick() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    const bufferSize = this.ctx.sampleRate * 0.02; // 20ms
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1000;
    filter.Q.value = 5;
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    
    noise.start(now);
    noise.stop(now + 0.02);
  }

  // Double chime on correct response
  playCorrect() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.frequency.setValueAtTime(523.25, now); // C5
    gain1.gain.setValueAtTime(0.18, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.3);
    
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.frequency.setValueAtTime(659.25, now + 0.12); // E5
    gain2.gain.setValueAtTime(0.18, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.45);
  }

  // Loud digital buzzer error sound
  playError() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(130.81, now); // C3
    osc.frequency.linearRampToValueAtTime(110.00, now + 0.4);
    
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  // MSN Messenger toaster alert sound ("da-ding!")
  playBBSChime() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now); // A5
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.15);
    
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1320, now + 0.08); // E6
    gain2.gain.setValueAtTime(0.15, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.45);
  }

  // satisfying pop sound when blocks are dropped
  playDropSound() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(580, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.09);
    
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  // Sequential, robust speech synthesis using native Web Speech API (Spanish voices)
  playRoboticSpeech(phrase) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(phrase);
      utterance.lang = 'es-ES';
      utterance.pitch = 0.85;
      utterance.rate = 0.8;
      
      window.speechSynthesis.speak(utterance);
      logToConsole(`[PHP] Native SpeechSynthesis: Speaking "${phrase}" in Spanish.`);
    } else {
      logToConsole(`[PHP WARNING] SpeechSynthesis API not supported. Falling back to synthetic chimes.`, 'warning');
      this.playCorrect();
    }
  }

  // Typewriter keyboard sound effect synthesis
  playTypewriterSound() {
    this.init();
    if (!this.ctx || this.ctx.state === 'suspended') return;
    
    // Only play if enabled
    if (localStorage.getItem('enable_typewriter_sound') === 'false') return;
    
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400 + Math.random() * 300, now);
    
    gain.gain.setValueAtTime(0.015, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.02);
  }
}

const audio = new RetroAudioEngine();

// Capture console and runtime errors directly in our visible SQL/PHP activity console drawer
window.addEventListener('error', (e) => {
  logToConsole(`[JS EXCEPTION] ${e.message} at line ${e.lineno}`, 'error');
});
window.addEventListener('unhandledrejection', (e) => {
  logToConsole(`[JS REJECTION] ${e.reason}`, 'error');
});

// Resume context and register key down for booting
window.addEventListener('click', () => {
  audio.init();
  if (audio.ctx) {
    logToConsole(`[SYSTEM GESTURE] Click recorded. AudioContext state = "${audio.ctx.state}".`);
  }
});
window.addEventListener('keydown', () => {
  audio.init();
  if (audio.ctx) {
    logToConsole(`[SYSTEM GESTURE] Keydown recorded. AudioContext state = "${audio.ctx.state}".`);
  }
});


// ==========================================================================
// 2. Simulated Relational Database & State Engine
// ==========================================================================
const db = {
  users: {
    id: 1,
    username: 'Learner_2006',
    streak: 3,
    last_active_date: '2006-07-10',
    lingots: 15,
    outfit: 'default',
    streak_freezes: 0,
    has_tracksuit: false,
    cache_enabled: false,
    hobby: 'golf',
    learned_words: [] // in-memory tracking of vocab
  },
  
  bbs_leaderboard: [
    { rank: 1, user: 'xX_SpanishPro_Xx', posts: 1482, xp: 950, tier: 'BBS God Tier' },
    { rank: 2, user: 'GrammarCop', posts: 924, xp: 780, tier: 'BBS Admin' },
    { rank: 3, user: 'Vistafan99', posts: 412, xp: 450, tier: 'Silver Learner' },
    { rank: 4, user: 'Learner_2006 (You)', posts: 42, xp: 120, tier: 'Bronze Tier Learner' },
    { rank: 5, user: 'ClippyFanatic', posts: 19, xp: 40, tier: 'Post Count: 19' }
  ],
  
  lessons: {
    'basics-1': { completed: false, current_step: 3, total_steps: 5, vocab: ["el niño", "come", "una manzana", "leche", "bebe"] },
    'phrases': { completed: false, current_step: 0, total_steps: 5, vocab: ["hola", "cómo estás", "gracias", "adiós"] },
    'food': { completed: false, locked: true, vocab: ["pan", "queso", "fruta", "agua"] },
    'travel': { completed: false, locked: true, vocab: ["avión", "tren", "maleta", "viaje"] },
    'animals': { completed: false, locked: true, vocab: ["perro", "gato", "pájaro", "caballo", "pez"] },
    'clothing': { completed: false, locked: true, vocab: ["camisa", "zapatos", "pantalones", "sombrero"] },
    'sports': { completed: false, locked: true, vocab: ["fútbol", "tenis", "correr", "juego"] },
    'colors': { completed: false, locked: true, vocab: ["rojo", "azul", "verde", "amarillo"] },
    'tech': { completed: false, locked: true, vocab: ["computadora", "ratón", "teclado", "pantalla"] },
    'hobby': { completed: false, locked: true, vocab: [] }
  }
};

const hobbyVocabMap = {
  golf: ["hoyo", "palo", "pelota", "verde"],
  gaming: ["consola", "juego", "nivel", "control"],
  cooking: ["cocina", "sartén", "fuego", "receta"],
  reading: ["libro", "página", "leer", "historia"]
};

// PowerPoint Slide decks database
const lectureDecks = {
  'basics-1': [
    { word: "el niño", english: "The boy", example: "Example: 'El niño come una manzana' (The boy eats an apple)" },
    { word: "come", english: "Eats", example: "Example: 'El niño come pan' (The boy eats bread)" },
    { word: "una manzana", english: "An apple", example: "Example: 'La manzana es roja' (The apple is red)" },
    { word: "leche", english: "Milk", example: "Example: 'El gato bebe leche' (The cat drinks milk)" },
    { word: "bebe", english: "Drinks", example: "Example: 'El perro bebe agua' (The dog drinks water)" }
  ],
  'phrases': [
    { word: "hola", english: "Hello", example: "Example: 'Hola, ¿cómo estás?' (Hello, how are you?)" },
    { word: "cómo estás", english: "How are you", example: "Example: 'Hola, ¿cómo estás, amigo?' (Hello, how are you, friend?)" },
    { word: "gracias", english: "Thank you", example: "Example: 'Muchas gracias por la comida' (Thank you very much for the food)" },
    { word: "adiós", english: "Goodbye", example: "Example: 'Gracias, adiós' (Thank you, goodbye)" }
  ],
  'food': [
    { word: "pan", english: "Bread", example: "Example: 'El niño come pan' (The boy eats bread)" },
    { word: "queso", english: "Cheese", example: "Example: 'El queso es amarillo' (The cheese is yellow)" },
    { word: "fruta", english: "Fruit", example: "Example: 'La manzana es una fruta' (The apple is a fruit)" },
    { word: "agua", english: "Water", example: "Example: 'El perro bebe agua' (The dog drinks water)" }
  ],
  'travel': [
    { word: "avión", english: "Airplane", example: "Example: 'El avión es grande' (The airplane is big)" },
    { word: "tren", english: "Train", example: "Example: 'El tren llega a la estación' (The train arrives at the station)" },
    { word: "maleta", english: "Suitcase", example: "Example: 'Yo llevo una maleta' (I carry a suitcase)" },
    { word: "viaje", english: "Trip/Journey", example: "Example: 'Buen viaje, amigo' (Have a good trip, friend)" }
  ],
  'animals': [
    { word: "perro", english: "Dog", example: "Example: 'El perro y el gato' (The dog and the cat)" },
    { word: "gato", english: "Cat", example: "Example: 'El gato bebe leche' (The cat drinks milk)" },
    { word: "pájaro", english: "Bird", example: "Example: 'El pájaro vuela' (The bird flies)" },
    { word: "caballo", english: "Horse", example: "Example: 'El caballo corre rápido' (The horse runs fast)" },
    { word: "pez", english: "Fish", example: "Example: 'El pez vive en the water' (The fish lives in the water)" }
  ],
  'clothing': [
    { word: "camisa", english: "Shirt", example: "Example: 'La camisa es blanca' (The shirt is white)" },
    { word: "zapatos", english: "Shoes", example: "Example: 'Los zapatos son negros' (The shoes are black)" },
    { word: "pantalones", english: "Pants", example: "Example: 'El niño lleva pantalones' (The boy wears pants)" },
    { word: "sombrero", english: "Hat", example: "Example: 'El sombrero es elegante' (The hat is elegant)" }
  ],
  'sports': [
    { word: "fútbol", english: "Soccer", example: "Example: 'Me gusta jugar al fútbol' (I like to play soccer)" },
    { word: "tenis", english: "Tennis", example: "Example: 'El tenis es un deporte' (Tennis is a sport)" },
    { word: "correr", english: "To run", example: "Example: 'Me gusta correr en el parque' (I like to run in the park)" },
    { word: "juego", english: "Game", example: "Example: 'El juego de fútbol' (The soccer game)" }
  ],
  'colors': [
    { word: "rojo", english: "Red", example: "Example: 'La manzana es roja' (The apple is red)" },
    { word: "azul", english: "Blue", example: "Example: 'El cielo es azul' (The sky is blue)" },
    { word: "verde", english: "Green", example: "Example: 'El césped es verde' (The grass is green)" },
    { word: "amarillo", english: "Yellow", example: "Example: 'El sol es amarillo' (The sun is yellow)" }
  ],
  'tech': [
    { word: "computadora", english: "Computer", example: "Example: 'Yo uso la computadora' (I use the computer)" },
    { word: "ratón", english: "Mouse", example: "Example: 'El ratón de la computadora' (The computer mouse)" },
    { word: "teclado", english: "Keyboard", example: "Example: 'El teclado tiene teclas' (The keyboard has keys)" },
    { word: "pantalla", english: "Screen/Monitor", example: "Example: 'La pantalla es brillante' (The screen is bright)" }
  ],
  'hobby-golf': [
    { word: "hoyo", english: "Hole", example: "Example: 'La pelota está en el hoyo' (The ball is in the hole)" },
    { word: "palo", english: "Club", example: "Example: 'El palo es verde' (The club is green)" },
    { word: "pelota", english: "Ball", example: "Example: 'El niño golpea la pelota' (The boy hits the ball)" },
    { word: "verde", english: "Green", example: "Example: 'El césped es verde' (The grass is green)" }
  ],
  'hobby-gaming': [
    { word: "consola", english: "Console", example: "Example: 'Yo juego en la consola' (I play on the console)" },
    { word: "juego", english: "Game", example: "Example: 'El juego es divertido' (The game is fun)" },
    { word: "nivel", english: "Level", example: "Example: 'El nivel es difícil' (The level is difficult)" },
    { word: "control", english: "Controller", example: "Example: 'El juego tiene un control' (The game has a controller)" }
  ],
  'hobby-cooking': [
    { word: "cocina", english: "Kitchen", example: "Example: 'Yo cocino en la cocina' (I cook in the kitchen)" },
    { word: "sartén", english: "Pan", example: "Example: 'El niño usa la sartén' (The boy uses the pan)" },
    { word: "fuego", english: "Fire", example: "Example: 'El fuego está caliente' (The fire is hot)" },
    { word: "receta", english: "Recipe", example: "Example: 'La receta es muy fácil' (The recipe is very easy)" }
  ],
  'hobby-reading': [
    { word: "libro", english: "Book", example: "Example: 'El niño lee el libro' (The boy reads the book)" },
    { word: "página", english: "Page", example: "Example: 'La página es blanca' (The page is white)" },
    { word: "leer", english: "Read", example: "Example: 'Me gusta leer' (I like to read)" },
    { word: "historia", english: "Story", example: "Example: 'Yo leo una historia' (I read a story)" }
  ]
};

// Log queries and backend operations to CRT console drawer
function logToConsole(message, type = 'info') {
  const container = document.getElementById('console-logs');
  if (!container) return;
  
  if (container.children.length > 30) {
    container.removeChild(container.firstChild);
  }
  
  const p = document.createElement('p');
  p.className = `log-${type}`;
  
  const time = new Date().toLocaleTimeString();
  p.innerText = `[${time}] ${message}`;
  container.appendChild(p);
  
  container.scrollTop = container.scrollHeight;
}

// Simulates slow query if caching is disabled
function runQuery(sqlQuery, callback) {
  logToConsole(`[MYSQL] Executing: ${sqlQuery}`, 'query');
  
  if (!db.users.cache_enabled) {
    logToConsole(`[MYSQL WARNING] Deep Join Detected. Query blocking thread...`, 'warning');
    document.body.style.cursor = 'wait';
    audio.playHddClick();
    
    setTimeout(() => {
      document.body.style.cursor = 'default';
      logToConsole(`[MYSQL] Query returned in 520ms (Disk read hit).`, 'info');
      callback();
    }, 520);
  } else {
    logToConsole(`[MYSQL] Caching Hit! Query returned denormalized in 0ms (In-Memory Key).`, 'info');
    callback();
  }
}

// Enable/Disable caching from the HTML checkbox
function toggleDbCache(enabled) {
  db.users.cache_enabled = enabled;
  logToConsole(`[PHP] config.inc.php: SET DB_CACHE = ${enabled ? 'true' : 'false'}.`);
  if (enabled) {
    logToConsole(`[PHP] Cleared stale MySQL cache pools. Serializing tables users, streaks, lessons.`, 'info');
  }
}

// Reset Database to initial state
function resetDatabaseState() {
  db.users.streak = 3;
  db.users.lingots = 15;
  db.users.outfit = 'default';
  db.users.streak_freezes = 0;
  db.users.has_tracksuit = false;
  db.users.learned_words = [];
  
  db.lessons['basics-1'].completed = false;
  db.lessons['basics-1'].current_step = 3;
  db.lessons['phrases'].completed = false;
  db.lessons['phrases'].current_step = 0;
  
  const list = ['food', 'travel', 'animals', 'clothing', 'sports', 'colors', 'tech', 'hobby'];
  list.forEach(node => {
    db.lessons[node].completed = false;
    db.lessons[node].locked = true;
  });
  db.lessons['hobby'].completed = false;
  
  document.getElementById('buy-tracksuit-btn').innerText = 'Buy (5 Lingots)';
  document.getElementById('buy-tracksuit-btn').disabled = false;
  
  openHobbyWizard();
  updateDashboardUI();
  logToConsole(`[MYSQL] TRUNCATE TABLE users, user_streaks, user_lessons, user_vocabulary; -- DB RESET`, 'warning');
  alert("Database state re-initialized to default values.");
}


// ==========================================================================
// 3. UI Application Logic (Desktop window drag, minimize, maximize)
// ==========================================================================
let isBooted = false;
function startSystemBoot() {
  if (isBooted) return;
  isBooted = true;
  
  audio.init();
  if (audio.ctx && audio.ctx.state === 'suspended') {
    audio.ctx.resume();
  }
  audio.playHddClick();
  
  const statusEl = document.getElementById('boot-status');
  if (statusEl) {
    statusEl.innerText = "Starting Windows Vista...";
    statusEl.style.color = "#fff";
    statusEl.style.animation = "none";
  }
  
  const loaderEl = document.getElementById('boot-loader');
  if (loaderEl) {
    loaderEl.classList.remove('hidden');
  }
  
  setTimeout(() => {
    audio.playStartup();
    audio.playBackgroundMusic(); // Start synthesized background music and bird chirps loop
    
    document.getElementById('boot-screen').classList.add('hidden');
    document.getElementById('desktop').classList.remove('hidden');
    
    updateDashboardUI();
    initDraggableWindow();
    initSystemTrayTime();
    
    openHobbyWizard();
    startBuddyMessengerSimulation();
    startDuoGuiltTripSimulation();
    initDraggableMascot();
  }, 3500);
}

// Allow boot via keydown
window.addEventListener('keydown', () => {
  startSystemBoot();
});

window.addEventListener('DOMContentLoaded', () => {
  // Loaded, wait for boot gesture click or keypress
});

function initSystemTrayTime() {
  const updateTime = () => {
    const timeEl = document.getElementById('system-time');
    if (timeEl) {
      const now = new Date();
      timeEl.innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };
  updateTime();
  setInterval(updateTime, 60000);
}

// Window Dragging logic
function initDraggableWindow() {
  const windowEl = document.getElementById('duo-window');
  const titlebar = document.getElementById('window-titlebar');
  
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;
  
  titlebar.addEventListener('mousedown', (e) => {
    if (e.target.closest('.titlebar-controls') || e.target.closest('.window-menubar')) return;
    isDragging = true;
    offsetX = e.clientX - windowEl.offsetLeft;
    offsetY = e.clientY - windowEl.offsetTop;
    audio.playHddClick();
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    windowEl.style.left = `${e.clientX - offsetX}px`;
    windowEl.style.top = `${e.clientY - offsetY}px`;
  });
  
  document.addEventListener('mouseup', () => {
    isDragging = false;
  });
}

function openDuoApp() {
  audio.init();
  const win = document.getElementById('duo-window');
  win.classList.remove('hidden');
  win.classList.add('window-active');
  document.getElementById('task-tab-duo').classList.add('active');
  audio.playHddClick();
}

function minimizeWindow() {
  document.getElementById('duo-window').classList.add('hidden');
  document.getElementById('task-tab-duo').classList.remove('active');
}

function toggleMaximizeWindow() {
  audio.init();
  const win = document.getElementById('duo-window');
  if (win.style.width === '100%') {
    win.style.width = '820px';
    win.style.height = '600px';
    win.style.top = '50px';
    win.style.left = '120px';
  } else {
    win.style.width = '100%';
    win.style.height = 'calc(100% - 40px)';
    win.style.top = '0';
    win.style.left = '0';
  }
  audio.playHddClick();
}

function closeWindow() {
  minimizeWindow();
}

function toggleServerLogs() {
  audio.init();
  const drawer = document.getElementById('server-logs-drawer');
  drawer.classList.toggle('hidden');
  audio.playHddClick();
}

// Switch tabs inside Duo App
function switchTab(tabId) {
  audio.init();
  runQuery(`SELECT * FROM bbs_posts JOIN user_profiles JOIN course_progress WHERE tab='${tabId}';`, () => {
    const tabs = ['tab-tree', 'tab-bbs', 'tab-shop'];
    tabs.forEach(t => {
      document.getElementById(t).classList.remove('active');
      document.getElementById(`tab-btn-${t.replace('tab-', '')}`).classList.remove('active');
    });
    
    document.getElementById(tabId).classList.add('active');
    document.getElementById(`tab-btn-${tabId.replace('tab-', '')}`).classList.add('active');
    
    if (tabId === 'tab-bbs') {
      renderBBSLeaderboard();
    }
  });
}

// Windows Start Menu Mock toggle
function openStartMenu() {
  const menu = document.getElementById('start-menu');
  menu.classList.toggle('hidden');
  audio.playHddClick();
}
document.addEventListener('click', (e) => {
  const menu = document.getElementById('start-menu');
  const btn = document.querySelector('.start-btn');
  if (menu && !menu.classList.contains('hidden') && !menu.contains(e.target) && !btn.contains(e.target)) {
    menu.classList.add('hidden');
  }
});


// ==========================================================================
// 4. Update Dashboard UI state from DB variables
// ==========================================================================
function updateDashboardUI() {
  document.getElementById('streak-counter-val').innerText = db.users.streak;
  document.getElementById('shop-lingots-val').innerText = db.users.lingots;
  
  const freezeBadge = document.getElementById('freeze-badge');
  if (db.users.streak_freezes > 0) {
    freezeBadge.style.display = 'inline-block';
  } else {
    freezeBadge.style.display = 'none';
  }
  
  document.getElementById('status-basics-1').innerText = db.lessons['basics-1'].completed ? 'Completed' : `${db.lessons['basics-1'].current_step || 0}/5 Exercises`;
  document.getElementById('status-phrases').innerText = db.lessons['phrases'].completed ? 'Completed' : `${db.lessons['phrases'].current_step || 0}/5 Exercises`;
  
  const updateNodeState = (nodeId, isUnlocked, icon) => {
    const el = document.getElementById(`node-${nodeId}`);
    if (!el) return;
    db.lessons[nodeId].locked = !isUnlocked;
    const iconEl = el.querySelector('.node-icon');
    const statusEl = document.getElementById(`status-${nodeId}`);
    if (isUnlocked) {
      el.classList.remove('locked');
      if (iconEl) iconEl.innerText = icon;
      if (statusEl) {
        statusEl.innerText = db.lessons[nodeId].completed ? 'Completed' : `${db.lessons[nodeId].current_step || 0}/5 Exercises`;
      }
    } else {
      el.classList.add('locked');
      if (iconEl) iconEl.innerText = '🔒';
      if (statusEl) {
        statusEl.innerText = 'Locked';
      }
    }
  };

  // Branching Lock Calculations
  updateNodeState('food', db.lessons['basics-1'].completed, '🍖');
  updateNodeState('travel', db.lessons['basics-1'].completed || db.lessons['phrases'].completed, '✈️');
  updateNodeState('animals', db.lessons['phrases'].completed, '🦁');
  
  updateNodeState('clothing', db.lessons['food'].completed, '👕');
  updateNodeState('sports', db.lessons['travel'].completed, '⚽');
  updateNodeState('colors', db.lessons['animals'].completed, '🎨');
  updateNodeState('tech', db.lessons['animals'].completed, '💻');

  // Custom Hobby Node injection
  const hobbyNode = document.getElementById('node-hobby');
  const hobbyTitle = document.getElementById('node-hobby-title');
  const hobbyIcon = document.getElementById('node-hobby-icon');
  const hobbyStatus = document.getElementById('status-hobby');
  
  if (db.users.hobby && hobbyNode) {
    hobbyNode.style.display = 'flex';
    
    const hobbyNames = {
      golf: { title: 'Golf Spanish', icon: '⛳' },
      gaming: { title: 'Gamer Spanish', icon: '🎮' },
      cooking: { title: 'Cooking Spanish', icon: '🍳' },
      reading: { title: 'Reading Spanish', icon: '📚' }
    };
    
    const info = hobbyNames[db.users.hobby];
    if (hobbyTitle) hobbyTitle.innerText = info.title;
    
    const advancedModulesDone = db.lessons['clothing'].completed || db.lessons['sports'].completed || db.lessons['colors'].completed || db.lessons['tech'].completed;
    
    if (advancedModulesDone || !db.lessons['hobby'].locked) {
      db.lessons['hobby'].locked = false;
      hobbyNode.classList.remove('locked');
      if (hobbyIcon) hobbyIcon.innerText = info.icon;
      if (hobbyStatus) hobbyStatus.innerText = db.lessons['hobby'].completed ? 'Completed' : '0/5 Exercises';
    } else {
      db.lessons['hobby'].locked = true;
      hobbyNode.classList.add('locked');
      if (hobbyIcon) hobbyIcon.innerText = '🔒';
      if (hobbyStatus) hobbyStatus.innerText = 'Locked';
    }
  }
  
  // Sync Mascot avatar
  const mascotImg = document.getElementById('mascot-img');
  if (db.users.outfit === 'tracksuit') {
    mascotImg.style.filter = 'hue-rotate(180deg) brightness(1.2) contrast(1.1)';
    document.getElementById('mascot-bubble').innerHTML = `<p><strong>Duo (Tracksuit Skin):</strong> Looking retro and fresh! Go practice your Spanish now, or else...</p>`;
  } else {
    mascotImg.style.filter = 'none';
  }
}

function checkNodeLock(nodeId) {
  if (db.lessons[nodeId].locked) {
    audio.playError();
    alert("This skill is locked. Complete 'Basics 1' and 'Phrases' first to unlock!");
  } else {
    startLesson(nodeId);
  }
}

function checkHobbyNodeClick() {
  if (db.lessons['hobby'].locked) {
    audio.playError();
    alert("This skill is locked. Complete 'Basics 1' and 'Phrases' first!");
  } else {
    startLesson('hobby');
  }
}

function renderBBSLeaderboard() {
  const tbody = document.getElementById('leaderboard-body');
  tbody.innerHTML = '';
  
  db.bbs_leaderboard.forEach(row => {
    const tr = document.createElement('tr');
    
    let rankBadge = row.rank;
    if (row.rank === 1) rankBadge = `<span class="bbs-rank-gold">🥇 ${row.rank}</span>`;
    else if (row.rank === 2) rankBadge = `<span class="bbs-rank-silver">🥈 ${row.rank}</span>`;
    else if (row.rank === 3) rankBadge = `<span class="bbs-rank-bronze">🥉 ${row.rank}</span>`;
    
    tr.innerHTML = `
      <td>${rankBadge}</td>
      <td><strong>${row.user}</strong></td>
      <td>${row.posts}</td>
      <td>${row.xp} XP</td>
      <td><span class="bbs-tier">${row.tier}</span></td>
    `;
    tbody.appendChild(tr);
  });
}


// ==========================================================================
// 5. Lingot Shop purchase logic
// ==========================================================================
function buyItem(itemId, cost) {
  if (db.users.lingots < cost) {
    audio.playError();
    alert("You don't have enough Lingots! Finish modules or get streaks to earn more.");
    return;
  }
  
  runQuery(`UPDATE users SET lingots = lingots - ${cost} WHERE id = 1;`, () => {
    db.users.lingots -= cost;
    
    if (itemId === 'streak_freeze') {
      db.users.streak_freezes += 1;
      logToConsole(`[MYSQL] INSERT INTO user_inventory (user_id, item_id) VALUES (1, 'streak_freeze');`);
      alert("Purchased Streak Freeze! Stamped in calendar inventory.");
    } else if (itemId === 'tracksuit') {
      db.users.outfit = 'tracksuit';
      db.users.has_tracksuit = true;
      document.getElementById('buy-tracksuit-btn').innerText = 'Equipped';
      document.getElementById('buy-tracksuit-btn').disabled = true;
      logToConsole(`[MYSQL] UPDATE users SET outfit = 'tracksuit' WHERE id = 1;`);
      alert("Duo Tracksuit Skin purchased and equipped!");
    }
    
    updateDashboardUI();
    audio.playCorrect();
  });
}


// ==========================================================================
// 6. Hobby Selection Wizard Actions
// ==========================================================================
function openHobbyWizard() {
  document.getElementById('hobby-wizard-overlay').classList.remove('hidden');
  audio.playHddClick();
}

function completeHobbyWizard() {
  const selected = document.querySelector('input[name="hobby-select"]:checked').value;
  db.users.hobby = selected;
  db.lessons['hobby'].vocab = hobbyVocabMap[selected];
  
  document.getElementById('hobby-wizard-overlay').classList.add('hidden');
  audio.playCorrect();
  
  updateDashboardUI();
  logToConsole(`[PHP] session_save_path() update: User hobby set to '${selected}'.`);
  logToConsole(`[MYSQL] UPDATE users SET hobby='${selected}' WHERE id=1;`, 'query');
}


// ==========================================================================
// 7. Interactive Lesson Module State Machine (PowerPoint PowerPoint 2003)
// ==========================================================================
let currentLessonId = null;
let currentExerciseIndex = 0;
let lessonHearts = 5;
let lessonCombo = 0;
let activeExercises = [];

let activeLectureSlides = [];
let currentPptSlideIndex = 0;

let lessonSessionState = {
  answers_correct: 0,
  xp_gain: 0,
  progress_updated: false
};

function generateDynamicExercises(lessonId) {
  const wordsCount = db.users.learned_words.length;
  logToConsole(`[PHP] Generating exercises. Reusing user vocabulary cache (${wordsCount} words loaded).`);
  
  const hasBasics = db.users.learned_words.includes("el niño");
  
  if (lessonId === 'basics-1') {
    return [
      {
        type: 'drag-drop',
        source: "The boy eats an apple",
        expected: ['block-el-nino', 'block-come', 'block-una-manzana'],
        blocks: ['el niño', 'come', 'una manzana', 'perro', 'leche']
      },
      {
        type: 'pair-matching',
        pairs: [
          { text: 'Hola', pair: 1 }, { text: 'Hello', pair: 1 },
          { text: 'Perro', pair: 2 }, { text: 'Dog', pair: 2 },
          { text: 'Gato', pair: 3 }, { text: 'Cat', pair: 3 },
          { text: 'Leche', pair: 4 }, { text: 'Milk', pair: 4 }
        ]
      },
      {
        type: 'mic-check',
        speech: "Hola, ¿cómo estás?"
      },
      {
        type: 'listening',
        audioPhrase: "El perro bebe leche",
        expectedText: "el perro bebe leche",
        expectedBlocks: ['listening-el', 'listening-perro', 'listening-bebe', 'listening-leche'],
        blocks: ['El', 'perro', 'bebe', 'leche', 'gato', 'agua']
      },
      {
        type: 'translation',
        source: "The cat drinks milk",
        expected: ["el gato bebe leche", "el gato toma leche"]
      }
    ];
  }
  
  if (lessonId === 'phrases') {
    return [
      {
        type: 'drag-drop',
        source: "Hello, how are you?",
        expected: ['block-hola', 'block-como-estas'],
        blocks: ['hola', 'cómo estás', 'gracias', 'adiós', 'niño', 'perro']
      },
      {
        type: 'pair-matching',
        pairs: [
          { text: 'Gracias', pair: 1 }, { text: 'Thank you', pair: 1 },
          { text: 'Adiós', pair: 2 }, { text: 'Goodbye', pair: 2 },
          { text: 'Sí', pair: 3 }, { text: 'Yes', pair: 3 },
          { text: 'No', pair: 4 }, { text: 'No', pair: 4 }
        ]
      },
      {
        type: 'mic-check',
        speech: "Buenos días, gracias"
      },
      {
        type: 'listening',
        audioPhrase: "Gracias, adiós",
        expectedText: "gracias adiós",
        expectedBlocks: ['listening-gracias', 'listening-adios'],
        blocks: ['Gracias', 'adiós', 'sí', 'no', 'hola', 'perro']
      },
      {
        type: 'translation',
        source: "Thank you very much",
        expected: ["muchas gracias", "gracias"]
      }
    ];
  }

  if (lessonId === 'food') {
    return [
      {
        type: 'drag-drop',
        source: hasBasics ? "The boy eats bread" : "The man eats bread",
        expected: hasBasics ? ['block-el-nino', 'block-come', 'block-pan'] : ['block-el-hombre', 'block-come', 'block-pan'],
        blocks: hasBasics ? ['el niño', 'come', 'pan', 'fruta', 'leche', 'queso'] : ['el hombre', 'come', 'pan', 'fruta', 'leche', 'queso']
      },
      {
        type: 'pair-matching',
        pairs: [
          { text: 'Leche', pair: 1 }, { text: 'Milk', pair: 1 },
          { text: 'Pan', pair: 2 }, { text: 'Bread', pair: 2 },
          { text: 'Queso', pair: 3 }, { text: 'Cheese', pair: 3 },
          { text: 'Fruta', pair: 4 }, { text: 'Fruit', pair: 4 }
        ]
      },
      {
        type: 'mic-check',
        speech: "El pan es delicioso"
      },
      {
        type: 'listening',
        audioPhrase: hasBasics ? "El niño bebe agua" : "El hombre bebe agua",
        expectedText: hasBasics ? "el niño bebe agua" : "el hombre bebe agua",
        expectedBlocks: hasBasics ? ['listening-el', 'listening-nino', 'listening-bebe', 'listening-agua'] : ['listening-el', 'listening-hombre', 'listening-bebe', 'listening-agua'],
        blocks: ['El', 'niño', 'bebe', 'agua', 'pan', 'queso', 'hombre']
      },
      {
        type: 'translation',
        source: "The apple is a fruit",
        expected: ["la manzana es una fruta", "manzana es fruta"]
      }
    ];
  }

  if (lessonId === 'animals') {
    return [
      {
        type: 'drag-drop',
        source: "The cat eats a bird",
        expected: ['block-el-gato', 'block-come', 'block-un-pajaro'],
        blocks: ['el gato', 'come', 'un pájaro', 'perro', 'pez', 'caballo']
      },
      {
        type: 'pair-matching',
        pairs: [
          { text: 'Perro', pair: 1 }, { text: 'Dog', pair: 1 },
          { text: 'Gato', pair: 2 }, { text: 'Cat', pair: 2 },
          { text: 'Pájaro', pair: 3 }, { text: 'Bird', pair: 3 },
          { text: 'Pez', pair: 4 }, { text: 'Fish', pair: 4 }
        ]
      },
      {
        type: 'mic-check',
        speech: "El caballo come manzanas"
      },
      {
        type: 'listening',
        audioPhrase: "El perro y el gato",
        expectedText: "el perro y el gato",
        expectedBlocks: ['listening-el', 'listening-perro', 'listening-y', 'listening-el', 'listening-gato'],
        blocks: ['El', 'perro', 'y', 'el', 'gato', 'pájaro', 'pez']
      },
      {
        type: 'translation',
        source: "The bird drinks water",
        expected: ["el pájaro bebe agua", "pájaro bebe agua"]
      }
    ];
  }

  if (lessonId === 'travel') {
    return [
      {
        type: 'drag-drop',
        source: "The airplane is big",
        expected: ['block-el-avion', 'block-es', 'block-grande'],
        blocks: ['el avión', 'es', 'grande', 'tren', 'maleta', 'viaje']
      },
      {
        type: 'pair-matching',
        pairs: [
          { text: 'Avión', pair: 1 }, { text: 'Airplane', pair: 1 },
          { text: 'Tren', pair: 2 }, { text: 'Train', pair: 2 },
          { text: 'Maleta', pair: 3 }, { text: 'Suitcase', pair: 3 },
          { text: 'Viaje', pair: 4 }, { text: 'Trip', pair: 4 }
        ]
      },
      {
        type: 'mic-check',
        speech: "Buen viaje, mi amigo"
      },
      {
        type: 'listening',
        audioPhrase: "Yo llevo una maleta grande",
        expectedText: "yo llevo una maleta grande",
        expectedBlocks: ['listening-yo', 'listening-llevo', 'listening-una', 'listening-maleta', 'listening-grande'],
        blocks: ['Yo', 'llevo', 'una', 'maleta', 'grande', 'tren', 'avión']
      },
      {
        type: 'translation',
        source: "The train arrives",
        expected: ["el tren llega", "tren llega"]
      }
    ];
  }

  if (lessonId === 'clothing') {
    return [
      {
        type: 'drag-drop',
        source: "The shirt is white",
        expected: ['block-la-camisa', 'block-es', 'block-blanca'],
        blocks: ['la camisa', 'es', 'blanca', 'zapatos', 'sombrero', 'pantalones']
      },
      {
        type: 'pair-matching',
        pairs: [
          { text: 'Camisa', pair: 1 }, { text: 'Shirt', pair: 1 },
          { text: 'Zapatos', pair: 2 }, { text: 'Shoes', pair: 2 },
          { text: 'Pantalones', pair: 3 }, { text: 'Pants', pair: 3 },
          { text: 'Sombrero', pair: 4 }, { text: 'Hat', pair: 4 }
        ]
      },
      {
        type: 'mic-check',
        speech: "El sombrero es muy elegante"
      },
      {
        type: 'listening',
        audioPhrase: "El niño lleva pantalones",
        expectedText: "el niño lleva pantalones",
        expectedBlocks: ['listening-el', 'listening-nino', 'listening-lleva', 'listening-pantalones'],
        blocks: ['El', 'niño', 'lleva', 'pantalones', 'camisa', 'zapatos']
      },
      {
        type: 'translation',
        source: "I wear shoes",
        expected: ["yo llevo zapatos", "llevo zapatos"]
      }
    ];
  }

  if (lessonId === 'sports') {
    return [
      {
        type: 'drag-drop',
        source: "The soccer game",
        expected: ['block-el-juego', 'block-de', 'block-futbol'],
        blocks: ['el juego', 'de', 'fútbol', 'tenis', 'correr', 'pelota']
      },
      {
        type: 'pair-matching',
        pairs: [
          { text: 'Fútbol', pair: 1 }, { text: 'Soccer', pair: 1 },
          { text: 'Tenis', pair: 2 }, { text: 'Tennis', pair: 2 },
          { text: 'Correr', pair: 3 }, { text: 'To run', pair: 3 },
          { text: 'Juego', pair: 4 }, { text: 'Game', pair: 4 }
        ]
      },
      {
        type: 'mic-check',
        speech: "Me gusta correr en el parque"
      },
      {
        type: 'listening',
        audioPhrase: "El tenis es un deporte",
        expectedText: "el tenis es un deporte",
        expectedBlocks: ['listening-el', 'listening-tenis', 'listening-es', 'listening-un', 'listening-deporte'],
        blocks: ['El', 'tenis', 'es', 'un', 'deporte', 'fútbol', 'correr']
      },
      {
        type: 'translation',
        source: "I play soccer",
        expected: ["juego al fútbol", "yo juego fútbol", "juego fútbol"]
      }
    ];
  }

  if (lessonId === 'colors') {
    return [
      {
        type: 'drag-drop',
        source: "The apple is red",
        expected: ['block-la-manzana', 'block-es', 'block-roja'],
        blocks: ['la manzana', 'es', 'roja', 'azul', 'verde', 'amarillo']
      },
      {
        type: 'pair-matching',
        pairs: [
          { text: 'Rojo', pair: 1 }, { text: 'Red', pair: 1 },
          { text: 'Azul', pair: 2 }, { text: 'Blue', pair: 2 },
          { text: 'Verde', pair: 3 }, { text: 'Green', pair: 3 },
          { text: 'Amarillo', pair: 4 }, { text: 'Yellow', pair: 4 }
        ]
      },
      {
        type: 'mic-check',
        speech: "El sol es amarillo"
      },
      {
        type: 'listening',
        audioPhrase: "El cielo es azul",
        expectedText: "el cielo es azul",
        expectedBlocks: ['listening-el', 'listening-cielo', 'listening-es', 'listening-azul'],
        blocks: ['El', 'cielo', 'es', 'azul', 'verde', 'rojo']
      },
      {
        type: 'translation',
        source: "The grass is green",
        expected: ["el césped es verde", "la hierba es verde", "césped es verde"]
      }
    ];
  }

  if (lessonId === 'tech') {
    return [
      {
        type: 'drag-drop',
        source: "I use the computer",
        expected: ['block-yo', 'block-uso', 'block-la-computadora'],
        blocks: ['yo', 'uso', 'la computadora', 'ratón', 'teclado', 'pantalla']
      },
      {
        type: 'pair-matching',
        pairs: [
          { text: 'Computadora', pair: 1 }, { text: 'Computer', pair: 1 },
          { text: 'Ratón', pair: 2 }, { text: 'Mouse', pair: 2 },
          { text: 'Teclado', pair: 3 }, { text: 'Keyboard', pair: 3 },
          { text: 'Pantalla', pair: 4 }, { text: 'Screen', pair: 4 }
        ]
      },
      {
        type: 'mic-check',
        speech: "La pantalla es brillante"
      },
      {
        type: 'listening',
        audioPhrase: "El teclado tiene teclas",
        expectedText: "el teclado tiene teclas",
        expectedBlocks: ['listening-el', 'listening-teclado', 'listening-tiene', 'listening-teclas'],
        blocks: ['El', 'teclado', 'tiene', 'teclas', 'ratón', 'pantalla']
      },
      {
        type: 'translation',
        source: "The computer mouse",
        expected: ["el ratón de la computadora", "ratón de computadora", "el ratón de computadora"]
      }
    ];
  }

  if (lessonId === 'hobby') {
    const hobby = db.users.hobby;
    
    if (hobby === 'golf') {
      return [
        {
          type: 'drag-drop',
          source: hasBasics ? "The boy hits the ball" : "The man hits the ball",
          expected: hasBasics ? ['block-el-nino', 'block-golpea', 'block-la-pelota'] : ['block-el-hombre', 'block-golpea', 'block-la-pelota'],
          blocks: hasBasics ? ['el niño', 'golpea', 'la pelota', 'hoyo', 'verde', 'palo'] : ['el hombre', 'golpea', 'la pelota', 'hoyo', 'verde', 'palo']
        },
        {
          type: 'pair-matching',
          pairs: [
            { text: 'Hoyo', pair: 1 }, { text: 'Hole', pair: 1 },
            { text: 'Palo', pair: 2 }, { text: 'Club', pair: 2 },
            { text: 'Pelota', pair: 3 }, { text: 'Ball', pair: 3 },
            { text: 'Verde', pair: 4 }, { text: 'Green', pair: 4 }
          ]
        },
        {
          type: 'mic-check',
          speech: "La pelota está en el hoyo"
        },
        {
          type: 'listening',
          audioPhrase: "El palo es verde",
          expectedText: "el palo es verde",
          expectedBlocks: ['listening-el', 'listening-palo', 'listening-es', 'listening-verde'],
          blocks: ['El', 'palo', 'es', 'verde', 'hoyo', 'pelota']
        },
        {
          type: 'translation',
          source: "I play golf with the club",
          expected: ["juego golf con el palo", "yo juego golf con el palo"]
        }
      ];
    }
    
    if (hobby === 'gaming') {
      return [
        {
          type: 'drag-drop',
          source: hasBasics ? "The boy plays the game" : "The man plays the game",
          expected: hasBasics ? ['block-el-nino', 'block-juega', 'block-el-juego'] : ['block-el-hombre', 'block-juega', 'block-el-juego'],
          blocks: hasBasics ? ['el niño', 'juega', 'el juego', 'consola', 'control', 'nivel'] : ['el hombre', 'juega', 'el juego', 'consola', 'control', 'nivel']
        },
        {
          type: 'pair-matching',
          pairs: [
            { text: 'Consola', pair: 1 }, { text: 'Console', pair: 1 },
            { text: 'Juego', pair: 2 }, { text: 'Game', pair: 2 },
            { text: 'Nivel', pair: 3 }, { text: 'Level', pair: 3 },
            { text: 'Control', pair: 4 }, { text: 'Controller', pair: 4 }
          ]
        },
        {
          type: 'mic-check',
          speech: "El nivel es difícil"
        },
        {
          type: 'listening',
          audioPhrase: "Yo juego en la consola",
          expectedText: "yo juego en la consola",
          expectedBlocks: ['listening-yo', 'listening-juega', 'listening-en', 'listening-la', 'listening-consola'],
          blocks: ['Yo', 'juego', 'en', 'la', 'consola', 'control', 'nivel']
        },
        {
          type: 'translation',
          source: "The game has a controller",
          expected: ["el juego tiene un control", "juego tiene control"]
        }
      ];
    }
    
    if (hobby === 'cooking') {
      return [
        {
          type: 'drag-drop',
          source: hasBasics ? "The boy uses the pan" : "The man uses the pan",
          expected: hasBasics ? ['block-el-nino', 'block-usa', 'block-la-sarten'] : ['block-el-hombre', 'block-usa', 'block-la-sarten'],
          blocks: hasBasics ? ['el niño', 'usa', 'la sartén', 'fuego', 'cocina', 'receta'] : ['el hombre', 'usa', 'la sartén', 'fuego', 'cocina', 'receta']
        },
        {
          type: 'pair-matching',
          pairs: [
            { text: 'Cocina', pair: 1 }, { text: 'Kitchen', pair: 1 },
            { text: 'Sartén', pair: 2 }, { text: 'Pan', pair: 2 },
            { text: 'Fuego', pair: 3 }, { text: 'Fire', pair: 3 },
            { text: 'Receta', pair: 4 }, { text: 'Recipe', pair: 4 }
          ]
        },
        {
          type: 'mic-check',
          speech: "La receta es muy fácil"
        },
        {
          type: 'listening',
          audioPhrase: "El fuego está caliente",
          expectedText: "el fuego está caliente",
          expectedBlocks: ['listening-el', 'listening-fuego', 'listening-esta', 'listening-caliente'],
          blocks: ['El', 'fuego', 'está', 'caliente', 'cocina', 'sartén']
        },
        {
          type: 'translation',
          source: "I cook in the kitchen",
          expected: ["cocino en la cocina", "yo cocino en la cocina"]
        }
      ];
    }
    
    if (hobby === 'reading') {
      return [
        {
          type: 'drag-drop',
          source: hasBasics ? "The boy reads the book" : "The man reads the book",
          expected: hasBasics ? ['block-el-nino', 'block-lee', 'block-el-libro'] : ['block-el-hombre', 'block-lee', 'block-el-libro'],
          blocks: hasBasics ? ['el niño', 'lee', 'el libro', 'página', 'historia', 'leer'] : ['el hombre', 'lee', 'el libro', 'página', 'historia', 'leer']
        },
        {
          type: 'pair-matching',
          pairs: [
            { text: 'Libro', pair: 1 }, { text: 'Book', pair: 1 },
            { text: 'Página', pair: 2 }, { text: 'Page', pair: 2 },
            { text: 'Leer', pair: 3 }, { text: 'Read', pair: 3 },
            { text: 'Historia', pair: 4 }, { text: 'Story', pair: 4 }
          ]
        },
        {
          type: 'mic-check',
          speech: "La página es blanca"
        },
        {
          type: 'listening',
          audioPhrase: "Yo leo una historia",
          expectedText: "yo leo una historia",
          expectedBlocks: ['listening-yo', 'listening-leo', 'listening-una', 'listening-historia'],
          blocks: ['Yo', 'leo', 'una', 'historia', 'libro', 'página']
        },
        {
          type: 'translation',
          source: "The book has a story",
          expected: ["el libro tiene una historia", "libro tiene historia"]
        }
      ];
    }
  }
  
  return [];
}

function startLesson(lessonId) {
  audio.init();
  runQuery(`SELECT * FROM exercises WHERE module_id='${lessonId}' ORDER BY difficulty ASC;`, () => {
    currentLessonId = lessonId;
    currentExerciseIndex = 0;
    lessonHearts = 5;
    lessonCombo = 0;
    
    // Check if slides lecture deck exists
    let deckKey = lessonId;
    if (lessonId === 'hobby') {
      deckKey = `hobby-${db.users.hobby}`;
    }
    
    activeLectureSlides = lectureDecks[deckKey] || [];
    currentPptSlideIndex = 0;
    
    activeExercises = generateDynamicExercises(lessonId);
    
    lessonSessionState = {
      answers_correct: 0,
      xp_gain: 0,
      progress_updated: false
    };
    
    document.getElementById('lesson-overlay').classList.remove('hidden');
    resetHeartsUI();
    updateComboUI();
    
    if (activeLectureSlides.length > 0) {
      launchLectureMode();
    } else {
      launchQuizMode();
    }
    
    logToConsole(`[PHP] session_start(); $_SESSION['lesson_id'] = '${lessonId}'; $_SESSION['hearts'] = 5; -- Transaction flag created`);
  });
}

function launchLectureMode() {
  document.getElementById('lecture-zone').classList.remove('hidden');
  document.getElementById('exercise-zone').classList.add('hidden');
  document.getElementById('lesson-progress-row').style.display = 'none';
  
  // Render outlines
  const sidebar = document.getElementById('ppt-thumbnails');
  sidebar.innerHTML = '';
  activeLectureSlides.forEach((slide, index) => {
    sidebar.innerHTML += `
      <div class="ppt-thumb" id="ppt-thumb-${index}" onclick="selectPptSlide(${index})">
        <span class="ppt-thumb-num">Slide ${index + 1}</span>
        <span class="ppt-thumb-text" style="font-weight: bold; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${slide.word}</span>
      </div>
    `;
  });
  
  loadPptSlide(0);
  logToConsole(`[PHP] PPT PRESENTATION: Loading lecture slides for '${currentLessonId}'...`, 'info');
}

function loadPptSlide(index) {
  currentPptSlideIndex = index;
  
  activeLectureSlides.forEach((_, idx) => {
    const thumb = document.getElementById(`ppt-thumb-${idx}`);
    if (thumb) {
      if (idx === index) thumb.classList.add('active');
      else thumb.classList.remove('active');
    }
  });
  
  const slide = activeLectureSlides[index];
  document.getElementById('ppt-slide-title').innerText = `Vocabulary Presentation - Word ${index + 1}`;
  document.getElementById('lecture-vocab-sp').innerText = slide.word;
  document.getElementById('lecture-vocab-en').innerText = slide.english;
  document.getElementById('lecture-vocab-ex').innerText = slide.example;
  
  document.getElementById('ppt-current-slide-num').innerText = index + 1;
  document.getElementById('ppt-total-slides-num').innerText = activeLectureSlides.length;
  
  document.getElementById('btn-ppt-back').disabled = (index === 0);
  
  const nextBtn = document.getElementById('btn-ppt-next');
  if (index === activeLectureSlides.length - 1) {
    nextBtn.innerText = "Start Quiz >>";
    nextBtn.style.background = 'var(--green-btn-gradient)';
    nextBtn.style.borderColor = '#2f732f';
  } else {
    nextBtn.innerText = "Next >";
    nextBtn.style.background = 'var(--blue-btn-gradient)';
    nextBtn.style.borderColor = 'var(--xp-blue-border)';
  }
  
  playLectureWordSound();
}

function selectPptSlide(index) {
  audio.playHddClick();
  loadPptSlide(index);
}

function navigatePptSlide(direction) {
  const nextIndex = currentPptSlideIndex + direction;
  
  if (nextIndex >= 0 && nextIndex < activeLectureSlides.length) {
    audio.playHddClick();
    loadPptSlide(nextIndex);
  } else if (nextIndex === activeLectureSlides.length) {
    audio.playCorrect();
    commitLectureVocabulary();
  }
}

function playLectureWordSound() {
  const word = activeLectureSlides[currentPptSlideIndex].word;
  audio.playRoboticSpeech(word);
  logToConsole(`[PHP] speech_synth: Pronouncing lecture vocable: "${word}".`);
}

function commitLectureVocabulary() {
  logToConsole(`[PHP] Finished PowerPoint presentation. Registering vocabulary into profile...`, 'info');
  
  activeLectureSlides.forEach(slide => {
    if (!db.users.learned_words.includes(slide.word)) {
      db.users.learned_words.push(slide.word);
      logToConsole(`[MYSQL] INSERT INTO user_vocabulary (user_id, word) VALUES (1, '${slide.word}'); -- Learned Word Cached`);
    }
  });
  
  // Re-generate quiz sentences to reuse these newly committed terms
  activeExercises = generateDynamicExercises(currentLessonId);
  launchQuizMode();
}

function launchQuizMode() {
  document.getElementById('lecture-zone').classList.add('hidden');
  document.getElementById('exercise-zone').classList.remove('hidden');
  document.getElementById('lesson-progress-row').style.display = 'flex';
  
  loadExercise(0);
  logToConsole(`[PHP] PPT CLOSED. Starting quiz exercises for '${currentLessonId}'...`, 'info');
}

function loadExercise(index) {
  currentExerciseIndex = index;
  
  const pct = (index / 5) * 100;
  document.getElementById('lesson-progress-bar').style.width = `${pct}%`;
  
  const panels = ['ex-drag-drop', 'ex-pair-matching', 'ex-mic-check', 'ex-listening', 'ex-translation'];
  panels.forEach(p => document.getElementById(p).classList.add('hidden'));
  
  const currentEx = activeExercises[index];
  
  if (currentEx.type === 'drag-drop') {
    document.getElementById('ex-drag-drop').classList.remove('hidden');
    
    const container = document.getElementById('ex-drag-drop');
    container.querySelector('.source-sentence').innerText = `"${currentEx.source}"`;
    
    const pool = document.getElementById('word-blocks-pool');
    pool.innerHTML = '';
    
    currentEx.blocks.forEach(bText => {
      const cleanId = `block-${bText.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-")}`;
      pool.innerHTML += `<div class="word-block" draggable="true" id="${cleanId}">${bText}</div>`;
    });
    
    initDragDropExercise();
  } else if (currentEx.type === 'pair-matching') {
    document.getElementById('ex-pair-matching').classList.remove('hidden');
    initPairMatchingExercise();
  } else if (currentEx.type === 'mic-check') {
    document.getElementById('ex-mic-check').classList.remove('hidden');
    document.querySelector('.speech-target').innerText = `"${currentEx.speech}"`;
    initMicCheckExercise();
  } else if (currentEx.type === 'listening') {
    document.getElementById('ex-listening').classList.remove('hidden');
    initListeningExercise();
  } else if (currentEx.type === 'translation') {
    document.getElementById('ex-translation').classList.remove('hidden');
    
    const container = document.getElementById('ex-translation');
    container.querySelector('.source-sentence').innerText = `"${currentEx.source}"`;
    
    initTranslationExercise();
  }
  
  document.getElementById('exercise-message').innerText = '';
  document.getElementById('exercise-message').className = 'exercise-message';
  document.getElementById('btn-check-answer').classList.remove('hidden');
  document.getElementById('btn-check-answer').classList.remove('correct-state');
  document.getElementById('btn-next-exercise').classList.add('hidden');
}

function resetHeartsUI() {
  for (let i = 1; i <= 5; i++) {
    const el = document.getElementById(`heart-${i}`);
    el.innerText = '❤️';
    el.classList.remove('shattered');
  }
}

function decrementHearts() {
  if (lessonHearts <= 0) return;
  
  const targetHeart = document.getElementById(`heart-${lessonHearts}`);
  if (targetHeart) {
    targetHeart.innerText = '💔';
    targetHeart.classList.add('shattered');
  }
  
  lessonHearts--;
  lessonCombo = 0;
  updateComboUI();
  
  audio.playError();
  logToConsole(`[PHP] $_SESSION['hearts'] decrement -> ${lessonHearts}.`, 'warning');
  
  if (lessonHearts <= 0) {
    handleGameOver();
  }
}

function handleGameOver() {
  audio.playError();
  alert("GAME OVER! You lost all your hearts. Aborting lesson progress...");
  logToConsole(`[PHP] TRANSACTION ROLLBACK: Lesson session aborted. Discarding $_SESSION transaction flag.`, 'error');
  logToConsole(`[MYSQL] ROLLBACK; -- Reverting database changes`, 'error');
  document.getElementById('lesson-overlay').classList.add('hidden');
}

function updateComboUI() {
  document.getElementById('combo-count-val').innerText = lessonCombo;
  const marquee = document.getElementById('combo-marquee');
  if (lessonCombo >= 5) {
    marquee.style.display = 'inline-block';
  } else {
    marquee.style.display = 'none';
  }
}

function abortLesson() {
  if (confirm("Are you sure you want to quit this lesson? All progress will be lost (transaction rollbacked).")) {
    logToConsole(`[PHP] $_SESSION transaction flag cleared. Database state remains untouched.`, 'warning');
    document.getElementById('lesson-overlay').classList.add('hidden');
  }
}

// --------------------------------------------------------------------------
// Exercise 1: Drag & Drop
// --------------------------------------------------------------------------
function initDragDropExercise() {
  const dropZone = document.getElementById('table-drop-zone');
  const pool = document.getElementById('word-blocks-pool');
  
  const slots = dropZone.querySelectorAll('.table-slot');
  slots.forEach(slot => {
    slot.innerHTML = '';
    slot.removeAttribute('data-block-id');
  });
  
  const blocks = pool.querySelectorAll('.word-block');
  blocks.forEach(block => {
    block.classList.remove('dragged-out');
    block.setAttribute('draggable', 'true');
  });
  
  blocks.forEach(block => {
    block.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', block.id);
      audio.playHddClick();
    });
  });
  
  slots.forEach(slot => {
    slot.addEventListener('dragover', (e) => e.preventDefault());
    slot.addEventListener('drop', (e) => {
      e.preventDefault();
      const blockId = e.dataTransfer.getData('text/plain');
      const block = document.getElementById(blockId);
      
      if (block && !block.classList.contains('dragged-out') && !slot.hasChildNodes()) {
        const clone = document.createElement('div');
        clone.className = 'word-block';
        clone.innerText = block.innerText;
        clone.onclick = () => {
          slot.innerHTML = '';
          slot.removeAttribute('data-block-id');
          block.classList.remove('dragged-out');
          audio.playDropSound();
        };
        
        slot.appendChild(clone);
        slot.setAttribute('data-block-id', blockId);
        block.classList.add('dragged-out');
        audio.playDropSound();
      }
    });
  });
}

function checkDragDropAnswer() {
  const currentEx = activeExercises[currentExerciseIndex];
  const dropZone = document.getElementById('table-drop-zone');
  const slots = dropZone.querySelectorAll('.table-slot');
  
  let correct = true;
  for (let i = 0; i < currentEx.expected.length; i++) {
    const blockId = slots[i].getAttribute('data-block-id');
    if (blockId !== currentEx.expected[i]) {
      correct = false;
      break;
    }
  }
  
  return correct;
}

// --------------------------------------------------------------------------
// Exercise 2: Pair Matching Grid
// --------------------------------------------------------------------------
let selectedCards = [];
let matchedCount = 0;

function initPairMatchingExercise() {
  const grid = document.getElementById('pair-match-grid');
  grid.innerHTML = '';
  selectedCards = [];
  matchedCount = 0;
  
  const currentEx = activeExercises[currentExerciseIndex];
  const words = JSON.parse(JSON.stringify(currentEx.pairs));
  words.sort(() => Math.random() - 0.5);
  
  words.forEach(w => {
    const card = document.createElement('div');
    card.className = 'match-card';
    card.innerText = w.text;
    card.setAttribute('data-pair-id', w.pair);
    card.onclick = () => selectMatchCard(card);
    grid.appendChild(card);
  });
}

function selectMatchCard(card) {
  if (card.classList.contains('matched') || card.classList.contains('selected')) return;
  
  audio.playHddClick();
  card.classList.add('selected');
  selectedCards.push(card);
  
  if (selectedCards.length === 2) {
    const c1 = selectedCards[0];
    const c2 = selectedCards[1];
    const pair1 = c1.getAttribute('data-pair-id');
    const pair2 = c2.getAttribute('data-pair-id');
    
    if (pair1 === pair2) {
      c1.classList.remove('selected');
      c2.classList.remove('selected');
      c1.classList.add('matched');
      c2.classList.add('matched');
      
      audio.playCorrect();
      matchedCount += 2;
      selectedCards = [];
      
      if (matchedCount === 8) {
        logToConsole(`[PHP] pair_match_validation: Completed matching grid module with 100% precision.`);
      }
    } else {
      setTimeout(() => {
        c1.classList.remove('selected');
        c2.classList.remove('selected');
        audio.playError();
      }, 500);
      selectedCards = [];
    }
  }
}

function checkPairMatchingAnswer() {
  return matchedCount === 8;
}

// --------------------------------------------------------------------------
// Exercise 3: Simulated Flash Mic Access
// --------------------------------------------------------------------------
let flashMicAllowed = false;
let isRecordingMic = false;
let uploadTimer = null;

function initMicCheckExercise() {
  flashMicAllowed = false;
  isRecordingMic = false;
  
  document.getElementById('flash-dialog').classList.remove('hidden');
  document.getElementById('voice-recorder-widget').classList.add('locked-mic');
  document.getElementById('btn-record-mic').disabled = true;
  document.getElementById('recorder-display').innerText = 'Flash Mic Access: BLOCKED';
  document.getElementById('upload-progress-container').classList.add('hidden');
  document.getElementById('upload-progress-fill').style.width = '0%';
}

function allowFlashMic() {
  flashMicAllowed = true;
  audio.playCorrect();
  
  document.getElementById('flash-dialog').classList.add('hidden');
  document.getElementById('voice-recorder-widget').classList.remove('locked-mic');
  
  const recBtn = document.getElementById('btn-record-mic');
  recBtn.disabled = false;
  
  document.getElementById('recorder-display').innerText = 'READY (Click Record)';
  logToConsole(`[PHP] Macromedia Flash Player 8 authorization callback: Microphone permissions GRANTED.`, 'info');
}

function denyFlashMic() {
  flashMicAllowed = false;
  audio.playError();
  alert("Mic permission denied. Flash Player 8 could not register microphone capture drivers.");
  logToConsole(`[PHP] Macromedia Flash Player 8 authorization callback: Microphone permissions DENIED.`, 'error');
}

function toggleRecordMic() {
  if (!flashMicAllowed) return;
  const recBtn = document.getElementById('btn-record-mic');
  
  if (!isRecordingMic) {
    isRecordingMic = true;
    recBtn.innerText = '🔴 Stop Recording';
    recBtn.classList.add('recording');
    
    const currentEx = activeExercises[currentExerciseIndex];
    document.getElementById('recorder-display').innerText = `RECORDING SPEECH: "${currentEx.speech}"`;
    logToConsole(`[PHP] Capture stream: opening audio recording pipeline...`);
    
    setTimeout(() => {
      if (isRecordingMic) {
        toggleRecordMic();
      }
    }, 3000);
  } else {
    isRecordingMic = false;
    recBtn.innerText = '🎙️ Record';
    recBtn.classList.remove('recording');
    recBtn.disabled = true;
    document.getElementById('recorder-display').innerText = 'Processing recorded waveform...';
    
    simulateWavUpload();
  }
}

function simulateWavUpload() {
  const container = document.getElementById('upload-progress-container');
  const bar = document.getElementById('upload-progress-fill');
  const label = document.getElementById('upload-progress-label');
  
  container.classList.remove('hidden');
  label.innerText = 'Encoding speech to local_temp_file.wav...';
  
  let progress = 0;
  uploadTimer = setInterval(() => {
    progress += 20;
    bar.style.width = `${progress}%`;
    
    if (progress === 40) {
      label.innerText = 'Uploading WAV file to php-bin/upload_speech.php...';
      logToConsole(`[PHP] upload_speech.php: Initiating multipart form upload (file size: 340KB)...`);
    } else if (progress === 80) {
      label.innerText = 'Server processing: offline speech-to-text alignment...';
      logToConsole(`[PHP] exec("bin/speech_validate temp_upload_7482.wav"); -- Offline process triggered`, 'info');
      logToConsole(`[MYSQL] INSERT INTO speech_validation_queue (session_id, file_path, status) VALUES (1, 'temp_7482.wav', 'pending');`, 'query');
    } else if (progress >= 100) {
      clearInterval(uploadTimer);
      label.innerText = 'Upload & Offline Speech Check complete!';
      
      const currentEx = activeExercises[currentExerciseIndex];
      const matchWord = currentEx.speech.toLowerCase().replace(/[?,!¿]/g, '');
      document.getElementById('recorder-display').innerText = `SPEECH VALIDATED (Match: "${matchWord}")`;
      logToConsole(`[SHELL] speech_validate result: Confidence score 94% (Match: '${matchWord}').`, 'info');
      logToConsole(`[PHP] validation_complete.php: Speech verified! Transaction flag status = SUCCESS.`, 'info');
      
      flashMicAllowed = 'done';
      document.getElementById('btn-record-mic').disabled = false;
    }
    audio.playHddClick();
  }, 600);
}

function checkMicCheckAnswer() {
  return flashMicAllowed === 'done';
}

// --------------------------------------------------------------------------
// Exercise 4: Winamp listening translation (Dual-input setup)
// --------------------------------------------------------------------------
let isWinampPlaying = false;
let winampTimer = null;

function initListeningExercise() {
  isWinampPlaying = false;
  document.getElementById('winamp-time').innerText = '00:00';
  document.getElementById('winamp-transcription').value = '';
  
  const bars = document.querySelectorAll('.vis-bar');
  bars.forEach(bar => bar.style.height = '2px');
  
  const currentEx = activeExercises[currentExerciseIndex];
  
  // Clear listening slot drops
  const dropZone = document.getElementById('listening-drop-zone');
  const slots = dropZone.querySelectorAll('.table-slot');
  slots.forEach(slot => {
    slot.innerHTML = '';
    slot.removeAttribute('data-block-id');
  });
  
  // Render dynamic word blocks
  const pool = document.getElementById('listening-blocks-pool');
  pool.innerHTML = '';
  
  currentEx.blocks.forEach(bText => {
    const cleanId = `listening-${bText.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-")}`;
    pool.innerHTML += `<div class="word-block" draggable="true" id="${cleanId}">${bText}</div>`;
  });
  
  const blocks = pool.querySelectorAll('.word-block');
  blocks.forEach(block => {
    block.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', block.id);
      audio.playHddClick();
    });
  });
  
  slots.forEach(slot => {
    slot.addEventListener('dragover', (e) => e.preventDefault());
    slot.addEventListener('drop', (e) => {
      e.preventDefault();
      const blockId = e.dataTransfer.getData('text/plain');
      const block = document.getElementById(blockId);
      
      if (block && !block.classList.contains('dragged-out') && !slot.hasChildNodes()) {
        const clone = document.createElement('div');
        clone.className = 'word-block';
        clone.innerText = block.innerText;
        clone.onclick = () => {
          slot.innerHTML = '';
          slot.removeAttribute('data-block-id');
          block.classList.remove('dragged-out');
          audio.playDropSound();
        };
        slot.appendChild(clone);
        slot.setAttribute('data-block-id', blockId);
        block.classList.add('dragged-out');
        audio.playDropSound();
      }
    });
  });
}

function playWinampAudio() {
  if (isWinampPlaying) return;
  isWinampPlaying = true;
  audio.playHddClick();
  
  const currentEx = activeExercises[currentExerciseIndex];
  audio.playRoboticSpeech(currentEx.audioPhrase);
  
  logToConsole(`[PHP] play_winamp_stream: Streaming media file: 01._duolingo_spanish_audio.wav (phrase: "${currentEx.audioPhrase}").`);
  
  let elapsed = 0;
  const bars = document.querySelectorAll('.vis-bar');
  
  winampTimer = setInterval(() => {
    elapsed++;
    const sec = elapsed < 10 ? `0${elapsed}` : elapsed;
    document.getElementById('winamp-time').innerText = `00:${sec}`;
    
    bars.forEach(bar => {
      const height = Math.floor(Math.random() * 18) + 2;
      bar.style.height = `${height}px`;
    });
    
    if (elapsed >= 3) {
      stopWinampAudio();
    }
  }, 1000);
}

function stopWinampAudio() {
  clearInterval(winampTimer);
  isWinampPlaying = false;
  document.getElementById('winamp-time').innerText = '00:00';
  
  const bars = document.querySelectorAll('.vis-bar');
  bars.forEach(bar => bar.style.height = '2px');
  audio.playHddClick();
}

function checkListeningAnswer() {
  const currentEx = activeExercises[currentExerciseIndex];
  
  // Typing Check
  const input = document.getElementById('winamp-transcription').value.trim().toLowerCase();
  const normalized = input.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?¿]/g,"").replace(/\s+/g," ");
  const normalizedTarget = currentEx.expectedText.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?¿]/g,"").replace(/\s+/g," ");
  if (normalized === normalizedTarget) return true;
  
  // Drag Drop blocks check
  const dropZone = document.getElementById('listening-drop-zone');
  const slots = dropZone.querySelectorAll('.table-slot');
  let blocksCorrect = true;
  
  for (let i = 0; i < currentEx.expectedBlocks.length; i++) {
    const slotBlockId = slots[i].getAttribute('data-block-id');
    if (slotBlockId !== currentEx.expectedBlocks[i]) {
      blocksCorrect = false;
      break;
    }
  }
  return blocksCorrect;
}

// --------------------------------------------------------------------------
// Exercise 5: General Text Translation
// --------------------------------------------------------------------------
function initTranslationExercise() {
  document.getElementById('translation-input').value = '';
}

function checkTranslationAnswer() {
  const currentEx = activeExercises[currentExerciseIndex];
  const input = document.getElementById('translation-input').value.trim().toLowerCase();
  const normalized = input.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?¿]/g,"").replace(/\s+/g," ");
  
  return currentEx.expected.some(item => {
    const cleanItem = item.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?¿]/g,"").replace(/\s+/g," ");
    return normalized === cleanItem;
  });
}

// --------------------------------------------------------------------------
// Core Lesson actions
// --------------------------------------------------------------------------
function checkExerciseAnswer() {
  let isCorrect = false;
  const ex = activeExercises[currentExerciseIndex];
  
  if (ex.type === 'drag-drop') {
    isCorrect = checkDragDropAnswer();
  } else if (ex.type === 'pair-matching') {
    isCorrect = checkPairMatchingAnswer();
  } else if (ex.type === 'mic-check') {
    isCorrect = checkMicCheckAnswer();
  } else if (ex.type === 'listening') {
    isCorrect = checkListeningAnswer();
  } else if (ex.type === 'translation') {
    isCorrect = checkTranslationAnswer();
  }
  
  const msgEl = document.getElementById('exercise-message');
  
  if (isCorrect) {
    lessonCombo++;
    updateComboUI();
    
    msgEl.innerText = 'EXCELLENT! Correct answer.';
    msgEl.className = 'exercise-message correct';
    audio.playCorrect();
    
    lessonSessionState.answers_correct++;
    lessonSessionState.xp_gain += 10;
    
    document.getElementById('btn-check-answer').classList.add('hidden');
    document.getElementById('btn-next-exercise').classList.remove('hidden');
    
    logToConsole(`[PHP] $_SESSION['answers_correct'] increment -> ${lessonSessionState.answers_correct}`);
  } else {
    msgEl.innerText = 'INCORRECT. Please try again!';
    msgEl.className = 'exercise-message incorrect';
    decrementHearts();
  }
}

function nextExercise() {
  const nextIdx = currentExerciseIndex + 1;
  if (nextIdx < 5) {
    loadExercise(nextIdx);
  } else {
    commitLessonProgress();
  }
}

function commitLessonProgress() {
  logToConsole(`[PHP] Committing lesson transaction...`, 'info');
  const xp = lessonSessionState.xp_gain;
  const lingotReward = 2;
  
  runQuery(`BEGIN TRANSACTION; UPDATE users SET streak = streak + 1, lingots = lingots + ${lingotReward} WHERE id = 1; UPDATE course_progress SET completed=1 WHERE module_id='${currentLessonId}'; COMMIT;`, () => {
    db.users.streak += 1;
    db.users.lingots += lingotReward;
    db.lessons[currentLessonId].completed = true;
    db.lessons[currentLessonId].current_step = 5;
    
    // Add completed vocabulary to learned words list
    const completedVocab = db.lessons[currentLessonId].vocab || [];
    completedVocab.forEach(word => {
      if (!db.users.learned_words.includes(word)) {
        db.users.learned_words.push(word);
        logToConsole(`[MYSQL] INSERT INTO user_vocabulary (user_id, word) VALUES (1, '${word}');`);
      }
    });
    
    logToConsole(`[PHP] Learned words cache rebuilt. Total vocabulary size: ${db.users.learned_words.length} items.`);
    
    db.bbs_leaderboard[3].xp += xp;
    db.bbs_leaderboard[3].posts += 1;
    
    updateDashboardUI();
    document.getElementById('lesson-overlay').classList.add('hidden');
    
    audio.playCorrect();
    logToConsole(`[MYSQL] TRANSACTION SUCCESSFUL: Committed users, streaks, modules updates.`, 'info');
    logToConsole(`[PHP] session_destroy(); -- Transaction clean up completed.`, 'info');
    
    alert(`CONGRATULATIONS! Module completed. You earned +${xp} XP and +${lingotReward} Lingots!`);
  });
}


// ==========================================================================
// 8. Cheat / Hint mechanisms
// ==========================================================================
function unlockAllSkills() {
  const list = ['basics-1', 'phrases', 'food', 'travel', 'animals', 'clothing', 'sports', 'colors', 'tech', 'hobby'];
  list.forEach(node => {
    db.lessons[node].completed = true;
    db.lessons[node].locked = false;
    db.lessons[node].current_step = 5;
  });
  
  db.users.learned_words = [
    "el niño", "come", "una manzana", "leche", "bebe", 
    "hola", "cómo estás", "gracias", "adiós",
    "avión", "tren", "maleta", "viaje",
    "camisa", "zapatos", "pantalones", "sombrero",
    "fútbol", "tenis", "correr", "juego",
    "rojo", "azul", "verde", "amarillo",
    "computadora", "ratón", "teclado", "pantalla"
  ];
  
  updateDashboardUI();
  audio.playCorrect();
  logToConsole(`[MYSQL] UPDATE user_lessons SET completed=1, locked=0; -- UNLOCKED ALL MODULES`, 'warning');
  alert("All skills and custom hobby nodes unlocked!");
}

function revealExerciseAnswer() {
  const ex = activeExercises[currentExerciseIndex];
  audio.playHddClick();
  
  if (ex.type === 'drag-drop') {
    const dropZone = document.getElementById('table-drop-zone');
    const slots = dropZone.querySelectorAll('.table-slot');
    
    ex.expected.forEach((blockId, index) => {
      const block = document.getElementById(blockId);
      if (block) {
        slots[index].innerHTML = '';
        const clone = document.createElement('div');
        clone.className = 'word-block';
        clone.innerText = block.innerText;
        slots[index].appendChild(clone);
        slots[index].setAttribute('data-block-id', blockId);
        block.classList.add('dragged-out');
      }
    });
    logToConsole(`[CHEAT] Revealed Drag and Drop solution.`);
  } else if (ex.type === 'pair-matching') {
    const grid = document.getElementById('pair-match-grid');
    const cards = grid.querySelectorAll('.match-card');
    cards.forEach(c => {
      c.classList.remove('selected');
      c.classList.add('matched');
    });
    matchedCount = 8;
    logToConsole(`[CHEAT] Resolved Pair Matching matrix.`);
  } else if (ex.type === 'mic-check') {
    allowFlashMic();
    toggleRecordMic();
    setTimeout(() => {
      if (isRecordingMic) toggleRecordMic();
    }, 100);
    logToConsole(`[CHEAT] Bypassed Microphone speech validation.`);
  } else if (ex.type === 'listening') {
    document.getElementById('winamp-transcription').value = ex.audioPhrase;
    
    const dropZone = document.getElementById('listening-drop-zone');
    const slots = dropZone.querySelectorAll('.table-slot');
    ex.expectedBlocks.forEach((blockId, index) => {
      const block = document.getElementById(blockId);
      if (block && slots[index]) {
        slots[index].innerHTML = '';
        const clone = document.createElement('div');
        clone.className = 'word-block';
        clone.innerText = block.innerText;
        slots[index].appendChild(clone);
        slots[index].setAttribute('data-block-id', blockId);
        block.classList.add('dragged-out');
      }
    });
    
    logToConsole(`[CHEAT] Revealed Listening text: '${ex.audioPhrase}'.`);
  } else if (ex.type === 'translation') {
    document.getElementById('translation-input').value = ex.expected[0];
    logToConsole(`[CHEAT] Revealed Translation input: '${ex.expected[0]}'.`);
  }
}


// ==========================================================================
// 9. MSN Messenger alerts & Guilt-Trip engine
// ==========================================================================
const buddyAlerts = [
  { title: "xX_SpanishPro_Xx", msg: "completed phrases module! Rank UP." },
  { title: "[NEW MESSAGE FROM DUO]", msg: "These notifications don't seem to be working. I'll just go..." },
  { title: "Vistafan99", msg: "Just posted: 'Aero theme is better than Luna XP!'" },
  { title: "[GUILT ALERT FROM DUO]", msg: "You haven't practiced today. Spanish misses you." },
  { title: "GrammarCop", msg: "Completed Spanish Basics 1 in 45 seconds!" },
  { title: "[SYSTEM MESSENGER]", msg: "Modem connection speed degraded to 32kbps." }
];

function startBuddyMessengerSimulation() {
  setInterval(() => {
    const isLessonActive = !document.getElementById('lesson-overlay').classList.contains('hidden');
    if (!isLessonActive) {
      const idx = Math.floor(Math.random() * buddyAlerts.length);
      const alert = buddyAlerts[idx];
      showMsnToaster(alert.title, alert.msg);
    }
  }, 45000);
}

function showMsnToaster(title, msg) {
  const toaster = document.getElementById('msn-toaster');
  document.getElementById('toaster-title').innerText = title;
  document.getElementById('toaster-msg').innerText = msg;
  
  audio.playBBSChime();
  toaster.classList.add('show');
  
  logToConsole(`[PHP] MSN Alert trigger: ${title} -> "${msg}"`);
  
  setTimeout(() => {
    hideToaster();
  }, 6000);
}

function hideToaster() {
  const toaster = document.getElementById('msn-toaster');
  if (toaster) {
    toaster.classList.remove('show');
  }
}

// ==========================================================================
// 10. AI Settings Properties Pane & Guilt-Trip Agent Logic
// ==========================================================================

function switchPropTab(tabName) {
  const tabs = ['engine', 'keys'];
  tabs.forEach(t => {
    const tabEl = document.getElementById(`prop-tab-${t}`);
    const panelEl = document.getElementById(`prop-panel-${t}`);
    if (t === tabName) {
      tabEl.classList.add('active');
      tabEl.style.background = '#fff';
      tabEl.style.fontWeight = 'bold';
      panelEl.style.display = 'flex';
    } else {
      tabEl.classList.remove('active');
      tabEl.style.background = '#e0e0e0';
      tabEl.style.fontWeight = 'normal';
      panelEl.style.display = 'none';
    }
  });
  audio.playHddClick();
}

function openSettingsWizard() {
  audio.playHddClick();
  fetch('/api/settings')
    .then(res => res.json())
    .then(data => {
      document.getElementById('settings-gemini-key').value = data.gemini_key || '';
      document.getElementById('settings-openai-key').value = data.openai_key || '';
      document.getElementById('settings-ollama-url').value = data.ollama_url || 'http://localhost:11434';
      
      const engineRadios = document.getElementsByName('engine-select');
      engineRadios.forEach(radio => {
        if (radio.value === data.engine) {
          radio.checked = true;
        }
      });
      
      document.getElementById('settings-fallback-checkbox').checked = data.fallback_to_local;
      document.getElementById('settings-sound-checkbox').checked = localStorage.getItem('enable_typewriter_sound') !== 'false';
      
      document.getElementById('settings-wizard-overlay').classList.remove('hidden');
    })
    .catch(err => {
      logToConsole(`[SYSTEM ERROR] Failed to fetch settings: ${err.message}`, 'error');
      // Fallback
      const fallbackData = JSON.parse(localStorage.getItem('ai_settings') || '{}');
      document.getElementById('settings-gemini-key').value = fallbackData.gemini_key || '';
      document.getElementById('settings-openai-key').value = fallbackData.openai_key || '';
      document.getElementById('settings-ollama-url').value = fallbackData.ollama_url || 'http://localhost:11434';
      document.getElementById('settings-fallback-checkbox').checked = fallbackData.fallback_to_local !== false;
      document.getElementById('settings-sound-checkbox').checked = localStorage.getItem('enable_typewriter_sound') !== 'false';
      
      const engineRadios = document.getElementsByName('engine-select');
      engineRadios.forEach(radio => {
        if (radio.value === (fallbackData.engine || 'local_inference')) {
          radio.checked = true;
        }
      });
      
      document.getElementById('settings-wizard-overlay').classList.remove('hidden');
    });
}

function closeSettingsWizard() {
  audio.playHddClick();
  document.getElementById('settings-wizard-overlay').classList.add('hidden');
}

function saveSettingsWizard() {
  audio.playHddClick();
  
  const selectedEngine = document.querySelector('input[name="engine-select"]:checked').value;
  const fallbackToLocal = document.getElementById('settings-fallback-checkbox').checked;
  const soundEnabled = document.getElementById('settings-sound-checkbox').checked;
  const geminiKey = document.getElementById('settings-gemini-key').value;
  const openaiKey = document.getElementById('settings-openai-key').value;
  const ollamaUrl = document.getElementById('settings-ollama-url').value;
  
  localStorage.setItem('enable_typewriter_sound', soundEnabled ? 'true' : 'false');
  
  const payload = {
    engine: selectedEngine,
    fallback_to_local: fallbackToLocal,
    gemini_key: geminiKey,
    openai_key: openaiKey,
    ollama_url: ollamaUrl
  };
  
  localStorage.setItem('ai_settings', JSON.stringify(payload));
  
  fetch('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
    .then(res => res.json())
    .then(data => {
      logToConsole(`[PHP] config.inc.php: Settings written to environment .env.`, 'info');
      alert("Settings saved successfully.");
      document.getElementById('settings-wizard-overlay').classList.add('hidden');
    })
    .catch(err => {
      logToConsole(`[SYSTEM WARNING] Failed to save settings to server: ${err.message}. LocalStorage fallback used.`, 'warning');
      alert("Settings saved locally.");
      document.getElementById('settings-wizard-overlay').classList.add('hidden');
    });
}

let isDuoSpeaking = false;
function triggerManualGuiltTrip() {
  if (isDuoSpeaking) return;
  
  audio.init();
  audio.playHddClick();
  
  const bubble = document.getElementById('floating-duo-bubble');
  const textEl = document.getElementById('floating-duo-bubble-text');
  const avatar = document.getElementById('floating-duo-img');
  
  isDuoSpeaking = true;
  bubble.style.display = 'block';
  textEl.innerHTML = '';
  
  avatar.classList.remove('speaking-flap');
  avatar.classList.add('thinking-nod');
  logToConsole(`[PHP] guilt_trip_agent: Parsing metrics. Querying chosen LLM backend...`, 'info');
  
  const youRow = db.bbs_leaderboard.find(x => x.user.includes("You"));
  const xpValue = youRow ? youRow.xp : 120;
  
  const statePayload = {
    streak: db.users.streak,
    xp: xpValue,
    hour: new Date().getHours(),
    hobby: db.users.hobby || 'golf',
    lingots: db.users.lingots
  };
  
  fetch('/api/guilt-trip', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(statePayload)
  })
    .then(response => {
      avatar.classList.remove('thinking-nod');
      avatar.classList.add('speaking-flap');
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      
      function readStream() {
        reader.read().then(({ done, value }) => {
          if (done) {
            avatar.classList.remove('speaking-flap');
            isDuoSpeaking = false;
            logToConsole(`[PHP] guilt_trip_agent: Raw stream complete.`);
            return;
          }
          
          buffer += decoder.decode(value);
          const lines = buffer.split('\n');
          buffer = lines.pop();
          
          for (const line of lines) {
            const cleanLine = line.trim();
            if (cleanLine.startsWith('data:')) {
              try {
                const jsonStr = cleanLine.substring(5).trim();
                const parsed = JSON.parse(jsonStr);
                
                if (parsed.error) {
                  textEl.innerHTML = `<span style="color:#ff3333; font-weight:bold;">[ERROR] ${parsed.error}</span>`;
                  avatar.classList.remove('speaking-flap');
                  isDuoSpeaking = false;
                  return;
                }
                
                if (parsed.text) {
                  if (parsed.text.startsWith('[SYSTEM WARNING]')) {
                    logToConsole(parsed.text.trim(), 'warning');
                  } else {
                    typewriteText(parsed.text, textEl);
                  }
                }
              } catch (e) {
                console.error("SSE parse error", e);
              }
            }
          }
          readStream();
        });
      }
      readStream();
    })
    .catch(err => {
      avatar.classList.remove('thinking-nod');
      avatar.classList.remove('speaking-flap');
      isDuoSpeaking = false;
      logToConsole(`[SYSTEM ERROR] Guilt trip backend request failed: ${err.message}`, 'error');
      textEl.innerHTML = `<span style="color:#ff3333; font-weight:bold;">Connection failure. Cannot establish network handshake with Duo. OMFG plz run server.py!</span>`;
    });
}

let typewriterQueue = [];
let typewriterInterval = null;

function typewriteText(text, targetEl) {
  for (const char of text) {
    typewriterQueue.push(char);
  }
  
  if (!typewriterInterval) {
    typewriterInterval = setInterval(() => {
      if (typewriterQueue.length === 0) {
        clearInterval(typewriterInterval);
        typewriterInterval = null;
        return;
      }
      
      const char = typewriterQueue.shift();
      if (char === '\n') {
        targetEl.innerHTML += '<br>';
      } else {
        targetEl.innerHTML += char;
      }
      audio.playTypewriterSound();
    }, 30);
  }
}

function startDuoGuiltTripSimulation() {
  setTimeout(() => {
    triggerManualGuiltTrip();
  }, 10000);
  
  setInterval(() => {
    const isLessonActive = !document.getElementById('lesson-overlay').classList.contains('hidden');
    if (!isLessonActive && !isDuoSpeaking) {
      logToConsole(`[PHP] Passive-aggressive trigger: Duo is checking user activity...`);
      triggerManualGuiltTrip();
    }
  }, 75000);
}

function initDraggableMascot() {
  const widget = document.getElementById('floating-duo-widget');
  const avatar = widget.querySelector('.floating-avatar-container');
  const desktop = document.getElementById('desktop');
  
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let offsetX = 0;
  let offsetY = 0;
  let hasMoved = false;
  
  avatar.addEventListener('mousedown', (e) => {
    isDragging = true;
    hasMoved = false;
    
    startX = e.clientX;
    startY = e.clientY;
    
    const rect = widget.getBoundingClientRect();
    const desktopRect = desktop.getBoundingClientRect();
    
    widget.style.bottom = 'auto';
    widget.style.right = 'auto';
    widget.style.left = `${rect.left - desktopRect.left}px`;
    widget.style.top = `${rect.top - desktopRect.top}px`;
    
    offsetX = e.clientX - parseInt(widget.style.left);
    offsetY = e.clientY - parseInt(widget.style.top);
    
    audio.playHddClick();
    
    e.preventDefault();
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.hypot(dx, dy) > 5) {
      hasMoved = true;
    }
    
    let newLeft = e.clientX - offsetX;
    let newTop = e.clientY - offsetY;
    
    const desktopRect = desktop.getBoundingClientRect();
    const widgetRect = widget.getBoundingClientRect();
    
    const maxLeft = desktopRect.width - widgetRect.width;
    const maxTop = desktopRect.height - widgetRect.height;
    
    if (newLeft < 0) newLeft = 0;
    if (newLeft > maxLeft) newLeft = maxLeft;
    if (newTop < 0) newTop = 0;
    if (newTop > maxTop) newTop = maxTop;
    
    widget.style.left = `${newLeft}px`;
    widget.style.top = `${newTop}px`;
  });
  
  document.addEventListener('mouseup', (e) => {
    if (!isDragging) return;
    isDragging = false;
    
    if (!hasMoved) {
      triggerManualGuiltTrip();
    }
  });
}
