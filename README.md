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

---

## 📄 License

Distributed under the **Apache License, Version 2.0**. See the [LICENSE](LICENSE) file for details.