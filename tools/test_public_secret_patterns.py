"""Fail-closed regression tests for the public repository's secret detector."""
from __future__ import annotations

from validate_public_repo import SECRET_PATTERNS


def flagged(text: str) -> bool:
    return any(pattern.search(text) for pattern in SECRET_PATTERNS)


def main() -> None:
    css_key = "pass" + "word"
    assert not flagged(css_key + ':"[type=password]"'), "CSS selector misclassified"
    assert not flagged('checkbox:"[type=checkbox]"')
    sample_value = "synthetic-only-not-a-credential"
    for key in (css_key, "pass" + "wd", "api_" + "key", "access_" + "token", "secret_" + "key"):
        assert flagged(f'{key}="{sample_value}"'), f"missed literal for {key}"
    assert flagged(f'{css_key}="{sample_value}"')
    print("PUBLIC_SECRET_PATTERN_REGRESSION_PASS")


if __name__ == "__main__":
    main()
