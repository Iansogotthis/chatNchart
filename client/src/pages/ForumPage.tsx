import { Forum } from "@/components/Forum";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface ForumPost {
  id: number;
  title: string;
  content: string;
  author: {
    id: number;
    username: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function ForumPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: posts } = useQuery<ForumPost[]>({
    queryKey: ["/api/forum/posts"],
    queryFn: async () => {
      const response = await fetch("/api/forum/posts");
      if (!response.ok) throw new Error("Failed to fetch posts");
      return response.json();
    }
  });

  const createPostMutation = useMutation({
    mutationFn: async (post: Partial<ForumPost>) => {
      const response = await fetch("/api/forum/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(post),
      });
      if (!response.ok) throw new Error("Failed to create post");
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

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-8">Forum</h1>
      <Forum
        posts={posts || []}
        onCreatePost={(post) => createPostMutation.mutate(post)}
      />
    </div>
  );
}