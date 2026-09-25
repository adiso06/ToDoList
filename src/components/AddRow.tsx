import { useState, type ClipboardEvent, type FormEvent } from 'react';
import { Plus } from 'lucide-react';

interface Props {
  placeholder: string;
  onAdd: (texts: string[]) => void;
  autoFocus?: boolean;
  className?: string;
}

// Borderless "+ Add item" row. Pasting several lines adds one item per line.
export function AddRow({ placeholder, onAdd, autoFocus, className = '' }: Props) {
  const [text, setText] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onAdd([text.trim()]);
      setText('');
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const lines = e.clipboardData
      .getData('text')
      .split(/\r?\n/)
      .map((line) => line.replace(/^\s*(?:[-*•]|\[[ xX]?\])\s*/, '').trim())
      .filter(Boolean);
    if (lines.length > 1) {
      e.preventDefault();
      onAdd(lines);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`flex items-center gap-1 rounded-lg ${className}`}>
      <span className="flex h-9 w-8 shrink-0 items-center justify-center text-zinc-400 dark:text-zinc-500">
        <Plus size={16} />
      </span>
      <input
        type="text"
        value={text}
        autoFocus={autoFocus}
        onChange={(e) => setText(e.target.value)}
        onPaste={handlePaste}
        onKeyDown={(e) => e.key === 'Escape' && e.currentTarget.blur()}
        placeholder={placeholder}
        aria-label={placeholder}
        enterKeyHint="enter"
        className="min-w-0 flex-1 bg-transparent py-1.5 text-base text-zinc-900 outline-none placeholder:text-zinc-400 sm:text-[15px] dark:text-zinc-100 dark:placeholder:text-zinc-500"
      />
      {text.trim() && (
        <button
          type="submit"
          className="mr-1 rounded-md bg-blue-600 px-2.5 py-1 text-sm font-medium text-white hover:bg-blue-700"
        >
          Add
        </button>
      )}
    </form>
  );
}
