"""
Vercel serverless function: /api/proxy?url=<encoded URL>

Same idea as the local server.py proxy — fetch a page server-side, strip the
frame-blocking headers, inject a <base> tag + link/form interceptor so the page
renders (and keeps browsing) inside Safari's iframe.

Note: on Vercel the fetch comes from a datacenter IP, so some sites (Google,
Cloudflare-protected pages) may show a CAPTCHA. Running locally via
`python server.py` uses your own IP and works more broadly.
"""
from http.server import BaseHTTPRequestHandler
import urllib.request
import urllib.parse
import urllib.error
import gzip
import re
import ssl

INJECT = """
<script>
(function () {
  var ORIGIN = location.origin;
  function px(u) {
    try { return ORIGIN + '/api/proxy?url=' + encodeURIComponent(new URL(u, document.baseURI).href); }
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
    if (!f || (f.method && f.method.toLowerCase() === 'post')) return;
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

_ctx = ssl.create_default_context()
_ctx.check_hostname = False
_ctx.verify_mode = ssl.CERT_NONE


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        params = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
        url = (params.get('url') or [''])[0]
        if not url:
            return self._send(400, 'text/html; charset=utf-8', self._err('No URL provided.'))
        if not re.match(r'^https?://', url, re.I):
            url = 'https://' + url
        url = url.replace(' ', '%20')
        try:
            req = urllib.request.Request(url, headers={
                'User-Agent': UA,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
            })
            with urllib.request.urlopen(req, timeout=9, context=_ctx) as resp:
                raw = resp.read()
                ctype = resp.headers.get('Content-Type', 'text/html')
                final = resp.geturl()
                if (resp.headers.get('Content-Encoding') or '').lower() == 'gzip':
                    try:
                        raw = gzip.decompress(raw)
                    except OSError:
                        pass
        except urllib.error.HTTPError as e:
            return self._send(200, 'text/html; charset=utf-8', self._err('The site returned HTTP %s.' % e.code))
        except Exception as e:  # noqa: BLE001
            return self._send(200, 'text/html; charset=utf-8', self._err('Could not reach the site. (%s)' % type(e).__name__))

        if 'text/html' in ctype.lower():
            html = raw.decode('utf-8', 'replace')
            base = '<base href="%s">' % final.replace('"', '%22')
            if re.search(r'<head[^>]*>', html, re.I):
                html = re.sub(r'(<head[^>]*>)', lambda m: m.group(1) + base, html, count=1, flags=re.I)
            else:
                html = base + html
            return self._send(200, 'text/html; charset=utf-8', (html + INJECT).encode('utf-8'))
        return self._send(200, ctype, raw)

    def _send(self, code, ctype, body):
        self.send_response(code)
        self.send_header('Content-Type', ctype)
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        try:
            self.wfile.write(body)
        except (BrokenPipeError, ConnectionResetError):
            pass

    def _err(self, msg):
        return ("""<!doctype html><html><body style="font-family:-apple-system,system-ui,sans-serif;
          display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;
          margin:0;color:#555;background:#f7f7f9;text-align:center;padding:40px">
          <div style="font-size:54px">🌐</div>
          <h2 style="margin:14px 0 6px;color:#333">Can&rsquo;t load this page</h2>
          <p style="max-width:380px;font-size:14px">%s</p></body></html>""" % msg).encode('utf-8')

    def log_message(self, *args):
        pass
