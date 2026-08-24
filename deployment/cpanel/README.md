# cPanel/Passenger Deployment Example

This directory contains an optional Python WSGI deployment example for cPanel/Passenger hosting.

The Structured Use Case Editor itself is deployment-neutral. The editor UI is static HTML, JavaScript, and CSS at the repository root. These cPanel files are provided only for hosting environments that require a Python application entry point.

## Files

- `app.py` - serves the static editor files from the repository root
- `passenger_wsgi.py` - Passenger startup file
- `replacement_passenger_wsgi.py` - backup startup file in case cPanel overwrites `passenger_wsgi.py`

## cPanel Settings

Use:

```text
Application startup file: passenger_wsgi.py
Application entry point: application
```

If cPanel rewrites `passenger_wsgi.py`, replace its contents with `replacement_passenger_wsgi.py`.

## Local Smoke Test

From the repository root:

```bash
python3 deployment/cpanel/app.py
```

Then open:

```text
http://127.0.0.1:8080/
```
