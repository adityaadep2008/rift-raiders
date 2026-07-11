# DuoLingo 2006 Edition - Retro Reboot 2026

Welcome to **DuoLingo 2006 Edition**, a nostalgic, skeuomorphic web application that reimagines modern language learning through the lens of early-2000s desktop environments (Windows Vista Aero / Windows XP Luna), combined with a sharp **Aero Brutalism** design language (neon grids, heavy black borders, and cybernetic backgrounds).

The project runs completely in-memory using vanilla HTML, CSS, and JavaScript.

---

## 🚀 How to Run the Program

To run the application locally:

1. **Open a terminal** and navigate to this workspace folder:
   ```bash
   cd /Users/rtsws/Documents/Github/rift-raiders
   ```
2. **Start a local web server**:
   Since the app loads assets (images, scripts, styles) and uses browser-native APIs, it must be served over HTTP rather than opened as a local file (`file://`). You can run the built-in python web server:
   ```bash
   python3 -m http.server 8000
   ```
3. **Open in Browser**:
   Navigate to the local address in your web browser:
   * **URL**: [http://localhost:8000](http://localhost:8000)

---

## 🎮 Key Features & Retro Touches

### 1. Interactive BIOS Boot & Gesture Unlock
- Upon loading, the app displays a retro **Award BIOS V4.51PG** diagnostic boot screen.
- **Audio Activation**: Modern browsers block Web Audio by default. Click the flashing **`[ CLICK HERE OR PRESS ANY KEY TO BOOT SYSTEM ]`** prompt on the boot screen. This registers your user gesture, unlocks Web Audio, plays the Windows Vista startup chime, and starts the background music loop.

### 2. PowerPoint 2003 style Vocabulary Lectures
- Clicking on any active node in the branching 10-node skill tree (**Basics 1**, **Phrases**, **Food**, **Travel**, **Animals**, **Clothing**, **Sports**, **Colors**, **Tech**, or **Custom Hobbies**) opens a **Microsoft PowerPoint 2003** style slide deck.
- Walk through the terms, English translations, and examples.
- Select slides via the left outline thumbnail panel or beveled navigation buttons.
- Click **🗣️ Pronounce** to hear native browser speech synthesis speak the Spanish terms.
- Click **Start Quiz >>** on the last slide to save the vocabulary in-profile and unlock the exercises.

### 3. Skeuomorphic Exercise Suite
- **Mechanical Drag & Drop**: Drag glossy word blocks to snap them into coordinate-locked grids (plays satisfying pop sound effects).
- **Pair Matching Matrix**: Flip cards to match Spanish and English terms, accompanied by correct/error MIDI chimes.
- **Winamp Audio Player**: Play highly compressed audio clips and transcribe the Spanish translation (supports typing and block dropping).
- **Macromedia Flash Player 8 Mic Pop-up**: Requests simulated microphone permission to record waveforms and alignments.

### 4. Aero Brutalist Aesthetics & Custom Wallpaper
- Fuses animated, glossy windows (Frutinger Aero) with heavy solid outlines, blocky offsets, and monospace typography (Techno Brutalism).
- Includes floating animated glass bubbles and a **cybernetic metallic spike wallpaper** (`wallpaper.png`) in the background of the monitor.

---

## 🛠️ Diagnostics & Cheats

### Cheat Codes (For testing without Spanish knowledge)
- **Unlock All Skills**: Click the red **Unlock All Skills** button in the window menubar to immediately bypass progression locks and populate vocabulary caches.
- **Reveal Answer**: Click the **Reveal Answer (Duo Hint)** link inside exercise footers to instantly solve any Drag-and-Drop slots, Pair Matrix pairs, Mic checks, or translation fields.

### Backend console drawer & Diagnostic logs
- Toggle the **Server Logs Drawer** via the taskbar or Start menu to view mock PHP session handshakes and MySQL transactions.
- **Audio Diagnostics**: If sound is not playing on your machine, click anywhere on the page and inspect the logs in this drawer. It prints status updates (e.g. `AudioContext state = "running"` or error reports) to diagnose browser blocks.
- **Debug Banner**: Any JavaScript syntax or unhandled exceptions will display as a bright red error warning banner at the top of the monitor.
