interface WelcomeEmailProps {
  name: string;
}

export function WelcomeEmail({ name }: WelcomeEmailProps) {
  return (
    <html>
      <head />
      <body style={{ fontFamily: "sans-serif", padding: "20px" }}>
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <h1>Welcome to {{projectName}}!</h1>
          <p>Hi {name}, your account has been created successfully.</p>
          <hr />
          <p style={{ color: "#666", fontSize: "12px" }}>{{projectName}}</p>
        </div>
      </body>
    </html>
  );
}
