import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("api/auth/*", "routes/auth.$.tsx"),
  route("posts/new", "routes/posts.new.tsx"),
  route("posts/:slug", "routes/posts.$slug.tsx"),
  route("posts/:slug/edit", "routes/posts.$slug.edit.tsx"),
  route("profile", "routes/profile.tsx"),
  route("api/upload", "routes/api.upload.tsx"),
  route("api/file/*", "routes/api.file.$.tsx"),
  route("admin", "routes/admin.tsx"),
] satisfies RouteConfig;
