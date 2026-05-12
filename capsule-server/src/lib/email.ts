export async function sendEmail(opts: {
  to: string
  subject: string
  html: string
}): Promise<boolean> {
  const apiKey = process.env.WIKI_MAIL_API_KEY
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
        from: 'Wiki Clipper <noreply@contextcapsule.ai>',
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

export function renderWikiKeyEmail(apiKey: string, wikiId: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width" /></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Courier New',Courier,monospace;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fafaf5;border-radius:6px;overflow:hidden;">

        <tr><td style="padding:32px 32px 0 32px;">
          <h1 style="margin:0 0 8px 0;font-size:20px;font-weight:700;color:#111;">Wiki Clipper</h1>
          <span style="display:inline-block;background:#16a34a;color:#fff;font-size:11px;font-weight:700;letter-spacing:1px;padding:4px 10px;border-radius:3px;">WIKI API KEY ISSUED</span>
        </td></tr>

        <tr><td style="padding:24px 32px 0 32px;">
          <p style="margin:0;font-size:14px;line-height:1.6;color:#333;">
            Your Wiki API key is ready. Save it somewhere safe — it cannot be retrieved later.
          </p>
        </td></tr>

        <tr><td style="padding:20px 32px 0 32px;">
          <p style="margin:0 0 6px 0;font-size:11px;font-weight:700;color:#666;letter-spacing:1px;">API KEY</p>
          <div style="background:#111;border-radius:4px;padding:16px;word-break:break-all;">
            <code style="font-family:'Courier New',Courier,monospace;font-size:13px;color:#16a34a;">${apiKey}</code>
          </div>
        </td></tr>

        <tr><td style="padding:16px 32px 0 32px;">
          <p style="margin:0 0 6px 0;font-size:11px;font-weight:700;color:#666;letter-spacing:1px;">WIKI ID</p>
          <div style="background:#111;border-radius:4px;padding:12px;word-break:break-all;">
            <code style="font-family:'Courier New',Courier,monospace;font-size:12px;color:#9ca3af;">${wikiId}</code>
          </div>
        </td></tr>

        <tr><td style="padding:20px 32px 0 32px;">
          <p style="margin:0 0 8px 0;font-size:11px;font-weight:700;color:#666;letter-spacing:1px;">QUICK START</p>
          <div style="background:#111;border-radius:4px;padding:14px;word-break:break-all;">
            <code style="font-family:'Courier New',Courier,monospace;font-size:12px;color:#ccc;line-height:1.8;">
              1. Open Wiki Clipper extension<br>
              2. Click ⚙ Settings<br>
              3. Paste this key under Wiki API Key<br>
              4. Save &amp; Test connection
            </code>
          </div>
        </td></tr>

        <tr><td style="padding:24px 32px;border-top:1px solid #e5e5e0;margin-top:24px;">
          <p style="margin:0;font-size:12px;color:#999;">
            <a href="https://context-capsule-two.vercel.app" style="color:#16a34a;text-decoration:none;">context-capsule-two.vercel.app</a>
          </p>
          <p style="margin:4px 0 0 0;font-size:11px;color:#bbb;">your personal LLM wiki</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
