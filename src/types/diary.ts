export interface DiaryEntry {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  sharedWith: string[];
  tags: string[];
  isPublic: boolean;
}

export interface DiaryTag {
  id: string;
  name: string;
  color: string;
}