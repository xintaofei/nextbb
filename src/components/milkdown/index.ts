import dynamic from "next/dynamic"

export const MilkdownEditor = dynamic(
  () => import("./editor").then((m) => m.MilkdownEditor),
  { ssr: false }
)

export const MilkdownViewer = dynamic(
  () => import("./viewer").then((m) => m.MilkdownViewer),
  { ssr: false }
)
