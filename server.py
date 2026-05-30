#!/usr/bin/env python3
"""
Local dev server for the macOS Sequoia web clone.

Serves the static app AND exposes a small same-origin proxy at /__proxy?url=...
The proxy fetches pages server-side (from THIS machine's IP) and strips
X-Frame-Options / Content-Security-Policy so the page can be embedded in
Safari's <iframe>. A <base> tag + a tiny click/submit interceptor are injected
so in-frame navigation keeps flowing back through the proxy.

Because the fetch happens from your own network, sites like Google return their
normal pages (no datacenter CAPTCHA), and search actually works.

Run:  python server.py   (defaults to 127.0.0.1:8765)
"""
import http.server
import socketserver
import urllib.request
import urllib.parse
import urllib.error
import gzip
import re
import sys
import ssl

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8765

# Injected into every proxied HTML page so links/forms keep browsing in-frame.
INJECT = """
<script>
(function () {
  var ORIGIN = location.origin;           // our server, e.g. http://127.0.0.1:8765
  function px(u) {
    try { return ORIGIN + '/__proxy?url=' + encodeURIComponent(new URL(u, document.baseURI).href); }
    catch (e) { return u; }
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#' || /^(javascript|mailto|tel):/i.test(href)) return;
    e.preventDefault();
    window.location.href = px(a.href);
  }, true);
  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (!f || (f.method && f.method.toLowerCase() === 'post')) return; // GET forms only
    e.preventDefault();
    var qs = new URLSearchParams(new FormData(f)).toString();
    var action = f.getAttribute('action') ? f.action : document.baseURI;
    window.location.href = px(action + (action.indexOf('?') >= 0 ? '&' : '?') + qs);
  }, true);
})();
</script>
"""

UA = ('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 '
      '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36')

_ssl_ctx = ssl.create_default_context()
# Be forgiving about odd certs on a personal dev box.
_ssl_ctx.check_hostname = False
_ssl_ctx.verify_mode = ssl.CERT_NONE


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Never cache the app's own files — kills stale-module headaches.
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def do_GET(self):
        # /api/proxy is the unified endpoint (also works as a Vercel function);
        # /__proxy kept for backward compatibility.
        if self.path.startswith('/api/proxy') or self.path.startswith('/__proxy'):
            return self._proxy()
        return super().do_GET()

    def _proxy(self):
        params = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
        url = (params.get('url') or [''])[0]
        if not url:
            return self._error(400, 'No URL provided.')
        if not re.match(r'^https?://', url, re.I):
            url = 'https://' + url
        url = url.replace(' ', '%20')  # tolerate raw spaces in the query
        try:
            req = urllib.request.Request(url, headers={
                'User-Agent': UA,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
            })
            with urllib.request.urlopen(req, timeout=20, context=_ssl_ctx) as resp:
                raw = resp.read()
                ctype = resp.headers.get('Content-Type', 'text/html')
                final = resp.geturl()
                if (resp.headers.get('Content-Encoding') or '').lower() == 'gzip':
                    try:
                        raw = gzip.decompress(raw)
                    except OSError:
                        pass
        except urllib.error.HTTPError as e:
            return self._error(e.code, 'The site returned HTTP %s.' % e.code)
        except Exception as e:  # noqa: BLE001
            return self._error(502, 'Could not reach the site. (%s)' % type(e).__name__)

        if 'text/html' in ctype.lower():
            html = raw.decode('utf-8', 'replace')
            base = '<base href="%s">' % final.replace('"', '%22')
            if re.search(r'<head[^>]*>', html, re.I):
                html = re.sub(r'(<head[^>]*>)', lambda m: m.group(1) + base, html, count=1, flags=re.I)
            else:
                html = base + html
            body = (html + INJECT).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        else:
            self.send_response(200)
            self.send_header('Content-Type', ctype)
            self.send_header('Content-Length', str(len(raw)))
            self.end_headers()
            self.wfile.write(raw)

    def _error(self, code, msg):
        body = ("""<!doctype html><html><body style="font-family:-apple-system,system-ui,sans-serif;
          display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;
          margin:0;color:#555;background:#f7f7f9;text-align:center;padding:40px">
          <div style="font-size:54px">🌐</div>
          <h2 style="margin:14px 0 6px;color:#333">Can&rsquo;t load this page</h2>
          <p style="max-width:380px;font-size:14px">%s</p></body></html>""" % msg).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        try:
            self.wfile.write(body)
        except (BrokenPipeError, ConnectionResetError):
            pass

    def log_message(self, *args):
        pass  # quiet


class ThreadingHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True


if __name__ == '__main__':
    with ThreadingHTTPServer(('127.0.0.1', PORT), Handler) as httpd:
        print('macOS clone serving on http://127.0.0.1:%d  (with /__proxy)' % PORT)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            pass
