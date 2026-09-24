"""Safe archive-to-PDF core for mkPDF Studio."""

from .core import ArchiveError, ConversionResult, Limits, convert_archive, inspect_archive

__all__ = [
    "ArchiveError",
    "ConversionResult",
    "Limits",
    "convert_archive",
    "inspect_archive",
]

__version__ = "1.0.0"
