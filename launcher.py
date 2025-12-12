#!/usr/bin/env python3
"""
Email Task Manager - Local Launcher
Serves the app locally and manages Windows startup registration.
Uses only Python standard library - no pip installs needed.
"""

import os
import sys
import json
import winreg
import webbrowser
import threading
import http.server
import socketserver
from pathlib import Path
from urllib.parse import parse_qs, urlparse
from functools import partial

# Configuration
APP_NAME = "EmailTaskManager"
PORT = 8080
HOST = "127.0.0.1"
APP_DIR = Path(__file__).parent.resolve()
DATA_DIR = APP_DIR / "data"
STARTUP_REG_PATH = r"Software\Microsoft\Windows\CurrentVersion\Run"

# Ensure data directory exists
DATA_DIR.mkdir(exist_ok=True)


class LocalDataHandler(http.server.SimpleHTTPRequestHandler):
    """Custom handler for serving files and handling local data API."""
    
    def __init__(self, *args, directory=None, **kwargs):
        super().__init__(*args, directory=str(APP_DIR), **kwargs)
    
    def do_GET(self):
        """Handle GET requests including API endpoints."""
        parsed = urlparse(self.path)
        
        if parsed.path == "/api/startup-status":
            self.send_json_response({"enabled": is_startup_enabled()})
        elif parsed.path == "/api/data":
            # Return all local data
            data = load_all_data()
            self.send_json_response(data)
        else:
            # Serve static files
            super().do_GET()
    
    def do_POST(self):
        """Handle POST requests for API endpoints."""
        parsed = urlparse(self.path)
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8') if content_length else "{}"
        
        try:
            data = json.loads(body) if body else {}
        except json.JSONDecodeError:
            data = {}
        
        if parsed.path == "/api/enable-startup":
            success = enable_startup()
            self.send_json_response({"success": success, "enabled": is_startup_enabled()})
        
        elif parsed.path == "/api/disable-startup":
            success = disable_startup()
            self.send_json_response({"success": success, "enabled": is_startup_enabled()})
        
        elif parsed.path == "/api/save-data":
            # Save data locally
            save_all_data(data)
            self.send_json_response({"success": True})
        
        else:
            self.send_error(404, "API endpoint not found")
    
    def send_json_response(self, data):
        """Send a JSON response."""
        response = json.dumps(data).encode('utf-8')
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", len(response))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(response)
    
    def do_OPTIONS(self):
        """Handle CORS preflight requests."""
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
    
    def log_message(self, format, *args):
        """Suppress logging for cleaner output."""
        pass


def get_python_executable():
    """Get the path to the Python executable."""
    return sys.executable


def get_startup_command():
    """Get the command to run at startup."""
    python_exe = get_python_executable()
    script_path = Path(__file__).resolve()
    return f'"{python_exe}" "{script_path}" --background'


def is_startup_enabled():
    """Check if the app is registered for Windows startup."""
    try:
        key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, STARTUP_REG_PATH, 0, winreg.KEY_READ)
        try:
            value, _ = winreg.QueryValueEx(key, APP_NAME)
            winreg.CloseKey(key)
            return True
        except FileNotFoundError:
            winreg.CloseKey(key)
            return False
    except Exception as e:
        print(f"Error checking startup status: {e}")
        return False


def enable_startup():
    """Add the app to Windows startup (user-level, no admin needed)."""
    try:
        key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, STARTUP_REG_PATH, 0, winreg.KEY_SET_VALUE)
        startup_command = get_startup_command()
        winreg.SetValueEx(key, APP_NAME, 0, winreg.REG_SZ, startup_command)
        winreg.CloseKey(key)
        print(f"✓ Added to Windows startup: {APP_NAME}")
        return True
    except Exception as e:
        print(f"✗ Failed to add to startup: {e}")
        return False


def disable_startup():
    """Remove the app from Windows startup."""
    try:
        key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, STARTUP_REG_PATH, 0, winreg.KEY_SET_VALUE)
        try:
            winreg.DeleteValue(key, APP_NAME)
            print(f"✓ Removed from Windows startup: {APP_NAME}")
        except FileNotFoundError:
            print("App was not in startup")
        winreg.CloseKey(key)
        return True
    except Exception as e:
        print(f"✗ Failed to remove from startup: {e}")
        return False


def load_all_data():
    """Load all saved data from local files."""
    data = {}
    data_files = ['tasks', 'emails', 'completedTasks', 'projects', 'meetings', 'settings']
    
    for filename in data_files:
        filepath = DATA_DIR / f"{filename}.json"
        if filepath.exists():
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    data[filename] = json.load(f)
            except Exception as e:
                print(f"Error loading {filename}: {e}")
                data[filename] = []
    
    return data


def save_all_data(data):
    """Save all data to local files."""
    for key, value in data.items():
        filepath = DATA_DIR / f"{key}.json"
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(value, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"Error saving {key}: {e}")


def run_server(open_browser=True):
    """Run the local web server."""
    handler = partial(LocalDataHandler, directory=str(APP_DIR))
    
    with socketserver.TCPServer((HOST, PORT), handler) as httpd:
        url = f"http://{HOST}:{PORT}"
        print(f"""
╔════════════════════════════════════════════════════════════╗
║           Email Task Manager - Local Server                ║
╠════════════════════════════════════════════════════════════╣
║  Server running at: {url:<36} ║
║  Data stored in: {str(DATA_DIR):<39} ║
║                                                            ║
║  Press Ctrl+C to stop the server                           ║
╚════════════════════════════════════════════════════════════╝
""")
        
        if open_browser:
            # Open browser after a short delay
            threading.Timer(0.5, lambda: webbrowser.open(url)).start()
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\nServer stopped.")
            sys.exit(0)


def main():
    """Main entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Email Task Manager Launcher")
    parser.add_argument("--background", action="store_true", 
                        help="Run in background mode (no browser open)")
    parser.add_argument("--enable-startup", action="store_true",
                        help="Add to Windows startup")
    parser.add_argument("--disable-startup", action="store_true",
                        help="Remove from Windows startup")
    parser.add_argument("--status", action="store_true",
                        help="Check startup status")
    
    args = parser.parse_args()
    
    if args.enable_startup:
        enable_startup()
        return
    
    if args.disable_startup:
        disable_startup()
        return
    
    if args.status:
        enabled = is_startup_enabled()
        print(f"Windows startup: {'Enabled' if enabled else 'Disabled'}")
        return
    
    # Run the server
    run_server(open_browser=not args.background)


if __name__ == "__main__":
    main()
