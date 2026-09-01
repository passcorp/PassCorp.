import http.server
import socketserver
import os
import sys
import json
import mimetypes

PORT = 8085
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
os.chdir(BASE_DIR)

mimetypes.add_type('text/css', '.css')
mimetypes.add_type('application/javascript', '.js')
mimetypes.add_type('image/png', '.png')
mimetypes.add_type('image/jpeg', '.jpg')
mimetypes.add_type('image/jpeg', '.jpeg')
mimetypes.add_type('text/html', '.html')

DATA_BACKUP_FILE = os.path.join(BASE_DIR, "pass_invotor_backup.json")

class PassCorpHTTPHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        if self.path == '/' or self.path == '':
            self.path = '/invotor.html'
        elif self.path == '/api/health':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            resp = {"status": "ok", "service": "PASS CORP. Unified Quotor & Invotor Server", "port": PORT}
            self.wfile.write(json.dumps(resp).encode('utf-8'))
            return
        elif self.path == '/api/invotor/backup':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            if os.path.exists(DATA_BACKUP_FILE):
                with open(DATA_BACKUP_FILE, "r", encoding="utf-8") as f:
                    self.wfile.write(f.read().encode('utf-8'))
            else:
                self.wfile.write(json.dumps({"empty": True}).encode('utf-8'))
            return

        super().do_GET()

    def do_POST(self):
        if self.path == '/api/invotor/backup':
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length)
            try:
                data = json.loads(body.decode('utf-8'))
                with open(DATA_BACKUP_FILE, "w", encoding="utf-8") as f:
                    json.dump(data, f, indent=2)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": True, "message": "ERP State backed up"}).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": str(e)}).encode('utf-8'))
            return

        super().do_POST()

if __name__ == '__main__':
    port = PORT
    if len(sys.argv) > 1 and sys.argv[1].isdigit():
        port = int(sys.argv[1])
    socketserver.TCPServer.allow_reuse_address = True
    try:
        with socketserver.TCPServer(("", port), PassCorpHTTPHandler) as httpd:
            print("=" * 65)
            print("🛡️  PASS CORP. — ENTERPRISE ERP & BILLING SERVER")
            print(f"📦  INVOTOR (TallyPrime Style Billing & ERP): http://localhost:{port}/invotor.html")
            print(f"⚡  QUOTOR  (Quotation & PI Generator):      http://localhost:{port}/index.html")
            print("=" * 65)
            httpd.serve_forever()
    except Exception as e:
        print(f"Error starting server on port {port}: {e}")
