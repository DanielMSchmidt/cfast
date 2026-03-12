import type { ReactElement } from "react";

export type EmailMessage = {
  to: string;
  from: string;
  subject: string;
  html: string;
  text: string;
};

export type EmailProvider = {
  name: string;
  send: (message: EmailMessage) => Promise<{ id: string }>;
};

export type EmailClientConfig = {
  provider: EmailProvider | (() => EmailProvider);
  from: string | (() => string);
};

export type SendOptions = {
  to: string;
  subject: string;
  react: ReactElement;
  from?: string;
};

export type EmailClient = {
  send: (options: SendOptions) => Promise<{ id: string }>;
};
