# Privacy

S3 Upload Audit is a local-first desktop application.

## Network

Offline Demo does not require network access.

A live audit calls the locally installed AWS CLI or S3 Browser CLI. Authentication remains in the profile already configured in that CLI. S3 Upload Audit does not ask for or store an Access Key, Secret Access Key, or Session Token.

## Local data

Application preferences are stored in:

`%APPDATA%\S3 Upload Audit\settings.json`

Audit history is stored in:

`%APPDATA%\S3 Upload Audit\history.json`

History can contain operational target names, resolved folder names, and file names from the audited bucket. It is stored locally only and can be deleted from the History tab.

At most 50 audit runs are retained.

## Project config

A local `config.json` can contain:
- provider
- executable path/name
- profile or S3 Browser account profile name
- bucket name
- audit thresholds

Credential fields are rejected by the config parser.

## Telemetry

The application contains no analytics, advertising, telemetry, account system, or external reporting service.
