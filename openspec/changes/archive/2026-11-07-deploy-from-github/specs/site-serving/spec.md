# Spec Delta

## REMOVED Requirements

### Requirement: A failing deploy keeps the running site
**Reason**: Deploys no longer come from a push to the server's `main`; a published `v*` release tag starts them from GitHub.
**Migration**: The guarantee moves to `deploy-on-tag` ("A failing build keeps the running site", "Only tested commits on main are deployed" and "A version tag starts a deploy"). Release by publishing a `v*` tag on `main` instead of `git push server main`.
