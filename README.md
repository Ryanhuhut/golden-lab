# GOLDEN LAB

An interactive, static visual laboratory for Fibonacci growth, golden angle phyllotaxis, petals, and Fibonacci ratios.

## Run locally

Serve the project root with any static file server, for example:

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000`. ES modules require a static server.

To view the site without a local server, open `preview.html` directly in a browser. Rebuild it after source changes with `npm run preview:build`.

## Deploy to GitHub Pages

Publish the repository root from the desired branch in **Settings → Pages → Build and deployment**. All asset paths are relative, and there are no server routes or build steps.

## Debug

Append `?debug` to the URL to show FPS and motion values. Run `npm test` for the mathematical smoke tests.
