import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM || 'intranet@agence-macao.com'

export async function sendMagicLink(email, lien, prenom = '') {
  const salutation = prenom ? `Bonjour ${prenom},` : 'Bonjour,'

  const html = `
    <div style="font-family:'Work Sans',Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;color:#1d1d1b">
      <p style="font-size:16px">${salutation}</p>
      <p style="font-size:16px;line-height:1.55">
        Voici votre lien de connexion à l'intranet Macao. Il est valable
        <strong>15 minutes</strong> et ne fonctionne qu'une fois.
      </p>
      <p style="margin:28px 0">
        <a href="${lien}"
           style="background:#c0562f;color:#fff;text-decoration:none;padding:14px 26px;border-radius:8px;font-weight:700;display:inline-block">
          Ouvrir l'intranet
        </a>
      </p>
      <p style="font-size:13px;color:#6b6b68;line-height:1.5">
        Si vous n'êtes pas à l'origine de cette demande, ignorez cet email :
        aucune connexion ne sera ouverte.
      </p>
    </div>`

  await resend.emails.send({
    from: `Intranet Macao <${FROM}>`,
    to: email,
    subject: 'Votre lien de connexion à l\'intranet Macao',
    html
  })
}
