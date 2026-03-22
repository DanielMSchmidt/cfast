import { Form } from "react-router";
import Card from "@mui/joy/Card";
import Typography from "@mui/joy/Typography";
import Button from "@mui/joy/Button";
import Stack from "@mui/joy/Stack";
import { AvatarWithInitials } from "@cfast/joy";
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

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatDate(date: Date): string {
  const d = new Date(date);
  const h = d.getUTCHours();
  const m = d.getUTCMinutes().toString().padStart(2, "0");
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${MONTHS_SHORT[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}, ${h12}:${m} ${period}`;
}

export function CommentItem({ comment, user }: CommentItemProps) {
  const canDelete =
    user &&
    (user.id === comment.author.id || hasAnyRole(user, ["admin", "editor"]));

  return (
    <Card variant="soft" sx={{ p: 2 }}>
      <Stack direction="row" spacing={2} alignItems="flex-start">
        <AvatarWithInitials
          src={comment.author.avatarUrl}
          name={comment.author.name}
          size="sm"
        />
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
