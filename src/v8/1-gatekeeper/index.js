/**
 * Act 1: The Gatekeeper
 * ----------------------------------------------------------------------------
 * Validates the supplied package specification and extracts root identity
 * before any dependency resolution or cloning begins.
 */

export function parsePackageSpec(packageSpec) {
  if (!packageSpec || typeof packageSpec !== "string" || !packageSpec.trim()) {
    throw new Error("Invalid target: package name must be a non-empty string.");
  }

  const spec = packageSpec.trim();
  let name = spec;
  let requestedVersion = null;

  // Handle version tag, e.g. express@4.18.2 or @scope/pkg@1.0.0
  const atIndex = spec.lastIndexOf("@");
  if (atIndex > 0) {
    name = spec.slice(0, atIndex);
    requestedVersion = spec.slice(atIndex + 1);
  }

  // Extract scope if present, e.g. @keshavsoft/json-to-dom -> "keshavsoft"
  let scope = null;
  if (name.startsWith("@")) {
    const slashIndex = name.indexOf("/");
    if (slashIndex > 1) {
      scope = name.slice(1, slashIndex);
    }
  }

  return {
    spec,
    name,
    version: requestedVersion,
    scope,
    owner: scope || null
  };
}

export async function validatePackage(packageSpec) {
  const target = parsePackageSpec(packageSpec);
  return target;
}

