import type { Chart } from "@db/schema";

export interface Friend {
  id: number;
  username: string;
  status: "accepted";
}

export interface Collaborator {
  id: number;
  username: string;
  accessLevel: "unlimited" | "readable" | "editable" | "prompted";
}

export interface Project {
  id: number;
  name: string;
  chart: Chart;
  createdAt: string;
  creator: {
    id: number;
    username: string;
  };
  collaborators: Collaborator[];
  status: "active" | "paused";
  lastSavedTimestamp?: string;
}