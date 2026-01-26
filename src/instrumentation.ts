/**
 * 用于在服务器启动时执行初始化代码
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initializeAutomationSystem } =
      await import("@/lib/automation/index")
    const { initializeTranslationSystem } =
      await import("@/lib/translation/index")

    try {
      // 并行初始化
      await Promise.all([
        initializeAutomationSystem(),
        initializeTranslationSystem(),
      ])
    } catch (error) {
      console.error("[Instrumentation] 系统初始化失败:", error)
    }
  }
}
