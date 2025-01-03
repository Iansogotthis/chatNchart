import { Forum } from "@/components/Forum";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
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

export default function ForumPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useUser();

  const { data: posts, isLoading, error } = useQuery<ForumPost[]>({
    queryKey: ["/api/forum/posts"],
    queryFn: async () => {
      const response = await fetch("/api/forum/posts");
      if (!response.ok) throw new Error("Failed to fetch posts");
      return response.json();
    }
  });

  const createPostMutation = useMutation({
    mutationFn: async (post: { title: string; content: string }) => {
      const response = await fetch("/api/forum/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...post,
          author: user ? {
            id: user.id,
            username: user.username
          } : null,
          createdAt: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Failed to create post");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forum/posts"] });
      toast({
        title: "Success",
        description: "Post created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create post",
        variant: "destructive",
      });
    }
  });

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-red-500">Error loading posts: {error instanceof Error ? error.message : 'Unknown error'}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-8">Forum</h1>
      <Forum
        posts={posts || []}
        onCreatePost={createPostMutation.mutate}
        isLoading={isLoading || createPostMutation.isPending}
      />
    </div>
  );
}