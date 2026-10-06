from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse
from pathlib import Path
import json, webbrowser, threading, time, re

BASE = Path(__file__).resolve().parent
ARTICLES = BASE / "articles"
ARTICLES.mkdir(exist_ok=True)

class Handler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        rel = urlparse(path).path.lstrip("/")
        if not rel:
            rel = "index.html"
        return str((BASE / rel).resolve())

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/articles":
            items = [{"name": p.stem, "file": p.name} for p in sorted(ARTICLES.glob("*.html"))]
            return self.send_json({"articles": items})
        if parsed.path.startswith("/api/article/"):
            name = parsed.path.split("/api/article/", 1)[1]
            p = ARTICLES / safe_filename(name)
            if not p.exists():
                return self.send_json({"error": "not found"}, 404)
            return self.send_json({"file": p.name, "content": p.read_text(encoding="utf-8")})
        return super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        length = int(self.headers.get("Content-Length", "0"))
        data = json.loads(self.rfile.read(length) or b"{}")

        if parsed.path == "/api/save":
            title = data.get("title") or "Untitled Article"
            html = data.get("html") or ""
            filename = safe_filename(data.get("file") or title)
            p = ARTICLES / filename
            p.write_text(html, encoding="utf-8")
            return self.send_json({"ok": True, "file": filename, "path": str(p)})

        if parsed.path == "/api/new":
            title = data.get("title") or "Untitled Article"
            filename = safe_filename(title)
            p = ARTICLES / filename
            stem = p.stem
            i = 2
            while p.exists():
                p = ARTICLES / f"{stem}-{i}.html"
                i += 1
            p.write_text(starter_html(title), encoding="utf-8")
            return self.send_json({
                "ok": True,
                "file": p.name,
                "content": p.read_text(encoding="utf-8")
            })

        return self.send_json({"error": "unsupported"}, 404)

    def log_message(self, fmt, *args):
        pass

    def send_json(self, obj, status=200):
        raw = json.dumps(obj).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

def safe_filename(name):
    name = Path(str(name)).name
    stem = Path(name).stem if name.lower().endswith(".html") else name
    stem = re.sub(r"[^a-zA-Z0-9._-]+", "-", stem).strip("-").lower() or "untitled-article"
    return stem + ".html"

def starter_html(title):
    return (
        '<article class="kb-article">\n'
        f'  <h1>{title}</h1>\n'
        '  <p><strong>Environment:</strong> </p>\n\n'
        '  <h2>Problem</h2>\n'
        '  <p></p>\n\n'
        '  <h2>Resolution</h2>\n'
        '  <ol>\n'
        '    <li></li>\n'
        '  </ol>\n\n'
        '  <h2>Verification</h2>\n'
        '  <p></p>\n'
        '</article>'
    )

def open_browser():
    time.sleep(0.8)
    webbrowser.open("http://127.0.0.1:8765")

if __name__ == "__main__":
    threading.Thread(target=open_browser, daemon=True).start()
    print("ServiceNow KB Autosave is running.")
    print("Close this window to stop the local app.")
    ThreadingHTTPServer(("127.0.0.1", 8765), Handler).serve_forever()
