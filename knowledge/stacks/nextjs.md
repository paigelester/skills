# Next.js

- **Read the installed version's docs first.** Next.js changes between versions and your memory may be out of date. Before writing code, read the relevant guide in `node_modules/next/dist/docs/` and heed deprecation notices. The repo's `AGENTS.md` may say this too; it means it.
- **Server by default.** A component is a Server Component unless it needs state, effects or browser APIs. Add `"use client"` to the smallest leaf that needs it, not to a whole page.
- **Fetch data on the server**, in the component that needs it. Don't add a client-side fetch for data that is known at build or request time.
- **Follow the App Router's file conventions** (`page`, `layout`, `loading`, `error`, `not-found`, route handlers) instead of inventing structure.
- **Use the framework's pieces**: its link, image, font and metadata APIs, rather than raw tags or hand-rolled versions.
- **Know how the site is built and deployed.** A statically exported site has no server at run time, so no request-time features. Check the repo's `next.config` and build script before using one.
- **Accessibility is part of done.** Semantic HTML first, a text alternative for every image, keyboard reachable controls, visible focus.
- **Styles follow the repo's method** (CSS modules, Sass, or whatever is there). Don't add a second styling system.
