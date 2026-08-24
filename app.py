import os
from pathlib import Path
from socketserver import ThreadingMixIn
from wsgiref.simple_server import make_server
from wsgiref.simple_server import WSGIServer


ROOT = Path(__file__).resolve().parent

PUBLIC_FILES = {
    Path("standalone.html"),
    Path("src/styles.css"),
    Path("images/structured-use-case-editor.png"),
}

MIME_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
}


class ThreadingWSGIServer(ThreadingMixIn, WSGIServer):
    daemon_threads = True


def _response(start_response, status, body, content_type="text/plain; charset=utf-8"):
    headers = [
        ("Content-Type", content_type),
        ("Content-Length", str(len(body))),
        ("Cache-Control", "no-store"),
    ]
    start_response(status, headers)
    return [body]


def application(environ, start_response):
    path = environ.get("PATH_INFO", "/")
    if path in ("", "/"):
        path = "/standalone.html"

    relative_path = Path(path.lstrip("/"))
    is_public_module = (
        len(relative_path.parts) > 1
        and relative_path.parts[0] == "src"
        and relative_path.suffix == ".js"
    )
    if relative_path not in PUBLIC_FILES and not is_public_module:
        return _response(start_response, "404 Not Found", b"Not found")

    requested = (ROOT / relative_path).resolve()
    if not requested.is_file():
        return _response(start_response, "404 Not Found", b"Not found")

    body = requested.read_bytes()
    content_type = MIME_TYPES.get(requested.suffix.lower(), "application/octet-stream")
    return _response(start_response, "200 OK", body, content_type)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8080"))
    with make_server("127.0.0.1", port, application, server_class=ThreadingWSGIServer) as server:
        print(f"Serving Structured Use Case Editor at http://127.0.0.1:{port}/")
        server.serve_forever()
