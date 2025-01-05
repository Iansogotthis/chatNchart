import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useUser } from "@/hooks/use-user";
import { useFriends } from "@/hooks/use-friends";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "./ui/command";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { UserPlus2, Search, UserCheck2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SearchResult {
  id: number;
  username: string;
  bio?: string | null;
}

interface FriendStatus {
  isFriend?: boolean;
  hasRequestPending?: boolean;
}

interface SearchFriendsProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchFriends({ isOpen, onOpenChange }: SearchFriendsProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<(SearchResult & FriendStatus)[]>([]);
  const { user } = useUser();
  const { friends, pendingRequests, sendRequest, isMutating } = useFriends();
  const { toast } = useToast();

  // Reset search when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
      setResults([]);
    }
  }, [isOpen]);

  const handleSearch = async (value: string) => {
    setSearchTerm(value);
    if (value.length < 1) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      console.log('Searching for:', value);
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(value)}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to search users');
      }

      const users: SearchResult[] = await response.json();
      console.log('Search results:', users);

      // Transform results with friend status
      const searchResults = users.map(user => ({
        ...user,
        isFriend: friends.some(f => f.friend && f.friend.id === user.id),
        hasRequestPending: pendingRequests.some(r => r.sender && (r.sender.id === user.id || r.sender.username === user.username))
      }));

      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to search users",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendRequest = async (username: string) => {
    try {
      await sendRequest(username);
      toast({
        title: "Success",
        description: "Friend request sent successfully!"
      });

      // Update the results to show pending status
      setResults(prev =>
        prev.map(r =>
          r.username === username
            ? { ...r, hasRequestPending: true }
            : r
        )
      );
    } catch (error) {
      console.error('Friend request error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send friend request",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Search Friends</DialogTitle>
        </DialogHeader>
        <Command>
          <CommandInput
            placeholder="Search users by name or bio..."
            value={searchTerm}
            onValueChange={handleSearch}
          />
          <CommandList>
            <CommandEmpty>No users found. Try a different search term.</CommandEmpty>
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
                    className="flex items-center justify-between p-2"
                    value={result.username}
                  >
                    <div className="flex flex-col">
                      <Link href={`/profile/${result.username}`} className="hover:underline font-medium">
                        {result.username}
                      </Link>
                      {result.bio && (
                        <span className="text-sm text-muted-foreground line-clamp-1">
                          {result.bio}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
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
                          onClick={() => handleSendRequest(result.username)}
                          disabled={isMutating}
                        >
                          <UserPlus2 className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      )}
                    </div>
                  </CommandItem>
                ))
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}