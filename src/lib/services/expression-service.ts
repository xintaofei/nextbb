import { prisma } from "@/lib/prisma"
import { getTranslationsQuery, getTranslationFields } from "@/lib/locale"

/**
 * 获取所有启用的表情分组及其表情
 */
export async function getEnabledExpressions(locale: string) {
  const groups = await prisma.expression_groups.findMany({
    where: {
      is_enabled: true,
      is_deleted: false,
    },
    include: {
      translations: getTranslationsQuery(locale, {
        name: true,
      }),
      expressions: {
        where: {
          is_enabled: true,
          is_deleted: false,
        },
        orderBy: {
          sort: "asc",
        },
        include: {
          translations: getTranslationsQuery(locale, {
            name: true,
          }),
        },
      },
    },
    orderBy: {
      sort: "asc",
    },
  })

  return groups.map((group) => {
    const groupFields = getTranslationFields(group.translations, locale, {
      name: "",
    })

    return {
      id: group.id.toString(),
      code: group.code,
      name: groupFields.name,
      iconId: group.icon_id?.toString() || null,
      expressions: group.expressions.map((exp) => {
        const expFields = getTranslationFields(exp.translations, locale, {
          name: "",
        })

        return {
          id: exp.id.toString(),
          groupId: exp.group_id.toString(),
          code: exp.code,
          name: expFields.name,
          imagePath: exp.image_path,
          imageUrl: exp.image_path,
          width: exp.width,
          height: exp.height,
          sort: exp.sort,
        }
      }),
    }
  })
}
