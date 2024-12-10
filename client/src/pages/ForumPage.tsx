import { Forum } from "@/components/Forum";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function ForumPage() {
  const { toast } = useToast();

  const { data: posts } = useQuery({
    queryKey: ["/api/forum/posts"],
  });

  const createPostMutation = useMutation({
    mutationFn: async (post: any) => {
      const response = await fetch("/api/forum/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(post),
      });
      if (!response.ok) throw new Error("Failed to create post");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Post created successfully",
      });
    },
  });

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">Forum</h1>
      <Forum
        posts={posts || []}
        onCreatePost={(post) => createPostMutation.mutate(post)}
      />
    </div>
  );
}
