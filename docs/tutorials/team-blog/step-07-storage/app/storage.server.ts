import { defineStorage, filetype } from "@cfast/storage";

export const storage = defineStorage({
  postCoverImage: filetype({
    bucket: "UPLOADS",
    accept: ["image/jpeg", "image/png", "image/webp"],
    maxSize: "10mb",
    key: (file, ctx) =>
      `covers/${ctx.input.postId}/${crypto.randomUUID()}-${file.name}`,
    replace: true,
  }),
});
