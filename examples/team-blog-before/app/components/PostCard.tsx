import { Link } from "react-router";
import Card from "@mui/joy/Card";
import CardContent from "@mui/joy/CardContent";
import CardOverflow from "@mui/joy/CardOverflow";
import AspectRatio from "@mui/joy/AspectRatio";
import Typography from "@mui/joy/Typography";
import Stack from "@mui/joy/Stack";
import Avatar from "@mui/joy/Avatar";

interface PostCardProps {
  post: {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    coverImageKey: string | null;
    publishedAt: Date | null;
    author: {
      name: string;
      avatarUrl: string | null;
    };
  };
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
  });
}

export function PostCard({ post }: PostCardProps) {
  return (
    <Card
      component={Link}
      to={`/posts/${post.slug}`}
      variant="outlined"
      sx={{
        textDecoration: "none",
        color: "inherit",
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "md",
        },
      }}
    >
      {post.coverImageKey && (
        <CardOverflow>
          <AspectRatio ratio="16/9">
            <img
              src={`/api/file/${post.coverImageKey}`}
              alt={post.title}
              loading="lazy"
            />
          </AspectRatio>
        </CardOverflow>
      )}
      <CardContent>
        <Typography level="title-lg">{post.title}</Typography>
        {post.excerpt && (
          <Typography level="body-sm" sx={{ mt: 0.5 }}>
            {post.excerpt}
          </Typography>
        )}
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ mt: 1.5 }}
        >
          <Avatar
            src={post.author.avatarUrl ?? undefined}
            size="sm"
            sx={{ "--Avatar-size": "24px" }}
          >
            {getInitials(post.author.name)}
          </Avatar>
          <Typography level="body-xs">{post.author.name}</Typography>
          {post.publishedAt && (
            <>
              <Typography level="body-xs" sx={{ color: "neutral.400" }}>
                ·
              </Typography>
              <Typography level="body-xs">
                {formatDate(post.publishedAt)}
              </Typography>
            </>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
