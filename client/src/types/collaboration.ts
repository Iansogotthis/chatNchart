import type { Chart } from "@db/schema";

export interface Friend {
  id: number;
  status: "accepted";
  createdAt: string;
  friend: {
    id: number;
    username: string;
    bio?: string | null;
  } | null;
}

export interface FriendRequest {
  id: number;
  status: "pending";
  createdAt: string;
  sender: {
    id: number;
    username: string;
  } | null;
}

export type CollaboratorAccessLevel = "owner" | "admin" | "editor" | "viewer";

export interface Collaborator {
  id: number;
  username: string;
  accessLevel: CollaboratorAccessLevel;
}

export interface Project {
  id: number;
  name: string;
  ownerId: number;
  chart: Chart | null;
  createdAt: string;
  creator: {
    id: number;
    username: string;
  };
  collaborators: Collaborator[];
  status: "active" | "paused";
  lastSavedTimestamp?: string;
}