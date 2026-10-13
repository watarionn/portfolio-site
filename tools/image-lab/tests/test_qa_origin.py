"""Image Lab browser E2E must never require a local HTTP listening port."""
import os
import unittest
from unittest.mock import patch
from qa_origin import qa_url, DEFAULT_QA_URL

class QAOriginTests(unittest.TestCase):
    def test_default_public_https(self):
        with patch.dict(os.environ, {}, clear=True):
            self.assertEqual(qa_url(), DEFAULT_QA_URL)

    def test_rejects_local_and_custom_ports(self):
        bad = [
            "http://127.0.0.1:29792/index.html",
            "http://localhost/image-lab/",
            "https://localhost/image-lab/",
            "https://127.0.0.1/image-lab/",
            "https://[::1]/image-lab/",
            "https://example.org:8443/image-lab/",
            "file:///C:/image-lab/index.html",
            "https://example.org/elsewhere/",
        ]
        for address in bad:
            with self.subTest(address=address):
                with patch.dict(os.environ, {"IMAGE_LAB_QA_URL": address}):
                    with self.assertRaises(ValueError):
                        qa_url()

    def test_allows_existing_https_staging(self):
        with patch.dict(os.environ, {"IMAGE_LAB_QA_URL":"https://preview.example.org/image-lab/"}):
            self.assertEqual(qa_url(), "https://preview.example.org/image-lab/")

if __name__ == "__main__":
    unittest.main()
