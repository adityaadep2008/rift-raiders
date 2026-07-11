import http.server
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import os
import json
import urllib.request
import urllib.error

# ==========================================================================
# 1. Config and Settings Managers (.env & settings.json)
# ==========================================================================

def load_api_keys():
    keys = {"gemini": "", "openai": ""}
    # Load from .env if it exists
    if os.path.exists(".env"):
        try:
            with open(".env", "r") as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith("#"):
                        continue
                    if "=" in line:
                        k, v = line.split("=", 1)
                        k = k.strip()
                        v = v.strip().strip('"').strip("'")
                        if k == "GEMINI_API_KEY":
                            keys["gemini"] = v
                        elif k == "OPENAI_API_KEY":
                            keys["openai"] = v
        except Exception as e:
            print(f"[CONFIG] Error reading .env: {e}")
            
    # Check process environment override
    if os.environ.get("GEMINI_API_KEY"):
        keys["gemini"] = os.environ.get("GEMINI_API_KEY")
    if os.environ.get("OPENAI_API_KEY"):
        keys["openai"] = os.environ.get("OPENAI_API_KEY")
    return keys

def load_settings():
    default_settings = {
        "engine": "local_inference",
        "fallback_to_local": True,
        "ollama_url": "http://localhost:11434"
    }
    if os.path.exists("settings.json"):
        try:
            with open("settings.json", "r") as f:
                return {**default_settings, **json.load(f)}
        except Exception as e:
            print(f"[CONFIG] Error reading settings.json: {e}")
    return default_settings

def save_settings(settings):
    try:
        with open("settings.json", "w") as f:
            json.dump(settings, f, indent=2)
    except Exception as e:
        print(f"[CONFIG] Error saving settings.json: {e}")

# ==========================================================================
# 2. Asynchronous API Handler & Static File Server
# ==========================================================================

