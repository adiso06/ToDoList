export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  category?: string;
  sublist?: string;
}

export interface TodoList {
  id: string;
  name: string;
  items: TodoItem[];
  sublists?: { [key: string]: TodoItem[] };
}