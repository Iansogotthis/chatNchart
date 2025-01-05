declare module 'lucide-react';
declare module 'date-fns';

export interface Friend {
  id: number;
  status: "accepted" | "pending";
  createdAt: string;
  friend?: {
    id: number;
    username: string;
    bio?: string | null;
  };
}

export interface FriendRequest {
  id: number;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
  sender: {
    id: number;
    username: string;
    bio?: string | null;
  } | null;
}