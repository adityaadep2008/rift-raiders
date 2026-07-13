# DuoLingo 2006 Edition - Retro Reboot 2026

Welcome to **DuoLingo 2006 Edition**, a nostalgic, skeuomorphic web application that reimagines modern language learning through the lens of early-2000s desktop environments (Windows Vista Aero / Windows XP Luna), combined with a sharp **Aero Brutalism** design language (neon grids, heavy black borders, and cybernetic backgrounds).

The project runs completely in-memory using vanilla HTML, CSS, and JavaScript.

---

## 🚀 How to Run the Program

To run the application locally:

1. **Open a terminal** and navigate to the project folder.
2. **Start the Backend Server**:
   Since the app runs on a Python server to serve static assets and manage unified payload routing for the AI orchestrator, launch the server:
   ```bash
   python3 server.py
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
- Includes floating animated glass bubbles and a **cybernetic metallic spike wallpaper** (`assets/wallpaper.png`) in the background of the monitor.

### 5. Interactive Desktop Mascot (Duo Assistant)
- Duo floats on your desktop in a Clippy-style widget.
- You can drag him anywhere. He automatically bounds to the screen edges, and his dialogue boxes dynamically reposition to prevent him from clipping off-screen.
- Click on him to open a text chat box to converse directly with him using the configured local or cloud LLM.
- **Dynamic Hints**: Stuck on a question? Click **💡 Get Hint** in any exercise footer. Duo will analyze the exercise and give you a sassy, contextual clue (costing 0.5 hearts, plus 1 Lingot for subsequent hints).

### 6. Lingot Storefront Catalog
- Earn **Lingots** by completing quizzes and practice sessions.
- Spend them in the **Lingot Storefront** (accessible via the taskbar or desktop icon) to purchase befitting early-2000s items:
  - **Streak Freeze** (10 Lingots): Preserves your current streak if you miss a day of practice.
  - **Duo Tracksuit Skin** (5 Lingots): Equips Duo the Owl with a generic blue and gold 2000s tracksuit skin and updates his dialog presentation.

### 7. MSN Messenger-style Buddy List & Toaster Alerts
- A sidebar widget showing your MSN Messenger "buddy list" contacts (like `xX_SpanishPro_Xx` and `Learner_2006`).
- Real-time Leaderboard updates as you and your mock buddies earn XP.
- Pop-up toaster notifications slide up from the system tray with custom sound effects to guilt-trip you or celebrate buddy achievements.

### 8. Course Customization Wizard (Hobby Selection)
- On first boot, the user is greeted by a Windows-style setup wizard.
- Customize your course by choosing a primary hobby (e.g., Golf, Gaming, Cooking, Gardening, etc.), which dynamically loads a custom 10th skill node filled with tailored vocabulary exercises.

## 🤖 AI Orchestrator & Local LLM Setup

The desktop mascot widget (Duo) utilizes a hybrid AI orchestrator to generate dynamic, passive-aggressive reminders and guilt-trips. You can configure it to run on one of three engines:
1. **Local Inference**: Runs a local LLM via Ollama on port `11434`.
2. **Cloud Gemini**: Connects to Google GenAI endpoints (uses API key).
3. **Cloud OpenAI**: Connects to OpenAI Chat Completions (uses API key).

### ⚙️ Setting Up API Credentials (.env)
To use Cloud engines (Gemini/OpenAI), copy your credentials into the `.env` file in the project root:
```env
GEMINI_API_KEY=your_gemini_key_here
OPENAI_API_KEY=your_openai_key_here
```
*Note: You can also update these directly in the UI settings window, which automatically saves them to the `.env` file!*

---

### 🖥️ Local Ollama Setup (Free, Offline)

To run inference completely locally without paying for API keys, follow these instructions:

#### 🍎 macOS (Homebrew or direct installer)
1. **Install Ollama**:
   Using Homebrew:
   ```bash
   brew install ollama
   ```
   Or download the macOS App installer from [ollama.com/download](https://ollama.com/download).
2. **Start the Ollama daemon**:
   ```bash
   ollama serve
   ```
   *(If you downloaded the desktop app, simply launching the app will start the background daemon).*
3. **Download Llama 3**:
   ```bash
   ollama run llama3:8b
   ```
4. Once downloaded, you can close the terminal. The project's backend server auto-detects model tags like `llama3:8b` and communicates with the daemon on `http://localhost:11434`.

#### 🪟 Windows (Direct Installer)
1. **Download & Install**:
   Download the installer from [ollama.com/download](https://ollama.com/download) and run the installer executable.
2. **Run Llama 3**:
   Open Command Prompt (`cmd`) or PowerShell, and run:
   ```cmd
   ollama run llama3:8b
   ```
3. Once the download completes and the prompt appears, you can exit the terminal.

#### 🔧 Project Configuration
1. Start the project's backend server: `python3 server.py`.
2. In the booted desktop, click on the **AI Settings** menu item in the menubar.
3. Select **Local Inference (Ollama / Llama.cpp)** as the hybrid mode.
4. Click **OK** to apply. Drag Duo wherever you want, and click the floating mascot to test!

---

## 🛠️ Diagnostics & Cheats

### Cheat Codes (For testing without Spanish knowledge)
- **Unlock All Skills**: Click the red **Unlock All Skills** button in the window menubar to immediately bypass progression locks and populate vocabulary caches.
- **Dev Bypass**: Click the **Dev Bypass** button inside exercise footers to instantly solve any Drag-and-Drop slots, Pair Matrix pairs, Mic checks, or translation fields.

### Backend console drawer & Diagnostic logs
- Toggle the **Server Logs Drawer** via the taskbar or Start menu to view mock PHP session handshakes and MySQL transactions.
- **Audio Diagnostics**: If sound is not playing on your machine, click anywhere on the page and inspect the logs in this drawer. It prints status updates (e.g. `AudioContext state = "running"` or error reports) to diagnose browser blocks.
- **Debug Banner**: Any JavaScript syntax or unhandled exceptions will display as a bright red error warning banner at the top of the monitor.
