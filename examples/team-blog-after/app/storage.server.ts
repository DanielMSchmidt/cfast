import { defineStorage, filetype } from "@cfast/storage";
import { nanoid } from "nanoid";

export const storage = defineStorage({
  postCovers: filetype({
    bucket: "UPLOADS",
    accept: ["image/jpeg", "image/png", "image/webp"] as const,
    maxSize: "10mb",
    key: (file, ctx) => {
      const prefix = ctx.input.postId ?? ctx.user.id;
      return `covers/${prefix}/${nanoid()}-${file.name}`;
    },
  }),
  avatars: filetype({
    bucket: "UPLOADS",
    accept: ["image/jpeg", "image/png", "image/webp"] as const,
    maxSize: "2mb",
    key: (file, ctx) =>
      `avatars/${ctx.user.id}/${nanoid()}-${file.name}`,
    replace: true,
  }),
});
