import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Friend {
  id: number;
  status: "accepted";
  createdAt: string;
  friend: {
    id: number;
    username: string;
    bio?: string;
  };
}

interface FriendRequest {
  id: number;
  status: "pending";
  createdAt: string;
  sender: {
    id: number;
    username: string;
  };
}

interface FriendsResponse {
  friends: Friend[];
  pendingRequests: FriendRequest[];
}

async function fetchFriends(): Promise<FriendsResponse> {
  const response = await fetch('/api/friends', {
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Failed to fetch friends');
  }

  return response.json();
}

async function sendFriendRequest(username: string): Promise<void> {
  const response = await fetch(`/api/friends/request/${username}`, {
    method: 'POST',
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }
}

async function handleFriendRequest(requestId: number, action: 'accept' | 'reject'): Promise<void> {
  const response = await fetch(`/api/friends/request/${requestId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ action }),
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Failed to handle friend request');
  }
}

async function removeFriend(friendId: number): Promise<void> {
  const response = await fetch(`/api/friends/${friendId}`, {
    method: 'DELETE',
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Failed to remove friend');
  }
}

export function useFriends() {
  const queryClient = useQueryClient();

  const { data, error, isLoading } = useQuery<FriendsResponse>({
    queryKey: ['friends'],
    queryFn: fetchFriends
  });

  const sendRequestMutation = useMutation({
    mutationFn: sendFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    }
  });

  const handleRequestMutation = useMutation({
    mutationFn: ({ requestId, action }: { requestId: number; action: 'accept' | 'reject' }) =>
      handleFriendRequest(requestId, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    }
  });

  const removeFriendMutation = useMutation({
    mutationFn: removeFriend,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    }
  });

  return {
    friends: data?.friends ?? [],
    pendingRequests: data?.pendingRequests ?? [],
    isLoading,
    error,
    sendRequest: sendRequestMutation.mutateAsync,
    acceptRequest: (requestId: number) => handleRequestMutation.mutateAsync({ requestId, action: 'accept' }),
    rejectRequest: (requestId: number) => handleRequestMutation.mutateAsync({ requestId, action: 'reject' }),
    removeFriend: removeFriendMutation.mutateAsync,
    isMutating: sendRequestMutation.isPending || handleRequestMutation.isPending || removeFriendMutation.isPending
  };
}
