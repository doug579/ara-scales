# ARA Scales (web app)

Vehicle scaling check for American Rally Association tech inspectors. Works on iPhone and Android, offline once installed.

**Use it:** https://doug579.github.io/ara-scales/ → add to Home Screen → DOWNLOAD ENTRY LISTS → SELECT EVENT.

- Entry lists come from the published "ARA Scales Entry Lists" Google Sheet (updated automatically 2 days before each event).
- `sw.js` keeps a copy of the app on the phone. **When you change any file, bump `CACHE` in `sw.js` and `APP_VERSION` in `index.html`.** Phones check for a new version whenever the app is opened with signal and show "NEW VERSION READY — TAP TO UPDATE"; no need to clear browser data.
- Contact: ARA Technical Director, doug@ara-rally.com
