export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

export type Sublists = Record<string, TodoItem[]>;

export interface ListContents {
  items: TodoItem[];
  sublists: Sublists | null;
}

export interface TodoList extends ListContents {
  id: string;
  name: string;
  order?: number;
  template?: ListContents | null;
}
