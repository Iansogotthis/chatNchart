import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { useState } from "react";

interface ForumPost {
  id: number;
  title: string;
  content: string;
  author: string;
  createdAt: string;
}

interface ForumProps {
  posts: ForumPost[];
  onCreatePost?: (post: Omit<ForumPost, "id" | "createdAt">) => void;
}

export function Forum({ posts, onCreatePost }: ForumProps) {
  const [newPost, setNewPost] = useState({ title: "", content: "" });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Post</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (onCreatePost) {
                onCreatePost({
                  title: newPost.title,
                  content: newPost.content,
                  author: "currentUser", // This should come from auth context
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
                Posted by {post.author} on {post.createdAt}
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
