import { useState, useCallback, useRef, type ReactElement } from "react";
import JoySheet from "@mui/joy/Sheet";
import JoyTypography from "@mui/joy/Typography";
import JoyLinearProgress from "@mui/joy/LinearProgress";
import type { DropZoneProps } from "../types.js";

/**
 * Joy UI styled DropZone — drag-and-drop file upload area.
 */
export function DropZone({
  upload,
  multiple = false,
  children,
}: DropZoneProps): ReactElement {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      if (multiple) {
        for (let i = 0; i < files.length; i++) {
          upload.start(files[i]);
        }
      } else {
        upload.start(files[0]);
      }
    },
    [upload, multiple],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const hasError = !!(upload.error || upload.validationError);

  return (
    <div>
      <JoySheet
        variant={"outlined" as const}
        sx={{
          borderStyle: "dashed",
          borderWidth: 2,
          borderColor: hasError
            ? "danger.400"
            : isDragOver
              ? "primary.400"
              : "neutral.outlinedBorder",
          borderRadius: "md",
          p: 4,
          textAlign: "center",
          cursor: "pointer",
          transition: "border-color 0.2s",
          "&:hover": { borderColor: "primary.300" },
        }}
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {children ?? (
          <div>
            {upload.isUploading ? (
              <div>
                <JoyTypography level={"body-sm" as const}>
                  {`Uploading... ${upload.progress}%`}
                </JoyTypography>
                <JoyLinearProgress
                  determinate
                  value={upload.progress}
                  sx={{ mt: 1 }}
                />
              </div>
            ) : hasError ? (
              <JoyTypography color={"danger" as const} level={"body-sm" as const}>
                {upload.error ?? upload.validationError}
              </JoyTypography>
            ) : (
              <JoyTypography level={"body-sm" as const} color={"neutral" as const}>
                Drop files here or click to browse
              </JoyTypography>
            )}
          </div>
        )}
      </JoySheet>
      <input
        ref={inputRef}
        type="file"
        accept={upload.accept}
        multiple={multiple}
        style={{ display: "none" }}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFiles(e.target.files)}
      />
    </div>
  );
}
