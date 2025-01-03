import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { useState } from "react";
import { useUser } from "@/hooks/use-user";
import { Loader2 } from "lucide-react";

interface ForumPost {
  id: number;
  title: string;
  content: string;
  author: {
    id: number;
    username: string;
  } | null;
  createdAt: string;
}

interface ForumProps {
  posts: ForumPost[];
  onCreatePost: (post: { title: string; content: string }) => void;
  isLoading?: boolean;
}

export function Forum({ posts, onCreatePost, isLoading = false }: ForumProps) {
  const [newPost, setNewPost] = useState({ title: "", content: "" });
  const { user } = useUser();

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreatePost({
      title: newPost.title,
      content: newPost.content,
    });
    setNewPost({ title: "", content: "" });
  };

  return (
    <div className="space-y-6 w-full max-w-4xl mx-auto">
      {user && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Post</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                placeholder="Post Title"
                value={newPost.title}
                onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                required
                disabled={isLoading}
              />
              <Textarea
                placeholder="Post Content"
                value={newPost.content}
                onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                required
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Post"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No posts yet. Be the first to create one!
          </div>
        ) : (
          posts.map((post) => (
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
          ))
        )}
      </div>
    </div>
  );
}