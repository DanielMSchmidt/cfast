import { useState, useCallback, useRef } from "react";
import { useComponent } from "../plugin.js";
import type { DropZoneProps } from "../types.js";

/**
 * Drag-and-drop file upload area that integrates with `@cfast/storage`.
 *
 * Accepts an `upload` result from `useUpload()` (`@cfast/storage/client`).
 * File type restrictions and max size are inherited from the storage schema.
 * Renders via the UI plugin's `dropZone` slot and manages drag state,
 * file validation, and upload progress internally.
 *
 * @param props - See {@link DropZoneProps}.
 *
 * @example
 * ```tsx
 * const upload = useUpload("postCoverImage");
 *
 * <DropZone upload={upload} />
 *
 * // Allow multiple files:
 * <DropZone upload={upload} multiple />
 * ```
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
