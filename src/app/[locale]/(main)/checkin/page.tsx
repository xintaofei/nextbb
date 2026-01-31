import { getTranslations } from "next-intl/server"
import { CheckinSection } from "@/components/checkin/checkin-section"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const locale = (await params).locale
  const t = await getTranslations({
    locale,
    namespace: "Checkin",
  })

  return {
    title: t("pageTitle"),
  }
}

export default function CheckinPage() {
  return (
    <div className="container mx-auto max-w-4xl p-8">
      <CheckinSection />
    </div>
  )
}
