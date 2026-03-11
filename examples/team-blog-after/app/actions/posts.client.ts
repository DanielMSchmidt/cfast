import type { ClientDescriptor } from "@cfast/actions";

/**
 * Client-safe descriptor for post actions.
 * Action names must match the keys passed to composeActions() in posts.$slug.tsx.
 */
export const postActionsClient: ClientDescriptor = {
  _brand: "ActionClientDescriptor",
  actionNames: ["deletePost", "publishPost", "unpublishPost", "addComment", "deleteComment"] as const,
  permissionsKey: "_actionPermissions",
};
