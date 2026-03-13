import { type ReactElement } from "react";
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
    return fallback ? (
      <div>{fallback}</div>
    ) : (
      <JoyAspectRatio
        ratio={width / height}
        sx={{ width, borderRadius: "sm", bgcolor: "neutral.softBg" }}
      >
        {/* MUI polymorphic component workaround — literal types required */}
        <JoyTypography level={"body-sm" as const} color={"neutral" as const}>
          No image
        </JoyTypography>
      </JoyAspectRatio>
    );
  }

  return (
    <JoyAspectRatio
      ratio={width / height}
      sx={{ width, borderRadius: "sm", overflow: "hidden" }}
    >
      <img
        src={resolvedSrc}
        alt={alt}
        style={{ objectFit: "cover", width: "100%", height: "100%" }}
      />
    </JoyAspectRatio>
  );
}
