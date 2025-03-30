# React Chrome Extension

A Chrome extension built with React and TypeScript.

## Setup

1. Install dependencies:
```bash
yarn install
```

2. Build the extension:
```bash
yarn build
```

3. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`   
   - Enable "Developer mode" in the top right
   - Click "Load unpacked" and select the `dist` folder from this project

## Development

To watch for changes during development:
```bash
yarn watch
```

## Project Structure

- `src/` - Source files
  - `popup.tsx` - Extension popup component
  - `background.ts` - Background service worker
  - `content.tsx` - Content script that runs on web pages
- `public/` - Static files
  - `popup.html` - Popup HTML file
  - `manifest.json` - Chrome extension manifest
- `dist/` - Built extension files (generated)

## Features

- React 18 with TypeScript
- Webpack for bundling
- Hot reloading during development
- CSS modules support