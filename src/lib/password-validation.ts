/**
 * 密码强度验证模块
 * 检测常见弱密码和不安全模式
 */

// 常见弱密码黑名单（前 50 个最常用密码）
const COMMON_PASSWORDS = new Set([
  "12345678",
  "password",
  "123456789",
  "12345",
  "1234567",
  "password1",
  "12345678",
  "1234567890",
  "qwerty",
  "abc123",
  "111111",
  "123123",
  "admin",
  "letmein",
  "welcome",
  "monkey",
  "1234",
  "dragon",
  "master",
  "666666",
  "123456",
  "654321",
  "superman",
  "qazwsx",
  "000000",
  "password123",
  "iloveyou",
  "1q2w3e4r",
  "123456789",
  "qwertyuiop",
  "password1",
  "admin123",
  "root",
  "toor",
  "pass",
  "test",
  "guest",
  "123321",
  "1qaz2wsx",
  "qwerty123",
])

/**
 * 检查密码是否为弱密码
 * @param password 待检查的密码
 * @returns 如果是弱密码返回 true
 */
export function isWeakPassword(password: string): boolean {
  const lower = password.toLowerCase()

  // 1. 检查是否在常见密码黑名单中
  if (COMMON_PASSWORDS.has(lower)) {
    return true
  }

  // 2. 检查纯重复字符（如 "aaaaaaaa", "11111111"）
  if (/^(.)\1+$/.test(password)) {
    return true
  }

  // 3. 检查连续数字序列（如 "12345678", "87654321"）
  if (
    /(0123|1234|2345|3456|4567|5678|6789|7890)/.test(password) ||
    /(9876|8765|7654|6543|5432|4321|3210)/.test(password)
  ) {
    return true
  }

  // 4. 检查连续字母序列（如 "abcdefgh", "qwertyui"）
  if (
    /(abcd|bcde|cdef|defg|efgh|fghi|ghij|hijk)/.test(lower) ||
    /(qwerty|asdfgh|zxcvbn)/.test(lower)
  ) {
    return true
  }

  // 5. 检查键盘模式（如 "qweasd", "zxcasd"）
  const keyboardPatterns = [
    "qweasd",
    "asdzxc",
    "zxcasd",
    "qazwsx",
    "wsxedc",
    "edcrfv",
  ]
  if (keyboardPatterns.some((pattern) => lower.includes(pattern))) {
    return true
  }

  return false
}

/**
 * 获取密码强度等级
 * @param password 待检查的密码
 * @returns 强度等级 "weak" | "medium" | "strong"
 */
export function getPasswordStrength(
  password: string
): "weak" | "medium" | "strong" {
  if (isWeakPassword(password)) {
    return "weak"
  }

  let score = 0

  // 长度得分
  if (password.length >= 12) score += 2
  else if (password.length >= 10) score += 1

  // 字符多样性得分
  if (/[a-z]/.test(password)) score += 1 // 小写字母
  if (/[A-Z]/.test(password)) score += 1 // 大写字母
  if (/[0-9]/.test(password)) score += 1 // 数字
  if (/[^a-zA-Z0-9]/.test(password)) score += 1 // 特殊字符

  if (score >= 5) return "strong"
  if (score >= 3) return "medium"
  return "weak"
}
