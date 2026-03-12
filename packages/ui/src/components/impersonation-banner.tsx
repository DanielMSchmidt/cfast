import { useCurrentUser } from "@cfast/auth/client";
import { useComponent } from "../plugin.js";
import type { ImpersonationBannerProps } from "../types.js";

/**
 * Persistent banner shown when an admin is impersonating another user.
 * Hidden when not impersonating.
 */
export function ImpersonationBanner({
  stopAction = "/admin/stop-impersonation",
}: ImpersonationBannerProps) {
  const user = useCurrentUser();
  const Alert = useComponent("alert");
  const Button = useComponent("button");

  if (!user?.isImpersonating) {
    return null;
  }

  return (
    <Alert color="warning">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
        }}
      >
        <strong>{`Viewing as ${user.name} (${user.email})`}</strong>
        <form method="post" action={stopAction}>
          <Button type="submit" variant="outlined" size="sm">
            Stop Impersonating
          </Button>
        </form>
      </div>
    </Alert>
  );
}
