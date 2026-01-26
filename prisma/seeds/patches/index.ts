import type { SeedPatch } from "../types"
import patch001 from "./001_default_badges"

export const patches: SeedPatch[] = [patch001].sort(
  (a, b) => a.version - b.version
)

export const latestVersion =
  patches.length > 0 ? patches[patches.length - 1].version : 0
