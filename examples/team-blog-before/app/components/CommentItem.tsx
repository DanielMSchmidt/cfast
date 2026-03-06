import { Form } from "react-router";
import Card from "@mui/joy/Card";
import Typography from "@mui/joy/Typography";
import Avatar from "@mui/joy/Avatar";
import Button from "@mui/joy/Button";
import Stack from "@mui/joy/Stack";
import type { AuthUser } from "~/permissions";
import { hasAnyRole } from "~/permissions";

interface CommentItemProps {
  comment: {
    id: string;
    content: string;
    createdAt: Date;
    author: {
      id: string;
      name: string;
      avatarUrl: string | null;
    };
  };
  user: AuthUser | null;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function CommentItem({ comment, user }: CommentItemProps) {
  const canDelete =
    user &&
    (user.id === comment.author.id || hasAnyRole(user, ["admin", "editor"]));

  return (
    <Card variant="soft" sx={{ p: 2 }}>
      <Stack direction="row" spacing={2} alignItems="flex-start">
        <Avatar
          src={comment.author.avatarUrl ?? undefined}
          size="sm"
        >
          {getInitials(comment.author.name)}
        </Avatar>
        <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography level="title-sm">
              {comment.author.name}
            </Typography>
            <Typography level="body-xs" sx={{ color: "neutral.500" }}>
              {formatDate(comment.createdAt)}
            </Typography>
          </Stack>
          <Typography level="body-sm">{comment.content}</Typography>
        </Stack>
        {canDelete && (
          <Form method="post">
            <input type="hidden" name="_action" value="deleteComment" />
            <input type="hidden" name="commentId" value={comment.id} />
            <Button
              type="submit"
              variant="plain"
              color="danger"
              size="sm"
            >
              Delete
            </Button>
          </Form>
        )}
      </Stack>
    </Card>
  );
}
