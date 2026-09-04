# Read in Edge

Open the active Markdown file as a cleaned plain-text page in Microsoft Edge and automatically start its built-in **Read Aloud** text-to-speech feature.

[中文](README.zh-CN.md)

## Features

- Ribbon icon to open the current file in Edge
- Workspace command: *Open current file in Edge*
- Desktop only
- Removes Markdown syntax for a clean reading experience
- Automatically starts **Read aloud** after Edge opens
- Configurable always-on-top mode, window position, width, and height
- Bilingual settings interface: 中文 / English

## Usage

1. Open a Markdown note in Obsidian.
2. Click the ribbon icon or run *Open current file in Edge* from the command palette.
3. The plugin creates a temporary plain-text page without modifying the original note.
4. Edge automatically starts **Read aloud** about one second after opening.

## Settings

Open **Settings → Read in Edge** to configure:

- Interface language: 中文 / English;
- Always keep the Edge window on top;
- X and Y coordinates;
- Window width and height.

## Install

### From source

Put `main.js`, `manifest.json`, and `styles.css` into your vault’s plugins folder and enable it in Settings → Community plugins.

### From GitHub Releases

Download `main.js`, `manifest.json`, and `styles.css` from the latest release and put them into your vault’s plugins folder:

```
<vault>/.obsidian/plugins/read-in-edge/
```

## License

MIT
