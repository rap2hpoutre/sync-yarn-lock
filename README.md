# sync-yarn-lock

[![npm version](https://img.shields.io/npm/v/@rap2hpoutre/sync-yarn-lock.svg)](https://www.npmjs.com/package/@rap2hpoutre/sync-yarn-lock)
[![npm downloads](https://img.shields.io/npm/dm/@rap2hpoutre/sync-yarn-lock.svg)](https://www.npmjs.com/package/@rap2hpoutre/sync-yarn-lock)
[![license](https://img.shields.io/npm/l/@rap2hpoutre/sync-yarn-lock.svg)](https://github.com/rap2hpoutre/sync-yarn-lock/blob/main/LICENSE)
[![node](https://img.shields.io/node/v/@rap2hpoutre/sync-yarn-lock.svg)](https://nodejs.org)

> 🔒 Sync your `package.json` versions with `yarn.lock` — Modern replacement for `syncyarnlock`, built for **Yarn 4** (Berry)

## Why?

When you run `yarn add` or `yarn upgrade`, Yarn updates your `yarn.lock` with exact versions, but leaves `package.json` with version ranges (like `^1.0.0`). This can cause confusion about what's _actually_ installed.

**sync-yarn-lock** updates your `package.json` to reflect the exact versions from your lockfile, making your dependencies explicit and reproducible.

### vs. syncyarnlock

| Feature                  | sync-yarn-lock | syncyarnlock          |
| ------------------------ | -------------- | --------------------- |
| Yarn 4 (Berry) support   | ✅             | ❌                    |
| Yarn 1 (Classic) support | ❌             | ✅                    |
| Actively maintained      | ✅             | ❌ (last update 2019) |
| Zero dependencies        | ✅             | ❌                    |
| Dry-run mode             | ✅             | ❌                    |

## Installation

### Using npx (recommended)

```bash
npx sync-yarn-lock
```

### Global installation

```bash
npm install -g sync-yarn-lock
# or
yarn global add sync-yarn-lock
```

## Usage

```bash
# Sync versions (modifies package.json)
npx sync-yarn-lock

# Preview changes without modifying files
npx sync-yarn-lock --dry-run

# Silent mode (only show errors)
npx sync-yarn-lock --silent
```

### Options

| Option      | Alias | Description                    |
| ----------- | ----- | ------------------------------ |
| `--help`    | `-h`  | Show help message              |
| `--version` | `-v`  | Show version number            |
| `--dry-run` | `-d`  | Preview changes without saving |
| `--silent`  | `-s`  | Only output errors             |

## Example

Before:

```json
{
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}
```

After running `npx sync-yarn-lock`:

```json
{
  "dependencies": {
    "react": "18.2.0",
    "react-dom": "18.2.0"
  }
}
```

## How it works

1. Reads your `package.json` dependencies
2. For each dependency, queries `yarn info <package> --json` to get the resolved version from `yarn.lock`
3. Updates `package.json` with the exact versions
4. Reports all changes made

## Requirements

- **Node.js** >= 18
- **Yarn** 4 (Berry) - must be available in PATH

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT © [rap2hpoutre](https://github.com/rap2hpoutre)
