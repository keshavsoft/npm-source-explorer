/**
 * Converts any npm package name (including scoped packages like @scope/name)
 * into a safe, valid, cross-platform folder name.
 *
 * @param {string} packageName - e.g. "@keshavsoft/npm-source-explorer"
 * @returns {string} - e.g. "keshavsoft-npm-source-explorer"
 */
export function toSafeFolderName(packageName) {
  if (!packageName || typeof packageName !== "string") {
    return "unnamed-package";
  }

  return packageName
    .replace(/^@/, "")
    .replace(/[\\/]/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "-");
}

