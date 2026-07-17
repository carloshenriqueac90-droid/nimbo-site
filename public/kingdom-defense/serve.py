# Servidor de desenvolvimento: igual ao http.server, mas sem cache,
# para o navegador sempre pegar a versão mais nova dos módulos JS.
import http.server
import os
import sys

os.chdir(os.path.dirname(os.path.abspath(__file__)))  # serve sempre a pasta do jogo


class SemCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()


if __name__ == '__main__':
    # Porta: variável PORT do ambiente (preview autoPort) > argumento posicional > 8123.
    porta = int(os.environ.get('PORT') or (sys.argv[1] if len(sys.argv) > 1 else 8123))
    http.server.ThreadingHTTPServer(('', porta), SemCache).serve_forever()
