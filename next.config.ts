import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts")

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  // Mark optional storage provider SDKs as external
  // These will be loaded at runtime only when the provider is actually used
  serverExternalPackages: [
    "ali-oss",
    "@aws-sdk/client-s3",
    "cos-nodejs-sdk-v5",
    "qiniu",
    "upyun",
  ],
}

export default withNextIntl(nextConfig)
