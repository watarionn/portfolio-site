# Publication policy

This repository is a clean public portfolio export from the private production source repository.

## Stage 2 scope

Stage 2 retains the reviewed Stage 1 portfolio shell, profile, static tools, and static works, and adds the separately reviewed browser-only YOREI client under `apps/yorei/public/**`.

YOREI's public client uses browser-side Supabase configuration by design. Database schema and policies, service-role credentials, production deployment configuration, operator workflows, mutable runtime state, private notes, and private Git history remain outside this repository. The production authorization boundary remains the live Supabase Row Level Security configuration reviewed separately before this import.

Characters are intentionally excluded from this public portfolio export. AQUARIUM, HOLOCA, HoloScope, SHISHA, and SECRET remain deferred until each receives a separate public-export review.

The Stage 2 YOREI slice was imported from the reviewed private source revision `5b2ac7e4e5b9f60b6d8e91d3ec6e43552cad9342` without carrying private repository history.

## License

No open-source license is granted by this repository at this time. Unless a file explicitly states otherwise, copyright and other rights remain reserved by the repository owner. Publication on GitHub permits viewing and forking only to the extent provided by GitHub's Terms of Service; it does not grant a general license to copy, modify, redistribute, or reuse the contents.

## Production boundary

This public repository is not the production authority. Production deployment, server credentials, protected runtime configuration, mutable state, database schema/policy administration, and maintenance/operator workflows remain private and must not be added here.
