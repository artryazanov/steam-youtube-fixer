# Steam YouTube Fixer

Steam YouTube Fixer is a Chrome extension that improves the YouTube video import flow on Steam (steamcommunity.com) by hiding videos you have already imported and speeding up selection.

Install (Developer mode)
1) Open chrome://extensions/ in Chrome.
2) Enable “Developer mode” in the top‑right corner.
3) Click “Load unpacked” and select this project folder.

Permissions
- tabs, activeTab, scripting
- Host permissions: https://steamcommunity.com/*

How it works
- The extension watches for Steam pages related to adding/importing videos and injects jQuery and youtube-fixer-injection.js after the page finishes loading.
- The injected script scans your uploaded/linked videos, stores IDs locally (per Steam account), and hides items that are already imported when you choose videos to add.

Privacy
- No external servers are used. The extension stores only a minimal map of your YouTube/Steam video IDs in your browser’s localStorage, scoped per Steam account.