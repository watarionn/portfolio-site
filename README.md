# Portfolio Site

Public source repository for the portfolio website, selected browser-side tools, applications, and reviewed public service code.

## Production authority

For code and assets that are safe to publish, this repository is the canonical source of truth for the production website.

Changes merged to `main` are intended to be validated, assembled into `build/public_html`, and deployed to the production server through GitHub Actions over certificate-verified FTPS. The generated artifact maps the clean public source layout to the existing production URL layout so legacy links can remain stable while the portfolio is redesigned.

Private credentials, server-only configuration, protected content, mutable runtime data, operator tooling, and other material that should not be publicly visible do not belong in this repository. Those remain in private storage, GitHub Actions Secrets, or on the production server as appropriate.

Production deployment is intentionally non-destructive: the FTPS mirror does not delete remote-only files, and known server-only configuration names are excluded defensively.

## Publication boundary

Only material explicitly approved for public release may be committed here. `tools/validate_public_repo.py` enforces the reviewed public/private boundary, while `tools/build_deployment.py` creates the production artifact from `config/deployment-map.json`.

The public repository validator continues to lock separately reviewed source slices such as HoloScope, SHISHA, and SECRET where exact source identity is part of their publication contract.

## Deployment prerequisites

The production workflow expects these repository Actions secrets:

- `FTP_HOST`
- `FTP_USER`
- `FTP_PASSWORD`
- `FTP_PATH`
- `SITE_URL`

These values must never be committed to the repository.

## License

No open-source license has been selected yet. Unless a license is added later, all rights are reserved.
