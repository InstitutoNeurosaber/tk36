export interface ClickUpConfig {
  id: string;
  apiKey: string;
  workspaceId: string;
  spaceId: string;
  listId: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  active: boolean;
}

export interface ClickUpUser {
  id: number;
  username: string;
  email: string;
  profilePicture?: string;
}

export interface ClickUpSpace {
  id: string;
  name: string;
}

export interface ClickUpList {
  id: string;
  name: string;
}

export interface ClickUpTask {
  id: string;
  name: string;
  description: string;
  status: string;
  priority: number;
  assignees: ClickUpUser[];
  dueDate: string;
  url: string;
}