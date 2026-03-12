import { createElement, type ReactElement } from "react";
import JoyAspectRatio from "@mui/joy/AspectRatio";
import JoyTypography from "@mui/joy/Typography";
import type { ImagePreviewProps } from "../types.js";

/**
 * Joy UI styled ImagePreview.
 */
export function ImagePreview({
  fileKey,
  src,
  getUrl,
  width = 200,
  height = 200,
  fallback,
  alt = "Image preview",
}: ImagePreviewProps): ReactElement {
  const resolvedSrc = src ?? (fileKey && getUrl ? getUrl(fileKey) : null);

  if (!resolvedSrc) {
    return fallback
      ? createElement("div", null, fallback)
      : createElement(
          JoyAspectRatio,
          {
            ratio: `${width}/${height}` as unknown as number,
            sx: { width, borderRadius: "sm", bgcolor: "neutral.softBg" },
          },
          createElement(JoyTypography, { level: "body-sm" as const, color: "neutral" as const }, "No image"),
        );
  }

  return createElement(
    JoyAspectRatio,
    {
      ratio: `${width}/${height}` as unknown as number,
      sx: { width, borderRadius: "sm", overflow: "hidden" },
    },
    createElement("img", {
      src: resolvedSrc,
      alt,
      style: { objectFit: "cover", width: "100%", height: "100%" },
    }),
  );
}
