import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("api/auth/*", "routes/auth.$.tsx"),
  route("posts", "routes/posts/index.tsx"),
  route("posts/new", "routes/posts/new.tsx"),
  route("posts/:id", "routes/posts/$id.tsx"),
  route("admin", "routes/admin.tsx"),
  route("api/upload", "routes/api.upload.tsx"),
  route("api/file/*", "routes/api.file.$.tsx"),
] satisfies RouteConfig;
