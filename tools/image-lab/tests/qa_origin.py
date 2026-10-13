"""Safe public HTTPS QA target; local preview uses a portless DevTools pipe."""
import ipaddress
import os
from urllib.parse import urlsplit

DEFAULT_QA_URL = "https://cf278796.cloudfree.jp/image-lab/"

def qa_url():
    url = os.environ.get("IMAGE_LAB_QA_URL", DEFAULT_QA_URL)
    parts = urlsplit(url)
    host = (parts.hostname or "").lower()
    try:
        ipaddress.ip_address(host)
        literal_ip = True
    except ValueError:
        literal_ip = False
    if (parts.scheme != "https" or not host or literal_ip or
            host == "localhost" or host.endswith(".localhost") or
            parts.port is not None or parts.username or parts.password or
            not parts.path.startswith("/image-lab/")):
        raise ValueError("Image Lab browser E2E requires a published HTTPS /image-lab/ URL, without a custom port. Use npm run smoke:no-port for local files.")
    return url
