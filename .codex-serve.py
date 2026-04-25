import http.server
import socketserver
import os
os.chdir(r"C:\Users\armin\Documents\New project")
Handler = http.server.SimpleHTTPRequestHandler
with socketserver.TCPServer(("127.0.0.1", 8000), Handler) as httpd:
    httpd.serve_forever()
