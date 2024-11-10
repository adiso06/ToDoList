export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  sublist?: string;
}

export interface TodoList {
  id: string;
  name: string;
  items: TodoItem[];
  sublists: Record<string, TodoItem[]> | null;
}