import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { AlertCircle, Home } from "lucide-react"
import { BackButton } from "@/components/common/back-button"

export default async function UserNotFound() {
  const t = await getTranslations("User.profile")

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-12rem)] p-4">
      <Card className="w-full max-w-lg border-0 shadow-none">
        <CardHeader className="text-center space-y-6 pb-6">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-destructive/20 rounded-full blur-xl animate-pulse" />
              <div className="relative rounded-full bg-linear-to-br from-destructive/10 to-destructive/5 p-6 border-2 border-destructive/20">
                <AlertCircle className="h-20 w-20 text-destructive" />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold">
              {t("notFound")}
            </CardTitle>
            <CardDescription className="text-base">
              {t("notFoundDescription")}
            </CardDescription>
          </div>
        </CardHeader>
        <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <BackButton
            variant="outline"
            size="lg"
            className="w-full sm:w-auto"
          />
          <Link href="/" className="w-full sm:w-auto">
            <Button variant="default" size="lg" className="w-full">
              <Home className="mr-2 h-4 w-4" />
              {t("backToHome")}
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
