export function meta() {
  return [
    { title: "{{projectName}}" },
    { name: "description", content: "Built with cfast" },
  ];
}

export default function Index() {
  return (
    <main
      style={{
        fontFamily: "system-ui, sans-serif",
        padding: "3rem 1.5rem",
        maxWidth: "640px",
        margin: "0 auto",
      }}
    >
      <h1 style={{ marginBottom: "0.5rem" }}>Welcome to {{projectName}}</h1>
      <p style={{ color: "#555" }}>
        Built with cfast — Cloudflare Workers + React Router 7 + Drizzle + D1.
      </p>
    </main>
  );
}
