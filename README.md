# FocusFlow PWA — v1

A minimal Pomodoro timer designed to run on iPhone and iPad without needing a Mac or Xcode.

## Included
- Focus, short-break and long-break modes
- Pause, resume and reset
- Classic 25/5/15-minute defaults
- Long break after four completed focus sessions
- Optional automatic next-session start
- Local task list
- Daily focus minutes and 7-day bar chart
- Local browser storage
- Service-worker offline cache
- Installable web-app manifest
- Completion notifications while permitted and supported

## Run it
A PWA needs to be served from HTTPS (or localhost). It will not install as a PWA by opening `index.html` directly from Files.

### Easiest deployment
1. Create a GitHub repository named `focusflow`.
2. Upload all files in this folder to the repository root.
3. In repository Settings → Pages, select **Deploy from a branch**, choose `main` and `/ (root)`, then Save.
4. Wait for GitHub Pages to publish the HTTPS website.
5. Open the published address in Safari on iPhone/iPad.

### Add to iPhone/iPad Home Screen
1. Open the published site in Safari.
2. Tap Share.
3. Choose **Add to Home Screen**.
4. Enable **Open as Web App** if shown, then tap Add.

## Important iOS limitations
- Safari may suspend a web page when it is backgrounded or the device is locked. FocusFlow recalculates the remaining time from an absolute end timestamp when the page becomes active again, but a live countdown is not guaranteed while suspended.
- Web notifications depend on iOS/iPadOS version, Home Screen installation and notification permission. They are not a substitute for native alarm-clock reliability.
- Data is stored locally in the browser on each device. It does not automatically sync between iPhone and iPad. Avoid clearing Safari website data if you want to retain your tasks and session history.
- This is a PWA, not a signed App Store application. A Mac is not required to host or use it.

## Privacy
No analytics, advertising, login or external data collection is included. All task and session data stays in local browser storage.
