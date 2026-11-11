/**
 * Extract useful fields from SMS body. Raw body is always stored separately.
 * @param {{ address: string, body: string }} sms
 * @returns {Array<{ type: string, value: string, confidence: number, meta?: object }>}
 */
export function parseSms(sms) {
  const body = sms.body ?? ''
  const entities = []

  entities.push({
    type: 'sender',
    value: sms.address,
    confidence: 1,
    meta: { source: 'address' },
  })

  const otp =
    body.match(/\b(?:OTP|code|رمز|کد)(?:\s+(?:code|is|is your))*[:\s-]*([0-9]{4,8})\b/i) ||
    body.match(/\b([0-9]{4,8})\b(?:\s*(?:is your|code|OTP))/i) ||
    body.match(/(?:^|[^0-9])([0-9]{5,6})(?=[^0-9]|$)/)
  if (otp) {
    entities.push({ type: 'otp', value: otp[1], confidence: 0.85, meta: { match: otp[0] } })
  }

  const amountPatterns = [
    /(?:amount|sum|مبلغ|ریال|تومان|IRR|USD|EUR)[:\s]*([0-9]{1,3}(?:[,.\s][0-9]{3})*(?:[.,][0-9]{1,2})?)/i,
    /([0-9]{1,3}(?:[,.\s][0-9]{3})+(?:[.,][0-9]{1,2})?)\s*(?:ریال|تومان|IRR|USD|EUR|Rials?)/i,
  ]
  for (const re of amountPatterns) {
    const m = body.match(re)
    if (m) {
      entities.push({
        type: 'amount',
        value: m[1].replace(/\s/g, ''),
        confidence: 0.75,
        meta: { match: m[0] },
      })
      break
    }
  }

  const phoneRe = /(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,4}/g
  const phones = body.match(phoneRe) || []
  for (const p of phones.slice(0, 5)) {
    const digits = p.replace(/\D/g, '')
    if (digits.length >= 7 && digits.length <= 15) {
      entities.push({ type: 'phone', value: p.trim(), confidence: 0.7 })
    }
  }

  const urlRe = /https?:\/\/[^\s<>"']+/gi
  const urls = body.match(urlRe) || []
  for (const u of urls.slice(0, 5)) {
    entities.push({ type: 'url', value: u, confidence: 0.95 })
  }

  return entities
}
