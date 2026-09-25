import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableTodoItem, TodoItemRow } from './TodoItem';
import { AddRow } from './AddRow';
import { useTodoStore } from '../store/todoStore';
import type { TodoItem } from '../types';

interface Props {
  listId: string;
  container: string;
  items: TodoItem[];
  showDone: boolean;
  placeholder: string;
  autoFocus?: boolean;
}

// One container's items: the ones still to do (draggable), the add row, and
// optionally the checked/skipped ones, which sink below out of the way.
export function ItemGroup({ listId, container, items, showDone, placeholder, autoFocus }: Props) {
  const store = useTodoStore.getState();
  const active = items.filter((item) => !item.completed && !item.skipped);
  const done = items.filter((item) => item.completed || item.skipped);

  const handlers = (item: TodoItem) => ({
    onToggle: () => store.toggleItem(listId, item.id),
    onEdit: (text: string) => store.editItem(listId, item.id, text),
    onDelete: () => store.deleteItem(listId, item.id),
    onToggleOneOff: () => store.toggleOneOff(listId, item.id),
    onToggleSkipped: () => store.toggleSkipped(listId, item.id)
  });

  return (
    <>
      <SortableContext items={active.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        <ul>
          {active.map((item) => (
            <SortableTodoItem key={item.id} item={item} container={container} {...handlers(item)} />
          ))}
        </ul>
      </SortableContext>
      <AddRow
        className="pl-5"
        placeholder={placeholder}
        autoFocus={autoFocus}
        onAdd={(texts, oneOff) => store.addItems(listId, texts, container, oneOff)}
      />
      {showDone && done.length > 0 && (
        <ul>
          {done.map((item) => (
            <TodoItemRow key={item.id} item={item} {...handlers(item)} />
          ))}
        </ul>
      )}
    </>
  );
}
