import { useState, useCallback, useRef } from "react";
import { useComponent } from "../plugin.js";
import type { DropZoneProps } from "../types.js";

/**
 * Headless DropZone — drag-and-drop file upload area.
 * Integrates with `useUpload()` from `@cfast/storage/client`.
 */
export function DropZone({
  upload,
  multiple = false,
  children,
}: DropZoneProps) {
  const DropZoneSlot = useComponent("dropZone");
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
    (files: FileList) => {
      setIsDragOver(false);
      handleFiles(files);
    },
    [handleFiles],
  );

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleDragOver = useCallback((_e: unknown) => {
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const defaultContent = upload.isUploading
    ? `Uploading... ${upload.progress}%`
    : upload.error ?? upload.validationError ?? "Drop files here or click to browse";

  return (
    <div>
      <DropZoneSlot
        isDragOver={isDragOver}
        isInvalid={!!(upload.error || upload.validationError)}
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        accept={upload.accept}
      >
        {children ?? defaultContent}
      </DropZoneSlot>
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
