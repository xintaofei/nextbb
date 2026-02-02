/**
 * Dynamic require helper that prevents static analysis by bundlers
 * This allows loading optional dependencies at runtime without build-time errors
 *
 * @param moduleName - Name of the module to require
 * @returns The required module
 * @throws Error if module is not installed
 */
export function dynamicRequire<T>(moduleName: string): T {
  // Using eval to prevent webpack/turbopack from statically analyzing the require
  // This is intentional - we want runtime-only loading for optional dependencies
  return eval("require")(moduleName) as T
}