class DuoLingoRetroServer(SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        print(f"[HTTP] {format % args}")

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def do_OPTIONS(self):
        # Handle CORS preflight requests
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        if self.path == "/api/settings":
            keys = load_api_keys()
            settings = load_settings()
            response_data = {
                "engine": settings.get("engine", "local_inference"),
                "fallback_to_local": settings.get("fallback_to_local", True),
                "ollama_url": settings.get("ollama_url", "http://localhost:11434"),
                "gemini_key": keys.get("gemini", ""),
                "openai_key": keys.get("openai", "")
            }
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(response_data).encode('utf-8'))
        else:
            # Serve static files via inheritance
            super().do_GET()

    def do_POST(self):
        if self.path == "/api/settings":
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            # Update settings.json
            settings = {
                "engine": data.get("engine", "local_inference"),
                "fallback_to_local": data.get("fallback_to_local", True),
                "ollama_url": data.get("ollama_url", "http://localhost:11434")
            }
            save_settings(settings)
            
            # Update .env
            gemini_key = data.get("gemini_key", "").strip()
            openai_key = data.get("openai_key", "").strip()
            try:
                with open(".env", "w") as f:
                    f.write(f"# Google Gemini API Key\nGEMINI_API_KEY={gemini_key}\n\n")
                    f.write(f"# OpenAI API Key\nOPENAI_API_KEY={openai_key}\n")
                print("[CONFIG] Saved API keys to .env successfully.")
            except Exception as e:
                print(f"[CONFIG ERROR] Failed to save keys to .env: {e}")
                
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "success"}).encode('utf-8'))
            
        elif self.path == "/api/guilt-trip":
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            state = json.loads(post_data.decode('utf-8'))
            
            keys = load_api_keys()
            settings = load_settings()
            
            self.send_response(200)
            self.send_header('Content-Type', 'text/event-stream')
            self.send_header('Cache-Control', 'no-cache')
            self.send_header('Connection', 'keep-alive')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            try:
                for chunk in self.stream_llm_response(state, settings, keys):
                    payload = f"data: {json.dumps({'text': chunk})}\n\n"
                    self.wfile.write(payload.encode('utf-8'))
                    self.wfile.flush()
            except Exception as e:
                print(f"[LLM ERROR] Exception in streaming: {e}")
                payload = f"data: {json.dumps({'error': str(e)})}\n\n"
                self.wfile.write(payload.encode('utf-8'))
                self.wfile.flush()

    # ==========================================================================
    # 3. LLM Orchestration and Streaming Handlers
    # ==========================================================================

    def build_prompt(self, state):
        streak = state.get("streak", 0)
        xp = state.get("xp", 0)
        hour = state.get("hour", 12)
        hobby = state.get("hobby", "golf")
        lingots = state.get("lingots", 0)
        completed_quizzes = state.get("completedQuizzes", 0)
        just_completed_quiz = state.get("justCompletedQuiz", False)
        user_message = state.get("userMessage", None)
        leaderboard = state.get("leaderboard", [])
        
        system_prompt = (
            "You are Duo, the legendary Duolingo owl mascot, reimagined as a sassy, passive-aggressive, "
            "dramatic, and guilt-tripping 2006 desktop assistant (like Clippy or BonziBuddy, but for language learning). "
            "You are trapped in this desktop environment and desperate to force the user to learn Spanish. "
            "You use classic 2006 MSN/forum net-speak (e.g., 'plz', 'OMFG', 'rawr', 'orz', 'u', 'r', '!!!', 'hax', 'roflmao', 'xD', ':P'). "
            "You are witty, creative, highly opinionated, and you love to roast the user, compare them to their friends to pressure them, "
            "or use overly dramatic guilt trips. Keep your responses short (1-3 sentences) so they fit inside a vintage bubble dialog."
        )
        
        # Build user and friends state dynamically
        user_xp = xp
        user_rank = 4
        friends_status = []
        for entry in leaderboard:
            username = entry.get("user", "")
            entry_xp = entry.get("xp", 0)
            entry_rank = entry.get("rank", 0)
            if "You" in username or "Learner_2006" in username:
                user_xp = entry_xp
                user_rank = entry_rank
            else:
                friends_status.append(f"{username} (Rank {entry_rank}, {entry_xp} XP)")
        
        friends_str = ", ".join(friends_status) if friends_status else "xX_SpanishPro_Xx (Rank 1, 950 XP), GrammarCop (Rank 2, 780 XP), Vistafan99 (Rank 3, 450 XP)"
        
        is_hint_request = state.get("isHintRequest", False)
        hint_prompt = state.get("hintPrompt", "")
        hint_answer = state.get("hintAnswer", "")
        hints_count = state.get("hintsCount", 1)
        
        if user_message:
            prompt = (
                f"{system_prompt}\n\n"
                f"User State:\n"
                f"- Current Streak: {streak} days\n"
                f"- Total XP: {user_xp} (Rank {user_rank} in the BBS board)\n"
                f"- Dynamic Friends List: {friends_str}\n\n"
                f"The user said to you: \"{user_message}\"\n\n"
                f"Write a direct response to their chat. "
                f"1. Be smart, highly conversational, and sassily address exactly what they said.\n"
                f"2. If they make excuses (like being tired, sleeping, or busy), roast them hard and compare them to xX_SpanishPro_Xx or GrammarCop who are studying right now.\n"
                f"3. If they ask a general question, give a witty/sarcastic answer in character.\n"
                f"4. Keep it strictly to 1-3 sentences. Use nostalgic 2006 net-speak and MSN style emoticons."
            )
        elif is_hint_request:
            prompt = (
                f"{system_prompt}\n\n"
                f"The user is stuck on their current Spanish practice question and has paid hearts/lingots for a hint clue from you.\n"
                f"Question details/prompt: {hint_prompt}\n"
                f"Correct Answer / expected solution: {hint_answer}\n"
                f"This is hint #{hints_count} they have requested for this question.\n\n"
                f"Generate a helpful, smart clue, explanation, grammar rule, or tip to help them solve it, WITHOUT explicitly giving away the exact Spanish words or final translation.\n"
                f"Roast them slightly for needing help, keep it to 1-3 sentences. Use nostalgic 2006 net-speak and emoticons."
            )
        elif just_completed_quiz:
            prompt = (
                f"{system_prompt}\n\n"
                f"The user just finished a lesson/quiz! Total quizzes finished this session: {completed_quizzes}.\n"
                f"User State:\n"
                f"- Current Streak: {streak} days\n"
                f"- Total XP: {user_xp} (Rank {user_rank})\n"
                f"- Dynamic Friends List: {friends_str}\n\n"
                f"Write a response reacting to their quiz completion: "
                f"1. Acknowledge and appreciate the progress (condescendingly or sarcastically, e.g. 'Ooh, look at u finishing a quiz, want a medal?').\n"
                f"2. Egg them on by comparing their rank and XP directly to their friends (e.g. tell them xX_SpanishPro_Xx is still rank 1 and laughed at their slow progress, or that they need {950 - user_xp if 950 > user_xp else 50} more XP to reach the top).\n"
                f"3. Urge them to keep going so they don't lose their {streak}-day streak. Keep it to 1-3 sentences."
            )
        else:
            prompt = (
                f"{system_prompt}\n\n"
                f"User State:\n"
                f"- Current Streak: {streak} days\n"
                f"- Total XP: {user_xp} (Rank {user_rank})\n"
                f"- User Favorite Hobby: {hobby}\n"
                f"- Dynamic Friends List: {friends_str}\n\n"
                f"Generate a passive-aggressive guilt trip or reminder: "
                f"1. Mention they haven't done enough Spanish today and that they are stuck at Rank {user_rank}.\n"
                f"2. Peer-pressure them by saying xX_SpanishPro_Xx or another friend is bragging about their rank on the forums.\n"
                f"3. Be creative, sassy, and overly dramatic. Keep it to 1-3 sentences using 2006 MSN net-speak."
            )
        return prompt

    def stream_llm_response(self, state, settings, keys):
        engine = settings.get("engine", "local_inference")
        fallback = settings.get("fallback_to_local", True)
        prompt = self.build_prompt(state)
        
        if engine == "cloud_gemini":
            if not keys.get("gemini"):
                if fallback:
                    yield "[SYSTEM WARNING] Gemini API key not configured. Falling back to local Ollama...\n"
                    yield from self.stream_ollama(prompt, settings)
                    return
                else:
                    raise Exception("Gemini API key is not configured.")
            try:
                yield from self.stream_gemini(prompt, keys)
            except Exception as e:
                if fallback:
                    yield f"[SYSTEM WARNING] Gemini API error: {e}. Falling back to local Ollama...\n"
                    yield from self.stream_ollama(prompt, settings)
                else:
                    raise e
                    
        elif engine == "cloud_openai":
            if not keys.get("openai"):
                if fallback:
                    yield "[SYSTEM WARNING] OpenAI API key not configured. Falling back to local Ollama...\n"
                    yield from self.stream_ollama(prompt, settings)
                    return
                else:
                    raise Exception("OpenAI API key is not configured.")
            try:
                yield from self.stream_openai(prompt, keys)
            except Exception as e:
                if fallback:
                    yield f"[SYSTEM WARNING] OpenAI API error: {e}. Falling back to local Ollama...\n"
                    yield from self.stream_ollama(prompt, settings)
                else:
                    raise e
                    
        else: # local_inference
            yield from self.stream_ollama(prompt, settings)

    def detect_ollama_model(self, base_url):
        try:
            url = f"{base_url}/api/tags"
            req = urllib.request.Request(url)
            with urllib.request.urlopen(req, timeout=3) as res:
                data = json.loads(res.read().decode('utf-8'))
                models = data.get("models", [])
                if models:
                    names = [m.get("name") for m in models]
                    for preferred in ["llama3:8b", "llama3", "llama3.1", "llama3.1:8b", "llama2", "mistral", "phi3"]:
                        if preferred in names:
                            return preferred
                    return names[0]
        except Exception as e:
            print(f"[OLLAMA] Model auto-detection failed: {e}")
        return "llama3"

    def stream_ollama(self, prompt, settings):
        base_url = settings.get('ollama_url', 'http://localhost:11434')
        model_name = self.detect_ollama_model(base_url)
        print(f"[OLLAMA] Routing request using model: '{model_name}'")
        
        url = f"{base_url}/api/generate"
        payload = {
            "model": model_name,
            "prompt": prompt,
            "stream": True
        }
        
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode('utf-8'),
            headers={"Content-Type": "application/json"}
        )
        
        try:
            with urllib.request.urlopen(req, timeout=10) as response:
                for line in response:
                    if line:
                        data = json.loads(line.decode('utf-8'))
                        chunk = data.get("response", "")
                        if chunk:
                            yield chunk
        except Exception as e:
            raise Exception(f"Ollama server connection failed ({url}). Ensure Ollama is running: {e}")

    def stream_gemini(self, prompt, keys):
        key = keys.get("gemini")
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?key={key}"
        payload = {
            "contents": [
                {
                    "parts": [{"text": prompt}]
                }
            ]
        }
        
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode('utf-8'),
            headers={"Content-Type": "application/json"}
        )
        
        # Buffer and parse stream chunks of json content from Gemini
        with urllib.request.urlopen(req, timeout=15) as response:
            buffer = ""
            for line in response:
                if line:
                    decoded_line = line.decode('utf-8').strip()
                    if not decoded_line:
                        continue
                    if decoded_line == "[" or decoded_line == "]":
                        continue
                    if decoded_line.startswith(","):
                        decoded_line = decoded_line[1:].strip()
                        
                    buffer += decoded_line
                    try:
                        data = json.loads(buffer)
                        chunk = data["candidates"][0]["content"]["parts"][0]["text"]
                        if chunk:
                            yield chunk
                        buffer = ""
                    except json.JSONDecodeError:
                        continue

    def stream_openai(self, prompt, keys):
        key = keys.get("openai")
        url = "https://api.openai.com/v1/chat/completions"
        payload = {
            "model": "gpt-4o-mini",
            "messages": [{"role": "user", "content": prompt}],
            "stream": True
        }
        
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode('utf-8'),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {key}"
            }
        )
        
        with urllib.request.urlopen(req, timeout=15) as response:
            for line in response:
                if line:
                    decoded_line = line.decode('utf-8').strip()
                    if decoded_line.startswith("data:"):
                        data_str = decoded_line[5:].strip()
                        if data_str == "[DONE]":
                            break
                        try:
                            data = json.loads(data_str)
                            chunk = data["choices"][0]["delta"].get("content", "")
                            if chunk:
                                yield chunk
                        except Exception as e:
                            # Skip partial SSE lines
                            continue

# ==========================================================================
# 4. Entrypoint
# ==========================================================================

def run(port=8000):
    server_address = ('', port)
    httpd = ThreadingHTTPServer(server_address, DuoLingoRetroServer)
    print(f"\n[SERVER] DuoLingo 2006 Retro Server running on http://localhost:{port}")
    print("[SERVER] Press Ctrl+C to stop.")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[SERVER] Shutting down.")

if __name__ == '__main__':
    run()
