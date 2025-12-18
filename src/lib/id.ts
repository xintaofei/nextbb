import crypto from "node:crypto"

export function generateId(): bigint {
  const time = BigInt(Date.now()) * BigInt(1000)
  const rand = BigInt(crypto.randomInt(0, 1000))
  return time + rand
}
