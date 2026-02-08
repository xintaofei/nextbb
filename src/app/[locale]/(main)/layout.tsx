import { ReactNode } from "react"
import { getLocale } from "next-intl/server"
import { SideNav } from "@/components/main/side-nav"
import { MobileHeader } from "@/components/main/mobile-header"
import { Aside } from "@/components/main/aside"
import { TaxonomyProvider } from "@/components/providers/taxonomy-provider"
import { NewTopicProvider } from "@/components/providers/new-topic-provider"
import { getTaxonomyData } from "@/lib/taxonomy"

export default async function MainLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  const locale = await getLocale()
  const taxonomyData = await getTaxonomyData(locale)

  return (
    <TaxonomyProvider initialData={taxonomyData}>
      <NewTopicProvider>
        <div className="flex min-h-screen w-full max-w-7xl 2xl:max-w-360 mx-auto flex-col sm:flex-row">
          <SideNav />
          <main className="flex-1 w-full min-w-0 border-x flex flex-col">
            <MobileHeader />
            <div className="flex-1">{children}</div>
          </main>
          <Aside />
        </div>
      </NewTopicProvider>
    </TaxonomyProvider>
  )
}
