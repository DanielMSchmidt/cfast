import type { Config } from "../types";

export function generateAuthSetup(config: Config): string {
  const imports: string[] = [
    `import { createAuth } from "@cfast/auth";`,
    `import * as schema from "./db/schema";`,
    `import { permissions } from "./permissions";`,
    `import { env } from "./env";`,
  ];

  let sendMagicLinkBody: string;

  if (config.features.email) {
    imports.push(`import { email as emailClient } from "~/email.server";`);
    imports.push(`import { MagicLinkEmail } from "~/email/templates/magic-link";`);

    sendMagicLinkBody = `      await emailClient.send({
        to: email,
        subject: "Sign in to ${config.projectName}",
        react: MagicLinkEmail({ url }),
      });`;
  } else {
    sendMagicLinkBody = `      console.log(\`Magic link for \${email}: \${url}\`);`;
  }

  return `${imports.join("\n")}

export const initAuth = createAuth({
  permissions,
  schema,
  magicLink: {
    sendMagicLink: async ({ email, url }) => {
${sendMagicLinkBody}
    },
  },
  session: { expiresIn: "30d" },
  defaultRoles: ["member"],
});
`;
}
