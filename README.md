# Browser Customizations

Userscripts and userstyles for Fastmail, Invidious, and Redlib.

## Userscripts

Install the `.user.js` files with Violentmonkey. Open a file below and use its raw source to install it, or import the downloaded file into Violentmonkey.

### Fastmail title-bar color

[fastmail-chrome-app.user.js](userscripts/fastmail-chrome-app.user.js) matches Fastmail's title-bar color to your system's light or dark appearance. It runs on `https://app.fastmail.com/*` and pairs with the Fastmail userstyle below.

### Invidious Chapters

1. Install [invidious-chapters.user.js](userscripts/invidious-chapters.user.js).
2. Open the script's settings in the Violentmonkey dashboard.
3. Add your Invidious instance as a custom match/include rule, for example `https://inv.myvps.com/*`.

The script's built-in match uses the reserved `example.invalid` domain, so it does not run on any site until a custom rule is added. Violentmonkey stores custom rules separately and preserves them when the script updates.

The Chapters control parses timestamped lines in the video description, such as `0:00 Intro` or `1:07 First topic`. Selecting a chapter seeks the video to its timestamp.

## Userstyles

Install the `.user.css` files with a userstyle manager such as Stylus, using the file's raw source or importing the downloaded file.

### Fastmail Chrome App

[fastmail-chrome-app.user.css](userstyles/fastmail-chrome-app.user.css) matches Fastmail's background to the native title bar and reduces the header height. It is scoped to `app.fastmail.com`; use it alongside the Fastmail userscript above.

### Invidious

[invidious.user.css](userstyles/invidious.user.css) customizes the Invidious interface with light and dark themes.

Configure the userstyle to run only on your Invidious instance. For example:

- **Personal included sites:** `https://inv.myvps.com/*`
- **Personal excluded sites:** `/^(?!https:\/\/inv\.myvps\.com(?:[/:]|$))/`

Replace the example hostname in both rules with your instance's hostname, escaping dots in the exclusion expression.

### Redlib

[redlib.user.css](userstyles/redlib.user.css) gives Redlib a Reddit-inspired interface.

Configure the userstyle to run only on your Redlib instance. Replace `redlib.your.vps` with your instance's hostname, escaping dots in the exclusion expression.

- **Personal included sites:** `https://redlib.your.vps/*`
- **Personal excluded sites:** `/^(?!https:\/\/redlib\.your\.vps(?:[/:]|$))/`

These rules prevent the style from affecting unrelated websites.

## License

[MIT](LICENSE)
