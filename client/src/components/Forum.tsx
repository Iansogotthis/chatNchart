import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { useState } from "react";
import { useUser } from "@/hooks/use-user";

interface ForumPost {
  id: number;
  title: string;
  content: string;
  author?: {
    id: number;
    username: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ForumProps {
  posts: ForumPost[];
  onCreatePost?: (post: Partial<ForumPost>) => void;
}

export function Forum({ posts, onCreatePost }: ForumProps) {
  const [newPost, setNewPost] = useState({ title: "", content: "" });
  const { user } = useUser();

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="space-y-6 w-full max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create New Post</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (onCreatePost && user) {
                onCreatePost({
                  title: newPost.title,
                  content: newPost.content,
                  author: {
                    id: user.id,
                    username: user.username
                  }
                });
                setNewPost({ title: "", content: "" });
              }
            }}
            className="space-y-4"
          >
            <Input
              placeholder="Post Title"
              value={newPost.title}
              onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
            />
            <Textarea
              placeholder="Post Content"
              value={newPost.content}
              onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
            />
            <Button type="submit">Create Post</Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {posts.map((post) => (
          <Card key={post.id}>
            <CardHeader>
              <CardTitle>{post.title}</CardTitle>
              <div className="text-sm text-muted-foreground">
                Posted by {post.author?.username || 'Anonymous'} on {formatDate(post.createdAt)}
              </div>
            </CardHeader>
            <CardContent>
              <p>{post.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}