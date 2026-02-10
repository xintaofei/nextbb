import type { SeedPatch } from "../types"
import { generateId } from "@/lib/id"

const patch: SeedPatch = {
  version: 4,
  name: "0.0.4",
  async up(prisma) {
    const existing = await prisma.system_configs.findUnique({
      where: { config_key: "registration.review_enabled" },
    })
    if (existing) return

    await prisma.system_configs.create({
      data: {
        id: generateId(),
        config_key: "registration.review_enabled",
        config_value: "false",
        config_type: "boolean",
        category: "registration",
        description: "是否开启注册审核",
        is_public: true,
        is_sensitive: false,
        default_value: "false",
      },
    })
  },
}

export default patch
