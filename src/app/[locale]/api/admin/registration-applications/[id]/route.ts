import { createHash } from "crypto"
import { NextResponse } from "next/server"
import { z } from "zod"
import { getTranslations } from "next-intl/server"
import { prisma } from "@/lib/prisma"
import { getAdminUser } from "@/lib/server-auth"
import { generateId } from "@/lib/id"
import { sendEmail } from "@/lib/services/email-service"
import { AutomationEvents } from "@/lib/automation/event-bus"

const PatchSchema = z.object({
  action: z.enum(["approve", "reject"]),
  reason: z.string().trim().min(1).max(500),
})

type PatchBody = z.infer<typeof PatchSchema>

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export async function PATCH(
  req: Request,
  props: { params: Promise<{ id: string }> }
): Promise<Response> {
  const params = await props.params
  const reviewer = await getAdminUser()

  let body: PatchBody
  try {
    const json = await req.json()
    body = PatchSchema.parse(json)
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  let applicationId: bigint
  try {
    applicationId = BigInt(params.id)
  } catch {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  const application = await prisma.registration_applications.findUnique({
    where: { id: applicationId },
    select: {
      id: true,
      email: true,
      username: true,
      password_hash: true,
      status: true,
      invite_code_id: true,
      user_id: true,
    },
  })

  if (!application) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  if (application.status !== "PENDING") {
    return NextResponse.json(
      { error: "Application already reviewed" },
      { status: 400 }
    )
  }

  if (application.user_id) {
    return NextResponse.json(
      { error: "Application already linked" },
      { status: 400 }
    )
  }

  const reason = body.reason.trim()
  let emailFailed = false

  if (body.action === "approve") {
    const email = normalizeEmail(application.email)

    const [emailExists, usernameExists] = await Promise.all([
      prisma.users.findUnique({ where: { email } }),
      prisma.users.findFirst({ where: { name: application.username } }),
    ])

    if (emailExists) {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 })
    }

    if (usernameExists) {
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 409 }
      )
    }

    const userId = generateId()
    const emailHash = createHash("md5")
      .update(email.trim().toLowerCase())
      .digest("hex")
    const avatarUrl = `https://www.gravatar.com/avatar/${emailHash}`

    const createdUser = await prisma.$transaction(async (tx) => {
      const userCount = await tx.users.count()
      const isFirstUser = userCount === 0

      const user = await tx.users.create({
        data: {
          id: userId,
          email,
          name: application.username,
          avatar: avatarUrl,
          password: application.password_hash,
          status: 1,
          is_deleted: false,
          is_admin: isFirstUser,
        },
      })

      if (application.invite_code_id) {
        const inviteCode = await tx.user_invite_codes.findUnique({
          where: { id: application.invite_code_id },
          select: { user_id: true },
        })

        if (inviteCode) {
          await tx.user_invitations.create({
            data: {
              id: generateId(),
              inviter_id: inviteCode.user_id,
              invitee_id: userId,
              invite_code_id: application.invite_code_id,
            },
          })
        }
      }

      await tx.registration_applications.update({
        where: { id: applicationId },
        data: {
          status: "APPROVED",
          review_reason: reason,
          reviewer_id: reviewer.userId,
          reviewed_at: new Date(),
          user_id: userId,
        },
      })

      return user
    })

    await AutomationEvents.userRegister({
      userId: createdUser.id,
      email: createdUser.email,
    })

    try {
      const tEmail = await getTranslations("Auth.Register.review")
      const subject = tEmail("approved.subject")
      const text = tEmail("approved.textBody", { reason })
      const htmlLine1 = tEmail("approved.htmlLine1")
      const htmlLine2 = tEmail("approved.htmlLine2", { reason })
      const html = `${htmlLine1}<br />${htmlLine2}`
      await sendEmail({ to: createdUser.email, subject, text, html })
    } catch (error) {
      console.error("Failed to send approval email:", error)
      emailFailed = true
    }

    return NextResponse.json(
      {
        success: true,
        status: "APPROVED",
        emailFailed,
      },
      { status: 200 }
    )
  }

  await prisma.registration_applications.update({
    where: { id: applicationId },
    data: {
      status: "REJECTED",
      review_reason: reason,
      reviewer_id: reviewer.userId,
      reviewed_at: new Date(),
    },
  })

  try {
    const tEmail = await getTranslations("Auth.Register.review")
    const subject = tEmail("rejected.subject")
    const text = tEmail("rejected.textBody", { reason })
    const htmlLine1 = tEmail("rejected.htmlLine1")
    const htmlLine2 = tEmail("rejected.htmlLine2", { reason })
    const html = `${htmlLine1}<br />${htmlLine2}`
    await sendEmail({ to: application.email, subject, text, html })
  } catch (error) {
    console.error("Failed to send rejection email:", error)
    emailFailed = true
  }

  return NextResponse.json(
    {
      success: true,
      status: "REJECTED",
      emailFailed,
    },
    { status: 200 }
  )
}
