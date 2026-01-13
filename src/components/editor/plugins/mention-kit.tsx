import { MentionInputPlugin, MentionPlugin } from "@platejs/mention/react"

import {
  MentionElement,
  MentionInputElement,
} from "@/components/ui/mention-node"

export const mentionPlugins = [
  MentionPlugin.configure({
    options: {
      trigger: "@",
    },
  }).withComponent(MentionElement),
  MentionInputPlugin.configure({
    options: {
      trigger: "@",
    },
  }).withComponent(MentionInputElement),
] as const
