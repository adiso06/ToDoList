import { useRef, useState } from 'react';

interface Props {
  initial?: string;
  placeholder?: string;
  ariaLabel: string;
  className?: string;
  // Receives the trimmed value. Return false to keep editing (e.g. a duplicate name).
  onCommit: (value: string) => boolean | void;
  onCancel: () => void;
}

// Text input that saves on Enter or blur and cancels on Escape.
export function InlineEdit({ initial = '', placeholder, ariaLabel, className = '', onCommit, onCancel }: Props) {
  const [value, setValue] = useState(initial);
  const done = useRef(false);

  const finish = (commit: boolean) => {
    if (done.current) return;
    if (!commit) {
      done.current = true;
      onCancel();
      return;
    }
    if (onCommit(value.trim()) !== false) done.current = true;
  };

  return (
    <input
      autoFocus
      type="text"
      value={value}
      placeholder={placeholder}
      aria-label={ariaLabel}
      enterKeyHint="done"
      onFocus={(e) => e.currentTarget.select()}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        finish(true);
        // A rejected value on blur would leave a dangling input; bail out instead.
        if (!done.current) {
          done.current = true;
          onCancel();
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          finish(true);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          finish(false);
        }
      }}
      className={`min-w-0 rounded-md bg-white px-2 py-1 text-base outline-none ring-2 ring-blue-500 sm:text-[15px] dark:bg-zinc-800 ${className}`}
    />
  );
}
