import type { SeedPatch } from "../types"
import { generateId } from "@/lib/id"

const patch: SeedPatch = {
  version: 3,
  name: "0.0.3",
  async up(prisma) {
    const existing = await prisma.system_configs.findUnique({
      where: { config_key: "registration.require_invite_code" },
    })
    if (existing) return

    await prisma.system_configs.create({
      data: {
        id: generateId(),
        config_key: "registration.require_invite_code",
        config_value: "false",
        config_type: "boolean",
        category: "registration",
        description: "是否需要邀请码才能注册",
        is_public: true,
        is_sensitive: false,
        default_value: "false",
      },
    })
  },
}

export default patch
