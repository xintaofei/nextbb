import { StorageProviderType } from "@prisma/client"
import { ConfigField, ConfigFieldsMap } from "@/types/storage-provider-config"

export function getConfigFields(
  providerType: StorageProviderType | "",
  t: (key: string) => string
): ConfigField[] {
  if (!providerType) return []

  const configMap: ConfigFieldsMap = {
    LOCAL: [
      {
        key: "basePath",
        label: t("dialog.config.basePath"),
        type: "text",
        required: true,
      },
    ],
    VERCEL_BLOB: [
      {
        key: "token",
        label: t("dialog.config.token"),
        type: "password",
        required: true,
      },
    ],
    ALIYUN_OSS: [
      {
        key: "accessKeyId",
        label: t("dialog.config.accessKeyId"),
        type: "text",
        required: true,
      },
      {
        key: "accessKeySecret",
        label: t("dialog.config.accessKeySecret"),
        type: "password",
        required: true,
      },
      {
        key: "region",
        label: t("dialog.config.region"),
        type: "text",
        required: true,
      },
      {
        key: "bucket",
        label: t("dialog.config.bucket"),
        type: "text",
        required: true,
      },
      {
        key: "endpoint",
        label: t("dialog.config.endpoint"),
        type: "text",
        required: false,
      },
    ],
    AWS_S3: [
      {
        key: "accessKeyId",
        label: t("dialog.config.accessKeyId"),
        type: "text",
        required: true,
      },
      {
        key: "secretAccessKey",
        label: t("dialog.config.secretAccessKey"),
        type: "password",
        required: true,
      },
      {
        key: "region",
        label: t("dialog.config.region"),
        type: "text",
        required: true,
      },
      {
        key: "bucket",
        label: t("dialog.config.bucket"),
        type: "text",
        required: true,
      },
    ],
    TENCENT_COS: [
      {
        key: "secretId",
        label: t("dialog.config.secretId"),
        type: "text",
        required: true,
      },
      {
        key: "secretKey",
        label: t("dialog.config.secretKey"),
        type: "password",
        required: true,
      },
      {
        key: "region",
        label: t("dialog.config.region"),
        type: "text",
        required: true,
      },
      {
        key: "bucket",
        label: t("dialog.config.bucket"),
        type: "text",
        required: true,
      },
    ],
    QINIU: [
      {
        key: "accessKey",
        label: t("dialog.config.accessKey"),
        type: "text",
        required: true,
      },
      {
        key: "secretKey",
        label: t("dialog.config.secretKey"),
        type: "password",
        required: true,
      },
      {
        key: "bucket",
        label: t("dialog.config.bucket"),
        type: "text",
        required: true,
      },
    ],
    UPYUN: [
      {
        key: "operator",
        label: t("dialog.config.operator"),
        type: "text",
        required: true,
      },
      {
        key: "password",
        label: t("dialog.config.password"),
        type: "password",
        required: true,
      },
      {
        key: "bucket",
        label: t("dialog.config.bucket"),
        type: "text",
        required: true,
      },
    ],
    MINIO: [
      {
        key: "endpoint",
        label: t("dialog.config.endpoint"),
        type: "text",
        required: true,
      },
      {
        key: "port",
        label: t("dialog.config.port"),
        type: "number",
        required: true,
        min: 1,
        max: 65535,
      },
      {
        key: "accessKey",
        label: t("dialog.config.accessKey"),
        type: "text",
        required: true,
      },
      {
        key: "secretKey",
        label: t("dialog.config.secretKey"),
        type: "password",
        required: true,
      },
      {
        key: "bucket",
        label: t("dialog.config.bucket"),
        type: "text",
        required: true,
      },
      {
        key: "useSsl",
        label: t("dialog.config.useSsl"),
        type: "checkbox",
        required: true,
      },
    ],
  }

  return configMap[providerType] || []
}
