import { email } from "~/email.server";
import { WelcomeEmail } from "./templates/welcome";

export async function sendWelcomeEmail(emailAddress: string, name: string) {
  await email.send({
    to: emailAddress,
    subject: "Welcome to {{projectName}}!",
    react: WelcomeEmail({ name }),
  });
}
