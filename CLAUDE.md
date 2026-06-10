# CLAUDE.md

**Note**: This project uses Dex for issue tracking. Use `npx -y @zeeg/dex`
commands instead of markdown TODOs. See AGENTS.md for workflow details.

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`@drop-in/graffiti` is a CSS theming package that provides base styles, fluid typography, and a responsive layout system. It can be used as either:
1. **CLI tool**: `npx @drop-in/graffiti` copies `drop-in.css` to `src/` folder
2. **NPM package**: Install and import in Vite-based apps

## Commands

```bash
# Build the package (generates raw.js)
npm run build

# Alternative build command
npm run package

# Test CLI locally
node bin.js
```

## Architecture

### Core Files

- **drop-in.css**: Main CSS framework - contains base styles, utilities, layouts, and typography
- **build.js**: Reads CSS files and generates JavaScript modules (`raw.js`)
- **bin.js**: CLI entry point that copies `drop-in.css` to user's project at `src/drop-in.css`
- **raw.js**: Auto-generated from `drop-in.css` (do not edit manually)

### Build Pipeline

1. `drop-in.css` is the source file that should be edited for CSS changes
2. Running `npm run build` converts it to a JavaScript module for imports
3. The package exports both the raw CSS file and the JS module

## CSS System Architecture

### Fluid Typography
Uses a custom CSS variable system based on `--fl` (fluid level) values:
- Elements set `--fl` to define their scale (-1 to 6)
- Calculations use `pow()` with modular scale ratios
- Supports both viewport units (100vi) and container query units (100cqi) via `.fc` class

### Layout System
`.layout` class provides a responsive 12-column grid system:
- Columns: 12 (desktop), 8 (tablet <1000px), 4 (mobile <500px)
- Uses CSS Grid with named lines: `[start]`, `[content]`, `[col-start]`, `[content-end]`, `[end]`
- Custom properties: `--start` and `--span` to position elements
- Helper classes: `.col`, `.sidebar`, `.main`, `.c-half`, `.c-quarter`, `.c-full`

### Theming System
- Uses CSS custom properties extensively
- `light-dark()` function for automatic color scheme switching
- `color-mix()` for tint/shade calculations
- Custom properties for spacing (`--vs-*`), border radius (`--br-*`), padding (`--pad-*`), shadows (`--s-*`)

## Package Exports

```json
{
  ".": "./drop-in.css",              // Default: main CSS framework
  "./drop-in.css": "./drop-in.css",  // Explicit main CSS import
  "./raw": "./raw.js"                // Main CSS as JS module
}
```

## Authoring drop-in.css

Every primary class definition (rules with selector exactly `.classname` inside a `@layer` block) and every token at `:root` inside `@layer base` in `src/lib/drop-in.css` requires a structured annotation comment. Use `@pattern` / `@pattern-group` for classes and `@token` / `@token-group` for tokens.

`npm run lint:graffiti` enforces the annotations and emits `registry.json` (the machine-readable catalogue consumed by lookup tools and downstream lint). The lint also runs pre-commit. See [docs/ANNOTATION-SPEC.md](docs/ANNOTATION-SPEC.md) for the full format and validation rules.

## Development Workflow

1. Edit `drop-in.css` for framework changes
2. Run `npm run build` to regenerate `raw.js`
3. Test locally by opening `index.html` in browser
4. For CLI testing, run `node bin.js` from package directory

## Usage

Users can import the framework in several ways:

```js
// Option 1: Import the base framework
import '@drop-in/graffiti'

// Option 2: Import as a JavaScript module
import css from '@drop-in/graffiti/raw'
```
