import { useCallback, useId, useRef, useState, type ReactElement } from "react";
import JoyBox from "@mui/joy/Box";
import JoyTypography from "@mui/joy/Typography";
import JoyLinearProgress from "@mui/joy/LinearProgress";
import JoyIconButton from "@mui/joy/IconButton";
import JoyStack from "@mui/joy/Stack";
import JoyFormLabel from "@mui/joy/FormLabel";
import type { UploadFieldFile, UploadFieldProps } from "@cfast/ui";

/**
 * Default uploader implementation backed by `XMLHttpRequest` so we can
 * stream upload progress back into the field. Identical contract to the
 * headless `@cfast/ui` version — both packages keep their own copy so
 * neither has to depend on the other for runtime helpers.
 *
 * @internal
 */
function defaultUploader(
  file: File,
  options: {
    url: string;
    onProgress: (percent: number) => void;
    signal?: AbortSignal;
  },
): Promise<{ key: string; size: number; type: string; url?: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", options.url);

    xhr.upload.addEventListener("progress", (event: ProgressEvent) => {
      if (event.lengthComputable) {
        options.onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const parsed = JSON.parse(xhr.responseText) as {
            key?: unknown;
            size?: unknown;
            type?: unknown;
            url?: unknown;
          };
          if (
            typeof parsed.key === "string" &&
            typeof parsed.size === "number" &&
            typeof parsed.type === "string"
          ) {
            resolve({
              key: parsed.key,
              size: parsed.size,
              type: parsed.type,
              url: typeof parsed.url === "string" ? parsed.url : undefined,
            });
            return;
          }
          reject(new Error("Invalid response from server"));
        } catch {
          reject(new Error("Invalid response from server"));
        }
      } else {
        try {
          const parsed = JSON.parse(xhr.responseText) as {
            detail?: unknown;
            message?: unknown;
          };
          const detail =
            typeof parsed.detail === "string"
              ? parsed.detail
              : typeof parsed.message === "string"
                ? parsed.message
                : `Upload failed (${xhr.status})`;
          reject(new Error(detail));
        } catch {
          reject(new Error(`Upload failed (${xhr.status})`));
        }
      }
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Network error during upload"));
    });

    if (options.signal) {
      options.signal.addEventListener("abort", () => {
        xhr.abort();
        reject(new Error("Upload cancelled"));
      });
    }

    const formData = new FormData();
    formData.append("file", file);
    xhr.send(formData);
  });
}

/**
 * Match a file's MIME type against the comma-separated `accept` string from
 * the field props. Mirrors the helper inside the headless variant.
 *
 * @internal
 */
function matchesAccept(file: File, accept: string | undefined): boolean {
  if (!accept) return true;
  const tokens = accept
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  if (tokens.length === 0) return true;
  const fileType = (file.type || "").toLowerCase();
  const fileName = file.name.toLowerCase();
  for (const token of tokens) {
    if (token.startsWith(".")) {
      if (fileName.endsWith(token)) return true;
    } else if (token.endsWith("/*")) {
      const prefix = token.slice(0, -1);
      if (fileType.startsWith(prefix)) return true;
    } else if (token === fileType) {
      return true;
    }
  }
  return false;
}

/**
 * Format a byte count as a human-readable string.
 *
 * @internal
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Decide whether a given uploaded R2 key represents an image we can preview
 * inline. Conservative — we only preview when the original file's MIME type
 * was an image (tracker entries) or when the key has an image extension
 * (committed values from a previous render).
 *
 * @internal
 */
function looksLikeImageKey(key: string): boolean {
  return /\.(png|jpe?g|webp|gif|avif|svg)(\?|$)/i.test(key);
}

/**
 * Joy UI styled drop zone + multi-file upload field.
 *
 * Same controlled API as the headless `@cfast/ui` `UploadField`: it accepts
 * a `value` array of R2 keys and emits the new array via `onChange` whenever
 * an upload completes or a file is removed. The visual layer uses Joy's
 * `<Box>` (soft variant + dashed border), `<LinearProgress>` per file, and
 * `<IconButton>` for removals.
 *
 * Re-exports the same {@link UploadFieldProps} type from `@cfast/ui` so
 * consumers can swap implementations without changing prop usage.
 *
 * @example
 * ```tsx
 * import { UploadField } from "@cfast/joy";
 *
 * <UploadField
 *   filetype="productImages"
 *   basePath="/uploads"
 *   multiple
 *   maxFiles={10}
 *   accept="image/*"
 *   value={imageKeys}
 *   onChange={setImageKeys}
 * />
 * ```
 */
