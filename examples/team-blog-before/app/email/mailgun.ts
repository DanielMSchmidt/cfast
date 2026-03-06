import type { Env } from "~/env";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(env: Env, options: SendEmailOptions) {
  const form = new FormData();
  form.append("from", `Team Blog <noreply@${env.MAILGUN_DOMAIN}>`);
  form.append("to", options.to);
  form.append("subject", options.subject);
  form.append("html", options.html);
  if (options.text) form.append("text", options.text);

  const response = await fetch(
    `https://api.mailgun.net/v3/${env.MAILGUN_DOMAIN}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`api:${env.MAILGUN_API_KEY}`)}`,
      },
      body: form,
    }
  );

  if (!response.ok) {
    console.error("Mailgun error:", await response.text());
  }
}
