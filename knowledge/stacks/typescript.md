# TypeScript

- **No `any`.** Use `unknown` for values you haven't checked, and narrow them. Don't silence the compiler with `as`, `!` or `@ts-ignore`; fix the type. A cast is acceptable only at a boundary, straight after a runtime check.
- **Let types be inferred** for locals; write them out on exported functions and module boundaries.
- **Model states as unions**, not as bags of optional fields and booleans. `{ status: "loading" } | { status: "ready"; data: T }` over `{ loading: boolean; data?: T }`.
- **Parse at the boundary.** Data from JSON, the network, `process.env` or user input is `unknown` until checked. After the check, the rest of the code trusts the type.
- **Prefer `const`, plain objects and functions** over classes and mutation. Reach for a class only when there is real state with a lifetime.
- **Prefer string literal unions to `enum`.**
- **Named exports**, one concern per module. No default exports unless the framework requires one.
- **`async`/`await` over promise chains**, and never leave a promise unhandled.
- **The type check is a check.** `tsc --noEmit` (or the repo's typecheck command) passing is part of verify, not optional.
