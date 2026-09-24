# Privacy

mkPDF Studio is a local-first Windows desktop application.

## Data handling

- Archive inspection, extraction, page preview, page editing, and PDF generation run locally on your computer.
- mkPDF Studio does not upload archive contents or generated PDFs to an external service.
- The application does not include analytics, advertising, telemetry, or account login.
- Source archives are not deleted or modified by the application.
- Temporary extracted files are created inside an isolated temporary directory and are removed when the session closes.

## Local settings

User preferences such as the onboarding state and custom PDF presets are stored in:

`%APPDATA%\mkPDF Studio\settings.json`

These settings contain only application preferences. They do not contain archive contents, image data, or generated PDFs.

## External software

7-Zip is used locally for supported 7z / RAR-family archive inspection and extraction.

## Network

mkPDF Studio does not require network access for its core features.
