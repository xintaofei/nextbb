import type { SeedPatch } from "../types"
import { generateId } from "@/lib/id"

type SeedConfig = {
  key: string
  value: string
  type: string
  cat: string
  desc: string
  pub: boolean
  sensitive?: boolean
}

const patch: SeedPatch = {
  version: 2,
  name: "0.0.2",
  async up(prisma) {
    const configs: SeedConfig[] = [
      {
        key: "smtp.host",
        value: "",
        type: "string",
        cat: "smtp",
        desc: "SMTP 服务器地址",
        pub: false,
      },
      {
        key: "smtp.port",
        value: "587",
        type: "number",
        cat: "smtp",
        desc: "SMTP 端口",
        pub: false,
      },
      {
        key: "smtp.secure",
        value: "false",
        type: "boolean",
        cat: "smtp",
        desc: "是否启用 TLS/SSL",
        pub: false,
      },
      {
        key: "smtp.auth_user",
        value: "",
        type: "string",
        cat: "smtp",
        desc: "SMTP 用户名",
        pub: false,
      },
      {
        key: "smtp.auth_pass",
        value: "",
        type: "string",
        cat: "smtp",
        desc: "SMTP 密码",
        pub: false,
        sensitive: true,
      },
      {
        key: "smtp.from_name",
        value: "",
        type: "string",
        cat: "smtp",
        desc: "发件人名称",
        pub: false,
      },
      {
        key: "smtp.from_email",
        value: "",
        type: "string",
        cat: "smtp",
        desc: "发件人邮箱",
        pub: false,
      },
    ]

    for (const c of configs) {
      const existing = await prisma.system_configs.findUnique({
        where: { config_key: c.key },
      })
      if (existing) continue

      await prisma.system_configs.create({
        data: {
          id: generateId(),
          config_key: c.key,
          config_value: c.value,
          config_type: c.type,
          category: c.cat,
          description: c.desc,
          is_public: c.pub,
          is_sensitive: c.sensitive ?? false,
          default_value: c.value,
        },
      })
    }
  },
}

export default patch
