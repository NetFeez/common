# @netfeez/common

> The universal, platform-agnostic core of the NetFeez ecosystem

`@netfeez/common` is the isomorphic, zero-dependency foundation that powers consistency and robustness across the entire NetFeez platform. This package provides essential utilities, schema validation, event logic, and communication protocols to build reliable networked applications in any modern JavaScript environment.

---

## 🚩 Key Features

- **100% Isomorphic:** Pure TypeScript implementation, optimized for Node.js, modern browsers, and V8 environments.
- **Shared Schema System:** Centralized engine for data definition, validation, and introspection.
- **Unified Event Emitter:** Event-driven architecture, consistent across backend and frontend.
- **Agnostic & Standards-Based:** Strictly follows `ESNext` with no reliance on platform-specific APIs.
- **Zero External Dependencies:** Maximum portability and maintainability.

---

## 🧩 Package Structure

- **src/Encoding.ts** — Encoding and decoding utilities.
- **src/Events.ts** — Isomorphic event engine.
- **src/Flatten.ts** — Tools for flattening data structures.
- **src/Object.ts** — Advanced object manipulation utilities.
- **src/Time/** — Modules for date and time handling.
- **src/schema/** — Core for schema validation, introspection, and definition (includes JSONSchema, validators, and typed errors).

---

## 🌐 NetFeez Ecosystem Integration

This package is the "source of truth" for the entire NetFeez stack:
- [Vortez](https://github.com/NetFeez/vortez): Web framework for Node.js, APIs, and modern applications.
- [Vizui](https://github.com/NetFeez/vizui): Reactive web UI library.

Coming soon:
- **@netfeez/common-node:** Extensions for Node.js (filesystem, environment, process utilities).
- **@netfeez/common-web:** Extensions for browsers (DOM, storage, WebAPI wrappers).

---

## 📦 Installation

```bash
npm install @netfeez/common
```

### Node.js (Recommended)

After installing, simply import and use any utility:

```ts
import { Events } from '@netfeez/common';
```
No extra configuration is needed for Node.js environments.

### Web Browsers

You can use @netfeez/common in the browser in two main ways:

#### 1. Using CDN (Import Map)

Add this to your HTML:

```html
<script type="importmap">
{
  "imports": {
    "@netfeez/common": "https://netfeez.github.io/common/v2.0.0/common.js",
    "@netfeez/common/": "https://netfeez.github.io/common/v2.0.0/"
  }
}
</script>
```

Then import in your code:

```ts
import { Events } from '@netfeez/common';
```

#### 2. Using Local Files (Local Import Map)

Download the compiled files from the [releases](https://github.com/NetFeez/common/releases) or CDN and place them in your project. Then configure your import map to point to your local copy:

```html
<script type="importmap">
{
  "imports": {
    "@netfeez/common": "/path-to-your-copy/common.js",
    "@netfeez/common/": "/path-to-your-copy/"
  }
}
</script>
```

You can then import as usual:

```ts
import { Events } from '@netfeez/common';
```

#### TypeScript Typings for Browser Projects

If you use TypeScript in the browser and do not install the package with npm, you can add typings support via `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@netfeez/common": ["./path-to-your-copy/common.js"],
      "@netfeez/common/*": ["./path-to-your-copy/*"]
    }
  }
}
```

This only affects TypeScript type checking and editor autocompletion; it does not affect how modules are loaded in the browser.

**Note:** If you install with npm in a web project, it is only recommended for TypeScript typings, not for loading the code in the browser.

**Recommendation:** For production, host your own copy of the compiled files to ensure stability and version control.

---

## 📄 License

Distributed under the **Apache License, Version 2.0**. See the [LICENSE](LICENSE) file for details.