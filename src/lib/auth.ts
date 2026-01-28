import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { getGeoInfo } from "@/lib/geo"
import { differenceInCalendarDays } from "date-fns"
import { generateId } from "@/lib/id"
import { AutomationEvents } from "@/lib/automation/event-bus"

/**
 * 记录用户登录信息
 */
export async function recordLogin(
  userId: bigint | null,
  status: "SUCCESS" | "FAILED" = "SUCCESS",
  loginMethod: string = "UNKNOWN"
) {
  try {
    const headersList = await headers()
    const ip = headersList.get("x-forwarded-for") || "unknown"
    const userAgent = headersList.get("user-agent")
    const geo = await getGeoInfo()
    const now = new Date()

    if (status === "SUCCESS" && userId) {
      // Get current stats
      const stats = await prisma.user_login_stats.findUnique({
        where: { user_id: userId },
      })

      let consecutiveDays = stats?.consecutive_login_days || 0
      let totalLoginDays = stats?.total_login_days || 0

      if (stats?.last_login_at) {
        const diff = differenceInCalendarDays(now, stats.last_login_at)
        if (diff === 1) {
          consecutiveDays += 1
          totalLoginDays += 1
        } else if (diff > 1) {
          consecutiveDays = 1 // reset
          totalLoginDays += 1
        }
        // if diff == 0, same day, do not increase total or consecutive
      } else {
        // first time
        consecutiveDays = 1
        totalLoginDays = 1
      }

      // Upsert stats
      await prisma.user_login_stats.upsert({
        where: { user_id: userId },
        create: {
          user_id: userId,
          last_login_at: now,
          last_login_ip: ip,
          consecutive_login_days: consecutiveDays,
          total_login_days: totalLoginDays,
          location_lat: geo.latitude,
          location_long: geo.longitude,
        },
        update: {
          last_login_at: now,
          last_login_ip: ip,
          consecutive_login_days: consecutiveDays,
          total_login_days: totalLoginDays,
          location_lat: geo.latitude,
          location_long: geo.longitude,
        },
      })

      // Emit event
      await AutomationEvents.userLogin({
        userId: userId,
        loginTime: now,
        consecutiveDays: consecutiveDays,
      })
    }

    // Create log
    // For FAILED status, userId might be null if email not found
    await prisma.user_login_logs.create({
      data: {
        id: generateId(),
        user_id: userId || BigInt(0), // Use 0 for unknown user
        ip: ip,
        user_agent: userAgent,
        location_lat: geo.latitude,
        location_long: geo.longitude,
        status: status,
        login_method: loginMethod,
        login_at: now,
      },
    })
  } catch (error) {
    console.error("Error recording login:", error)
  }
}
