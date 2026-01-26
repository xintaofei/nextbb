import type { SeedPatch } from "../types"
import { generateId } from "@/lib/id"

const patch: SeedPatch = {
  version: 1,
  name: "0.0.1",
  async up(prisma) {
    // 默认徽章初始化
  },
}

export default patch
