// Polyfill for Vue 3 feature flags to suppress warnings when using @milkdown/crepe
// This must be imported before any Vue-dependent libraries
if (typeof window !== "undefined") {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  ;(window as any).__VUE_OPTIONS_API__ = true
  ;(window as any).__VUE_PROD_DEVTOOLS__ = false
  ;(window as any).__VUE_PROD_HYDRATION_MISMATCH_DETAILS__ = false
  /* eslint-enable @typescript-eslint/no-explicit-any */
}
