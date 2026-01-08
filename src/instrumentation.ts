/**
 * Next.js Instrumentation API
 * 用于在服务器启动时执行初始化代码
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initializeAutomationSystem } =
      await import("@/lib/automation/index")
    try {
      await initializeAutomationSystem()
    } catch (error) {
      console.error("[Instrumentation] 自动化规则系统初始化失败:", error)
    }
  }
}