export function UploadField({
  label,
  className,
  filetype,
  basePath = "/uploads",
  multiple = false,
  maxFiles,
  accept,
  maxSize,
  value,
  onChange,
  onError,
  disabled = false,
  uploader = defaultUploader,
}: UploadFieldProps): ReactElement {
  const [files, setFiles] = useState<UploadFieldFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const reactId = useId();

  const normalizedBase = `/${basePath.replace(/^\/+|\/+$/g, "")}`;
  const uploadUrl = `${normalizedBase}/${filetype}`;
  const effectiveMax =
    maxFiles ?? (multiple ? Number.POSITIVE_INFINITY : 1);
  const currentValue = value ?? [];

  const appendKey = useCallback(
    (key: string) => {
      const next = [...currentValue, key];
      onChange?.(next);
    },
    [currentValue, onChange],
  );

  const removeKey = useCallback(
    (key: string) => {
      const next = currentValue.filter((k) => k !== key);
      onChange?.(next);
    },
    [currentValue, onChange],
  );

  const removeTrackerEntry = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const handleFiles = useCallback(
    async (incoming: FileList | File[]) => {
      if (disabled) return;
      setGlobalError(null);

      const list = Array.from(incoming);
      if (list.length === 0) return;

      const inFlight = files.filter((f) => f.status !== "error").length;
      const remainingSlots = effectiveMax - currentValue.length - inFlight;
      if (remainingSlots <= 0) {
        setGlobalError(
          `Maximum of ${effectiveMax} file${effectiveMax === 1 ? "" : "s"} reached`,
        );
        return;
      }
      if (list.length > remainingSlots) {
        setGlobalError(
          `Only ${remainingSlots} more file${remainingSlots === 1 ? "" : "s"} allowed`,
        );
        list.length = remainingSlots;
      }

      const accepted: { entry: UploadFieldFile; file: File }[] = [];
      for (const file of list) {
        const id = `${reactId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        if (!matchesAccept(file, accept)) {
          const errEntry: UploadFieldFile = {
            id,
            name: file.name,
            size: file.size,
            type: file.type,
            progress: 0,
            status: "error",
            error: `${file.type || "file"} is not an accepted type`,
          };
          accepted.push({ entry: errEntry, file });
          onError?.(errEntry);
          continue;
        }
        if (maxSize != null && file.size > maxSize) {
          const errEntry: UploadFieldFile = {
            id,
            name: file.name,
            size: file.size,
            type: file.type,
            progress: 0,
            status: "error",
            error: `File is ${formatBytes(file.size)} but max is ${formatBytes(maxSize)}`,
          };
          accepted.push({ entry: errEntry, file });
          onError?.(errEntry);
          continue;
        }
        accepted.push({
          entry: {
            id,
            name: file.name,
            size: file.size,
            type: file.type,
            progress: 0,
            status: "pending",
          },
          file,
        });
      }

      setFiles((prev) => [...prev, ...accepted.map((a) => a.entry)]);

      for (const { entry, file } of accepted) {
        if (entry.status === "error") continue;
        setFiles((prev) =>
          prev.map((f) =>
            f.id === entry.id ? { ...f, status: "uploading" } : f,
          ),
        );
        try {
          const result = await uploader(file, {
            url: uploadUrl,
            onProgress: (percent) => {
              setFiles((prev) =>
                prev.map((f) =>
                  f.id === entry.id ? { ...f, progress: percent } : f,
                ),
              );
            },
          });
          setFiles((prev) =>
            prev.map((f) =>
              f.id === entry.id
                ? { ...f, status: "success", progress: 100, key: result.key }
                : f,
            ),
          );
          appendKey(result.key);
          setFiles((prev) => prev.filter((f) => f.id !== entry.id));
        } catch (e) {
          const message = e instanceof Error ? e.message : String(e);
          const errEntry: UploadFieldFile = {
            ...entry,
            status: "error",
            error: message,
          };
          setFiles((prev) =>
            prev.map((f) => (f.id === entry.id ? errEntry : f)),
          );
          onError?.(errEntry);
        }
      }
    },
    [
      accept,
      appendKey,
      currentValue.length,
      disabled,
      effectiveMax,
      files,
      maxSize,
      onError,
      reactId,
      uploadUrl,
      uploader,
    ],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      void handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) setIsDragOver(true);
    },
    [disabled],
  );

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleClick = useCallback(() => {
    if (disabled) return;
    inputRef.current?.click();
  }, [disabled]);

  return (
    <JoyBox className={className} data-cfast-upload-field={filetype}>
      {label != null ? (
        <JoyFormLabel htmlFor={`${reactId}-input`} sx={{ mb: 0.5 }}>
          {label}
        </JoyFormLabel>
      ) : null}
      <JoyBox
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        data-drag-over={isDragOver}
        data-testid="upload-field-drop-zone"
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
        sx={{
          borderStyle: "dashed",
          borderWidth: 2,
          borderColor: isDragOver
            ? ("primary.400" as const)
            : ("neutral.outlinedBorder" as const),
          borderRadius: "md" as const,
          p: 4,
          textAlign: "center" as const,
          cursor: disabled ? ("not-allowed" as const) : ("pointer" as const),
          opacity: disabled ? 0.6 : 1,
          backgroundColor: ("background.level1" as const),
          transition: "border-color 0.2s",
          "&:hover": disabled
            ? undefined
            : { borderColor: ("primary.300" as const) },
        }}
      >
        <JoyTypography level={"body-sm" as const} color={"neutral" as const}>
          {multiple
            ? "Drop files here or click to browse"
            : "Drop a file here or click to browse"}
        </JoyTypography>
      </JoyBox>
      <input
        ref={inputRef}
        id={`${reactId}-input`}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        style={{ display: "none" }}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          void handleFiles(e.target.files ?? []);
          e.target.value = "";
        }}
        data-testid="upload-field-input"
      />
      {globalError != null ? (
        <JoyTypography
          role={"alert" as const}
          data-testid="upload-field-global-error"
          color={"danger" as const}
          level={"body-sm" as const}
          sx={{ mt: 1 }}
        >
          {globalError}
        </JoyTypography>
      ) : null}
      {currentValue.length > 0 ? (
        <JoyStack
          spacing={1}
          sx={{ mt: 1 }}
          data-testid="upload-field-value-list"
        >
          {currentValue.map((key) => (
            <JoyBox
              key={key}
              data-testid="upload-field-value-item"
              sx={{
                display: "flex" as const,
                alignItems: "center" as const,
                gap: 1,
                p: 1,
                borderRadius: "sm" as const,
                backgroundColor: ("background.level1" as const),
              }}
            >
              {looksLikeImageKey(key) ? (
                <JoyBox
                  component="img"
                  src={`${normalizedBase}/${key.replace(/^\/+/, "")}`}
                  alt={key}
                  sx={{
                    width: 40,
                    height: 40,
                    objectFit: "cover" as const,
                    borderRadius: "sm" as const,
                  }}
                />
              ) : null}
              <JoyTypography
                level={"body-sm" as const}
                sx={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}
              >
                {key}
              </JoyTypography>
              <JoyIconButton
                size={"sm" as const}
                variant={"plain" as const}
                color={"danger" as const}
                aria-label={`Remove ${key}`}
                disabled={disabled}
                onClick={() => removeKey(key)}
              >
                {"\u00D7"}
              </JoyIconButton>
            </JoyBox>
          ))}
        </JoyStack>
      ) : null}
      {files.length > 0 ? (
        <JoyStack
          spacing={1}
          sx={{ mt: 1 }}
          data-testid="upload-field-tracker"
        >
          {files.map((file) => (
            <JoyBox
              key={file.id}
              data-testid="upload-field-tracker-item"
              data-status={file.status}
              sx={{
                display: "flex" as const,
                flexDirection: "column" as const,
                gap: 0.5,
                p: 1,
                borderRadius: "sm" as const,
                backgroundColor: ("background.level1" as const),
              }}
            >
              <JoyBox
                sx={{
                  display: "flex" as const,
                  alignItems: "center" as const,
                  gap: 1,
                }}
              >
                <JoyTypography level={"body-sm" as const} sx={{ flex: 1 }}>
                  {file.name}
                </JoyTypography>
                <JoyTypography
                  level={"body-xs" as const}
                  color={"neutral" as const}
                >
                  {formatBytes(file.size)}
                </JoyTypography>
                <JoyIconButton
                  size={"sm" as const}
                  variant={"plain" as const}
                  color={"neutral" as const}
                  aria-label={`Dismiss ${file.name}`}
                  onClick={() => removeTrackerEntry(file.id)}
                >
                  {"\u00D7"}
                </JoyIconButton>
              </JoyBox>
              {file.status === "uploading" ? (
                <JoyLinearProgress
                  data-testid="upload-field-progress"
                  determinate
                  value={file.progress}
                />
              ) : null}
              {file.status === "error" && file.error != null ? (
                <JoyTypography
                  role={"alert" as const}
                  data-testid="upload-field-file-error"
                  color={"danger" as const}
                  level={"body-xs" as const}
                >
                  {file.error}
                </JoyTypography>
              ) : null}
            </JoyBox>
          ))}
        </JoyStack>
      ) : null}
    </JoyBox>
  );
}
