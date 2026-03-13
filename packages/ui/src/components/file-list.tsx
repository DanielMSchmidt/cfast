import type { FileListProps, FileListFile } from "../types.js";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Displays a list of uploaded files with metadata, formatted sizes, and download links.
 *
 * Each file is rendered as a row showing the file name, size (human-readable), and
 * a download link (either via `onDownload` callback or the file's direct `url`).
 * Returns a "No files" placeholder when the list is empty.
 *
 * @param props - See {@link FileListProps}.
 *
 * @example
 * ```tsx
 * <FileList
 *   files={post.attachments}
 *   onDownload={(file) => window.open(storage.getSignedUrl(file.key))}
 * />
 * ```
 */
export function FileList({
  files,
  onDownload,
}: FileListProps) {
  if (files.length === 0) {
    return <div style={{ color: "#999" }}>No files</div>;
  }

  return (
    <ul
      style={{ listStyle: "none", padding: 0, margin: 0 }}
      data-testid="file-list"
    >
      {files.map((file) => (
        <FileListItem
          key={file.key}
          file={file}
          onDownload={onDownload}
        />
      ))}
    </ul>
  );
}

function FileListItem({
  file,
  onDownload,
}: {
  file: FileListFile;
  onDownload?: (file: FileListFile) => void;
}) {
  return (
    <li
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "8px 0",
        borderBottom: "1px solid #eee",
      }}
    >
      <span style={{ flex: 1 }}>{file.name}</span>
      {file.size != null ? (
        <span style={{ color: "#666", fontSize: "0.85em" }}>{formatBytes(file.size)}</span>
      ) : null}
      {onDownload ? (
        <button
          onClick={() => onDownload(file)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#1976d2",
            textDecoration: "underline",
          }}
        >
          Download
        </button>
      ) : file.url ? (
        <a
          href={file.url}
          download={file.name}
          style={{ color: "#1976d2", textDecoration: "underline" }}
        >
          Download
        </a>
      ) : null}
    </li>
  );
}
