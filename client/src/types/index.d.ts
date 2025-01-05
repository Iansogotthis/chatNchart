declare module 'lucide-react';
declare module 'date-fns';

export interface Friend {
  id: number;
  username: string;
  bio?: string | null;
  status: "accepted" | "pending";
  createdAt: string;
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