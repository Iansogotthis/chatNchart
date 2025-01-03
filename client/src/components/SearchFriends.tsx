import { useState } from "react";
import { Link } from "wouter";
import { useUser } from "@/hooks/use-user";
import { useFriends } from "@/hooks/use-friends";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "./ui/command";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { UserPlus2, Search, UserCheck2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SearchResult {
  id: number;
  username: string;
  isFriend?: boolean;
  hasRequestPending?: boolean;
}

export function SearchFriends() {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const { user } = useUser();
  const { friends, pendingRequests, sendRequest, isMutating } = useFriends();
  const { toast } = useToast();

  const handleSearch = async (value: string) => {
    setSearchTerm(value);
    if (value.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(value)}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to search users');
      }

      const users: SearchResult[] = await response.json();

      // Transform results with friend status
      const searchResults = users.map(user => ({
        id: user.id,
        username: user.username,
        isFriend: friends.some(f => f.friend?.id === user.id),
        hasRequestPending: pendingRequests.some(r => r.sender?.id === user.id) || 
                         friends.some(f => f.friend?.id === user.id && f.status === "pending")
      }));

      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Error",
        description: "Failed to search users. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendRequest = async (userId: number, username: string) => {
    try {
      await sendRequest(username);
      toast({
        title: "Success",
        description: "Friend request sent successfully!"
      });
      // Update the results to show pending status
      setResults(prev =>
        prev.map(r =>
          r.id === userId
            ? { ...r, hasRequestPending: true }
            : r
        )
      );
      // Close the popover after successful request
      setOpen(false);
    } catch (error) {
      console.error('Friend request error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send friend request. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon">
          <Search className="h-5 w-5" />
          <span className="sr-only">Search friends</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="end">
        <Command>
          <CommandInput
            placeholder="Search users..."
            value={searchTerm}
            onValueChange={handleSearch}
          />
          <CommandList>
            <CommandEmpty>No users found.</CommandEmpty>
            <CommandGroup>
              {isLoading ? (
                <CommandItem disabled>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </CommandItem>
              ) : (
                results.map((result) => (
                  <CommandItem
                    key={result.id}
                    className="flex items-center justify-between"
                  >
                    <Link href={`/profile/${result.username}`} className="hover:underline">
                      {result.username}
                    </Link>
                    {result.isFriend ? (
                      <UserCheck2 className="h-4 w-4 text-primary" />
                    ) : result.hasRequestPending ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled
                        className="text-muted-foreground"
                      >
                        <UserPlus2 className="h-4 w-4 mr-1" />
                        Pending
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSendRequest(result.id, result.username)}
                        disabled={isMutating}
                      >
                        <UserPlus2 className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    )}
                  </CommandItem>
                ))
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}