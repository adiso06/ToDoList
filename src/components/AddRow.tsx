import { useRef, useState, type ClipboardEvent, type FormEvent, type MouseEvent } from 'react';
import { Plus, Repeat1 } from 'lucide-react';

interface Props {
  placeholder: string;
  onAdd: (texts: string[], oneOff: boolean) => void;
  autoFocus?: boolean;
  className?: string;
}

// Borderless "+ Add item" row. Pasting several lines adds one item per line.
export function AddRow({ placeholder, onAdd, autoFocus, className = '' }: Props) {
  const [text, setText] = useState('');
  const [oneOff, setOneOff] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const add = () => {
    if (!text.trim()) return;
    onAdd([text.trim()], oneOff);
    setText('');
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    add();
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const lines = e.clipboardData
      .getData('text')
      .split(/\r?\n/)
      .map((line) => line.replace(/^\s*(?:[-*•]|\[[ xX]?\])\s*/, '').trim())
      .filter(Boolean);
    if (lines.length > 1) {
      e.preventDefault();
      onAdd(lines, oneOff);
    }
  };

  // Tapping the row's own buttons shouldn't blur the input (which would add
  // the item before, say, "Just once" is toggled).
  const keepFocus = (e: MouseEvent) => e.preventDefault();

  return (
    <form ref={formRef} onSubmit={handleSubmit} className={`flex items-center gap-1 rounded-lg focus-within:bg-zinc-100/70 dark:focus-within:bg-zinc-800/50 ${className}`}>
      <button
        type="submit"
        tabIndex={-1}
        onMouseDown={keepFocus}
        aria-label="Add item"
        className="flex h-9 w-8 shrink-0 items-center justify-center rounded-md text-zinc-400 hover:text-blue-600 dark:text-zinc-500"
      >
        <Plus size={16} />
      </button>
      <input
        type="text"
        value={text}
        autoFocus={autoFocus}
        onChange={(e) => setText(e.target.value)}
        onPaste={handlePaste}
        onKeyDown={(e) => e.key === 'Escape' && e.currentTarget.blur()}
        // The iOS keyboard's "Done" button only blurs the field, so save what
        // was typed rather than silently leaving it behind.
        onBlur={(e) => {
          if (!formRef.current?.contains(e.relatedTarget as Node | null)) add();
        }}
        placeholder={placeholder}
        aria-label={placeholder}
        enterKeyHint="enter"
        className="min-w-0 flex-1 bg-transparent py-1.5 text-base focus-visible:ring-0 text-zinc-900 outline-none placeholder:text-zinc-400 sm:text-[15px] dark:text-zinc-100 dark:placeholder:text-zinc-500"
      />
      {text.trim() && (
        <>
          <button
            type="button"
            aria-pressed={oneOff}
            onMouseDown={keepFocus}
            title="Just this time: removed when you reset the list"
            onClick={() => setOneOff((o) => !o)}
            className={`flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${
              oneOff
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200'
                : 'text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
            }`}
          >
            <Repeat1 size={14} />
            Just once
          </button>
          <button
            type="submit"
            onMouseDown={keepFocus}
            className="mr-1 shrink-0 rounded-md bg-blue-600 px-2.5 py-1 text-sm font-medium text-white hover:bg-blue-700"
          >
            Add
          </button>
        </>
      )}
    </form>
  );
}
