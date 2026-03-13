import { useCurrentUser } from "@cfast/auth/client";
import { useComponent } from "../plugin.js";
import type { ImpersonationBannerProps } from "../types.js";

/**
 * Persistent banner shown when an admin is impersonating another user.
 *
 * Reads the current user from `@cfast/auth` via `useCurrentUser()`. When the
 * user has `isImpersonating` set, renders a warning alert with the impersonated
 * user's name/email and a "Stop Impersonating" button that posts to `stopAction`.
 * Hidden when not impersonating.
 *
 * @param props - See {@link ImpersonationBannerProps}.
 *
 * @example
 * ```tsx
 * // In your root layout:
 * <ImpersonationBanner />
 *
 * // With custom stop action URL:
 * <ImpersonationBanner stopAction="/api/stop-impersonation" />
 * ```
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
