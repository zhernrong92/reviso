import { useState, useCallback, useRef, useEffect } from 'react';

const DEBOUNCE_MS = 250;

interface DebouncedColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  style?: React.CSSProperties;
}

export const DebouncedColorPicker: React.FC<DebouncedColorPickerProps> = ({
  value,
  onChange,
  style,
}) => {
  const [local, setLocal] = useState(value);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setLocal(color);

    // Debounce: commit after user stops dragging
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onChangeRef.current(color);
    }, DEBOUNCE_MS);
  }, []);

  const handleBlur = useCallback(() => {
    // Commit immediately on blur (fallback)
    if (timerRef.current) clearTimeout(timerRef.current);
    onChangeRef.current(local);
  }, [local]);

  return (
    <input
      type="color"
      value={local}
      onChange={handleChange}
      onBlur={handleBlur}
      style={{
        width: 20,
        height: 20,
        padding: 0,
        border: 'none',
        background: 'none',
        cursor: 'pointer',
        ...style,
      }}
    />
  );
};
