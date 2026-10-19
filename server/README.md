# Community Patterns

The static website is served by GitHub Pages at https://christizhu.github.io/cultural-atlas/.
The public sharing service is hosted separately at
https://cultural-atlas-community.alan-zhu015.chatgpt.site/api/community/ with a durable D1 database.
The frontend uses this public API URL in `dist/index.html`; it contains no service credentials.

## Local development

Run `node server/index.mjs` (Node.js 24+) and open
http://127.0.0.1:4173/cultural-atlas/. Keep the server running while previewing.
The release frontend points at the real hosted gallery, including in local previews: publishing
there is a public write. For isolated development, temporarily set the `community-api` meta
content to `./api/community/`. Local SQLite data is stored in ignored
`work/community/community.sqlite`. Do not commit databases or backups.

## Hosted API deployment

`server/hosting/` contains the deployable Sites/Vinext source, schema migration and lockfile.
`server/hosted-api.mjs` is the shared API implementation. Before building, run
`node scripts/prepare-community-host.mjs server/hosting` to regenerate the shared renderer,
validation, trusted icons and project collection. The generated `shared/` directory is ignored
in this GitHub checkout and included by the separate Sites publishing workflow.

Use the Sites skill's source synchronization, install, build and publish helpers from a
separate working checkout; retain project ID `appgprj_6ad577bbf7a8819188b2647f60fb1936`.
Do not change the repository root's older Sites identity. Hosting configuration is public;
credentials are not. Never commit `.env`, runtime data, build output or credentials.

Runtime values are configured through Sites:
- `ADMIN_TOKEN` (secret): owner API authorization.
- `COMMUNITY_OWNER_EMAIL` (secret): owner-only collection import page authorization.
- `COMMUNITY_ORIGINS`: allowed extra browser origins, currently `http://127.0.0.1:4173`.
The GitHub Pages origin is explicitly allowed. Browsers publish anonymously; owner actions
require authorization. The platform-provided identity headers are trusted only behind Sites.

`/owner` uses the platform's ChatGPT sign-in and checks the configured owner email. It can
import the 18 original Atlas Studio compositions. Each has a stable request key, so retrying
cannot create duplicates. They are project-created works, not real visitor testimonials;
public credit names identify Atlas Studio and `project-collection.mjs` retains their exact publication keys and project provenance. Imports through the owner endpoint additionally set `source=project-curated`; ordinary form submissions use the public submission channel.
The gallery does not add an example badge. Schema migrations never insert collection data.

The platform may block command-line HTTP clients while normal browser requests work.
`publish-project-collection.mjs` accepts credentials through hidden stdin when service HTTP
access is available; never put tokens into command arguments or the frontend. No credential
or browser-security bypass is needed for normal visitor sharing.

GitHub Actions deploys only `dist/` on pushes to `main`. Backend changes require their own
Sites deployment; pushing GitHub alone does not update the community service.

## Data and safety

- Saving downloads the existing PNG and never publishes. Sharing uses a clone of that
  exact saved configuration and the very same PNG for its form preview.
- An explicit Publish creates a public entry. Server-side validation accepts only current
  cities/icons, bounded geometry, supported layouts, bounded colors and text, and consent.
- The original renderer creates a static SVG **from validated geometry and trusted local
  icons**. This archived SVG and the structured configuration are both stored. No random
  generation runs during sharing, and no uploaded SVG/HTML is accepted. Each gallery
  image is served as an image with a restrictive CSP.
- Name (60 code points) and reflection (300) are optional. They are displayed literally,
  and display names are **not verified identities**. Reflections are shown in the selected UI language, with the original retained and available through Show Original.
- `All Patterns` queries every public entry; `All Cities` queries stored city `all` only.
- Pages contain 12 entries with a stable insertion cursor, not an unbounded fetch.
- A unique publication request key and digest make identical retries idempotent. After
  an ambiguous failure the form locks its submitted text so Retry cannot silently create
  a second, edited entry. Failed publication leaves the saved PNG and editor untouched.
- At most 20 new entries per client IP per hour, persisted in the database. The hosted API uses the trusted Cloudflare client IP header; local Node uses the socket address. IP addresses are
  stored only as short-lived hashes and are never returned in the public API. If a reverse
  proxy hides client addresses this acts as a conservative **shared** cap. Add per-client
  rate limiting at the proxy before opening the gallery broadly; do not blindly trust
  user-supplied forwarding headers. Add a challenge if spam becomes a problem.
- Origin checks restrict browser publishing to the same origin or explicitly allowed
  origins. They are not authentication. Anonymous internet endpoints still need routine
  owner review. There are no likes or public profiles. Administrative routes require owner authorization.
- Keep the same checked-in icon assets when deploying new API versions; entries retain
  their original stored SVG, while metadata uses the existing icon catalog.

## Owner moderation

Run on the machine that owns the database (set the same `COMMUNITY_DB` environment):

```sh
node server/manage.mjs list
node server/manage.mjs remove ENTRY_ID
```

Removal immediately excludes the entry from list, detail and image requests, clears its
name, reflection, configuration and image, and retains a tombstone for the request key so
a delayed retry cannot republish removed content. Image responses are not cached.
The list contains untrusted submitted text, not instructions. These tools are not public APIs.

## Verification

```sh
node tests/community-server.mjs

node tests/pattern-workflow.mjs
```

The API test uses an isolated temporary database. Browser verification uses a separate local
preview and temporary database, checking actual PNG download, explicit publication,
city filters, canceled drafts, duplicate retries, independent visitors and bilingual labels.
Temporary browser test publications must be removed after verification.

For a direct local gallery preview, use `/cultural-atlas/#community`. The default address
still begins at the Window homepage. Local responses use `Cache-Control: no-store`; the
entry module and all dependency imports share a release version, so a reloaded tab cannot
combine the updated page with older cached scene modules. After adding browser modules or
preparing another release, regenerate the import map with a new version:

```sh
python3 scripts/version-browser-modules.py YOUR_NEW_RELEASE_ID
```

## Reflection localization

Detail requests accept `?lang=en` or `?lang=zh`; names and saved artwork do not change.
Original reflections stay in `patterns.reflection`. Separate translations are cached in
`translations`, keyed by publication and language, and are deleted during moderation.
The original 18 project texts have reviewed Chinese translations in
`project-translations.mjs`. Other public reflections use the MyMemory translation API
(https://mymemory.translated.net/doc/spec.php). Only the public reflection is sent, not the
creator name, image or account information. The service has a free quota and is not an
unlimited translation SLA. Provider errors/quotas retain the original, display an honest
unavailable message, and wait 30 minutes before trying again. Successful translations
are cached; concurrent reads in one worker share the in-flight request. Segments respect
the provider's 500-byte UTF-8 request cap, with a 12-second overall timeout.

New translation providers can replace `machineTranslate` without changing saved works,
frontend language state or database structure. Never display a quota error as a translation.

Run `node tests/community-translation.mjs` for cache, original preservation and failure tests.
