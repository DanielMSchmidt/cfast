import { Html, Head, Body, Text, Link } from "@react-email/components";

type MagicLinkEmailProps = {
  url: string;
};

export function MagicLinkEmail({ url }: MagicLinkEmailProps) {
  return (
    <Html>
      <Head />
      <Body>
        <Text>Click the link below to sign in:</Text>
        <Link href={url}>Sign in to {{projectName}}</Link>
      </Body>
    </Html>
  );
}
