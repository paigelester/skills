// Path patterns for the contract's review rules. `*` stays inside one folder, `**` crosses folders, `?` is one character.

/** Turn a glob such as `app/**` or `**\/*.test.*` into a regular expression over forward-slash paths. */
export function globToRegExp(glob) {
  let re = "";
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === "*") {
      if (glob[i + 1] === "*") {
        // `**/` also matches no folder at all, so `**/x.ts` matches `x.ts`.
        if (glob[i + 2] === "/") {
          re += "(?:.*/)?";
          i += 2;
        } else {
          re += ".*";
          i += 1;
        }
      } else re += "[^/]*";
    } else if (c === "?") re += "[^/]";
    else re += c.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`^${re}$`);
}

export function matchesGlob(path, glob) {
  return globToRegExp(glob).test(path.split("\\").join("/"));
}
