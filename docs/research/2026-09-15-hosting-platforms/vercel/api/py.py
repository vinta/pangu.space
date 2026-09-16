import json
from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse

import pangu


# Vercel loads the class named `handler` from each api/*.py file
class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        t = parse_qs(urlparse(self.path).query).get("t", [""])[0]
        body = json.dumps({"text": pangu.spacing_text(t), "lib": "pangu-py", "version": pangu.__version__})
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(body.encode("utf-8"))
