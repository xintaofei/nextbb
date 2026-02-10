import type { SeedPatch } from "../types"
import patch001 from "./001_default_badges"
import patch002 from "./002_smtp_configs"
import patch003 from "./003_invite_code_config"
import patch004 from "./004_registration_review_config"

export const patches: SeedPatch[] = [
  patch001,
  patch002,
  patch003,
  patch004,
].sort((a, b) => a.version - b.version)

export const latestVersion =
  patches.length > 0 ? patches[patches.length - 1].version : 0
