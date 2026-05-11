// Resend email integration — mirrors ProofSlip's pattern

export async function sendEmail(opts: {
  to: string
  subject: string
  html: string
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error(JSON.stringify({ level: 'error', msg: 'RESEND_API_KEY not set, skipping email', to: opts.to }))
    return false
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Context Capsule <noreply@contextcapsule.ai>',
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
      }),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error(JSON.stringify({ level: 'error', msg: 'Resend API error', status: res.status, body, to: opts.to }))
      return false
    }

    return true
  } catch (err) {
    console.error(JSON.stringify({ level: 'error', msg: 'sendEmail failed', error: String(err), to: opts.to }))
    return false
  }
}

export function renderWelcomeEmail(apiKey: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width" /></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Courier New',Courier,monospace;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fafaf5;border-radius:6px;overflow:hidden;">
        <!-- Header -->
        <tr><td style="padding:32px 32px 0 32px;">
          <h1 style="margin:0 0 8px 0;font-size:20px;font-weight:700;color:#111;">Context Capsule</h1>
          <span style="display:inline-block;background:#16a34a;color:#fff;font-size:11px;font-weight:700;letter-spacing:1px;padding:4px 10px;border-radius:3px;">API KEY ISSUED</span>
        </td></tr>

        <!-- Message -->
        <tr><td style="padding:24px 32px 0 32px;">
          <p style="margin:0;font-size:14px;line-height:1.6;color:#333;">
            Your API key is ready. Save it somewhere safe &mdash; it cannot be retrieved later.
          </p>
        </td></tr>

        <!-- Key display -->
        <tr><td style="padding:20px 32px;">
          <div style="background:#111;border-radius:4px;padding:16px;word-break:break-all;">
            <code style="font-family:'Courier New',Courier,monospace;font-size:14px;color:#16a34a;">${apiKey}</code>
          </div>
        </td></tr>

        <!-- Quick start -->
        <tr><td style="padding:0 32px 24px 32px;">
          <p style="margin:0 0 8px 0;font-size:12px;font-weight:700;color:#666;letter-spacing:1px;">QUICK START</p>
          <div style="background:#111;border-radius:4px;padding:14px;word-break:break-all;">
            <code style="font-family:'Courier New',Courier,monospace;font-size:12px;color:#ccc;line-height:1.5;">curl -X POST https://www.contextcapsule.ai/v1/capsules \\<br>&nbsp;&nbsp;-H "Authorization: Bearer ${apiKey}" \\<br>&nbsp;&nbsp;-H "Content-Type: application/json" \\<br>&nbsp;&nbsp;-d '{"summary":"My first capsule","decisions":["Use React"],"next_steps":["Set up CI"]}'</code>
          </div>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 32px;border-top:1px solid #e5e5e0;">
          <p style="margin:0 0 4px 0;font-size:12px;color:#999;">
            <a href="https://www.contextcapsule.ai" style="color:#16a34a;text-decoration:none;">contextcapsule.ai</a>
          </p>
          <p style="margin:0;font-size:11px;color:#bbb;">portable context for agent workflows</p>
        </td></tr>
      </table>

      <!-- Bottom text -->
      <p style="margin:20px 0 0 0;font-size:11px;color:#555;text-align:center;">
        You received this because you signed up for a Context Capsule API key.<br>capsules expire, context compounds.
      </p>
    </td></tr>
  </table>
</body>
</html>`
}
