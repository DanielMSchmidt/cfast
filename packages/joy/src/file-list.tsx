import { type ReactElement } from "react";
import JoyList from "@mui/joy/List";
import JoyListItem from "@mui/joy/ListItem";
import JoyListItemContent from "@mui/joy/ListItemContent";
import JoyTypography from "@mui/joy/Typography";
import JoyButton from "@mui/joy/Button";
import type { FileListProps } from "@cfast/ui";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Joy UI styled FileList.
 */
export function FileList({
  files,
  onDownload,
}: FileListProps): ReactElement {
  if (files.length === 0) {
    return (
      <JoyTypography level={"body-sm" as const} color={"neutral" as const}>
        No files
      </JoyTypography>
    );
  }

  return (
    <JoyList size={"sm" as const}>
      {files.map((file) => (
        <JoyListItem key={file.key}>
          <JoyListItemContent>
            <JoyTypography level={"body-sm" as const}>{file.name}</JoyTypography>
            {file.size != null ? (
              <JoyTypography level={"body-xs" as const} color={"neutral" as const}>
                {formatBytes(file.size)}
              </JoyTypography>
            ) : null}
          </JoyListItemContent>
          {(onDownload || file.url) ? (
            <JoyButton
              size={"sm" as const}
              variant={"plain" as const}
              onClick={onDownload
                ? () => onDownload(file)
                : undefined}
            >
              {"↓"}
            </JoyButton>
          ) : null}
        </JoyListItem>
      ))}
    </JoyList>
  );
}
