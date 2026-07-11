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
        
        system_prompt = (
            "You are Duo, a highly persistent, passive-aggressive 2006 language learning assistant trapped in a desktop client. "
            "Analyze the user's progress log, streak metrics, and friend notifications. "
            "Generate dynamic, overly urgent, guilt-inducing reminders telling them to complete their daily lessons. "
            "Utilize mid-2000s net-speak, dramatic pacing, and conversational manipulation. "
            "Keep responses brief enough to fit cleanly inside an early web dialogue alert window."
        )
        
        user_state = (
            f"User State:\n"
            f"- Streak: {streak} days\n"
            f"- Daily XP: {xp}\n"
            f"- Current Hour: {hour}:00\n"
            f"- Hobby: {hobby}\n"
            f"- Lingots Balance: {lingots}\n"
            f"- Friend xX_SpanishPro_Xx XP: 950\n"
            f"- Friend GrammarCop XP: 780\n"
        )
        
        prompt = (
            f"{system_prompt}\n\n"
            f"{user_state}\n\n"
            "Guilt-trip the user with a 2-3 sentence reminder. Use 2006 MSN net-speak (like 'plz', 'OMFG', 'rawr', 'orz', 'u', 'r', '!!!', 'hax', 'roflmao') and dramatic pacing. Speak directly to them. Be passive-aggressive."
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
