export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  // Removed on reset once checked or skipped, instead of being unchecked.
  oneOff?: boolean;
  // Not needed this time around; hidden until the list is reset.
  skipped?: boolean;
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
}
