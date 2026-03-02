import { useState, useRef, useEffect, useCallback } from 'react';
import { useTheme } from '@mui/material/styles';
import type { TextRegion } from '../../types/document';
import { useDocumentStore } from '../../stores/documentStore';
import { useUiStore } from '../../stores/uiStore';
import { DebouncedColorPicker } from '../common/DebouncedColorPicker';

interface InlineEditorProps {
  region: TextRegion;
  pageId: string;
  imageWidth: number;
  imageHeight: number;
  onAdvance: (direction: 'next' | 'prev') => void;
}

type Corner = 'tl' | 'tr' | 'bl' | 'br';
type DragKind = Corner | 'move';

const HANDLE_SIZE = 12;
const MIN_WIDTH = 20;
const MIN_HEIGHT = 10;

/** Returns relative luminance (0 = black, 1 = white) from a hex color string. */
function luminance(hex: string): number {
  const raw = hex.replace('#', '');
  const r = parseInt(raw.substring(0, 2), 16) / 255;
  const g = parseInt(raw.substring(2, 4), 16) / 255;
  const b = parseInt(raw.substring(4, 6), 16) / 255;
  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

export const InlineEditor: React.FC<InlineEditorProps> = ({
  region,
  pageId,
  imageWidth,
  imageHeight,
  onAdvance,
}) => {
  const theme = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(region.currentText);
  const [bounds, setBounds] = useState({
    x1: region.x1,
    y1: region.y1,
    x2: region.x2,
    y2: region.y2,
  });
  const updateRegionText = useDocumentStore((s) => s.updateRegionText);
  const updateRegionBounds = useDocumentStore((s) => s.updateRegionBounds);
  const updateRegionStyle = useDocumentStore((s) => s.updateRegionStyle);
  const deleteRegion = useDocumentStore((s) => s.deleteRegion);
  const selectRegion = useUiStore((s) => s.selectRegion);
  const savedRef = useRef(false);
  const draggingRef = useRef<DragKind | null>(null);

  useEffect(() => {
    const el = inputRef.current;
    if (el) {
      el.focus();
      el.select();
    }
  }, []);

  useEffect(() => {
    setBounds({ x1: region.x1, y1: region.y1, x2: region.x2, y2: region.y2 });
  }, [region.x1, region.y1, region.x2, region.y2]);

  const toImageCoords = useCallback(
    (clientX: number, clientY: number) => {
      const container = wrapperRef.current?.parentElement;
      if (!container) return { x: 0, y: 0 };
      const rect = container.getBoundingClientRect();
      const scale = rect.width / imageWidth;
      return {
        x: Math.max(0, Math.min(imageWidth, (clientX - rect.left) / scale)),
        y: Math.max(0, Math.min(imageHeight, (clientY - rect.top) / scale)),
      };
    },
    [imageWidth, imageHeight],
  );

  const save = useCallback(() => {
    if (savedRef.current) return;
    savedRef.current = true;
    updateRegionText(pageId, region.id, value);
  }, [updateRegionText, pageId, region.id, value]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        save();
        onAdvance('next');
      } else if (e.key === 'Escape') {
        e.preventDefault();
        savedRef.current = true;
        selectRegion(null);
      } else if (e.key === 'Tab') {
        e.preventDefault();
        save();
        onAdvance(e.shiftKey ? 'prev' : 'next');
      }
    },
    [save, onAdvance, selectRegion],
  );

  const handleBlur = useCallback(() => {
    if (!draggingRef.current) save();
  }, [save]);

  const handleConfirm = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      save();
      selectRegion(null);
    },
    [save, selectRegion],
  );

  const handleCancel = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      savedRef.current = true;
      selectRegion(null);
    },
    [selectRegion],
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      savedRef.current = true;
      deleteRegion(pageId, region.id);
      selectRegion(null);
    },
    [deleteRegion, pageId, region.id, selectRegion],
  );

  const commitBounds = useCallback(() => {
    setBounds((current) => {
      updateRegionBounds(
        pageId,
        region.id,
        Math.round(current.x1),
        Math.round(current.y1),
        Math.round(current.x2),
        Math.round(current.y2),
      );
      return current;
    });
  }, [updateRegionBounds, pageId, region.id]);

  const handleResizeMouseDown = useCallback(
    (corner: Corner) => (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      draggingRef.current = corner;

      const handleMouseMove = (me: MouseEvent) => {
        const { x, y } = toImageCoords(me.clientX, me.clientY);
        setBounds((prev) => {
          const next = { ...prev };
          if (corner === 'tl') {
            next.x1 = x;
            next.y1 = y;
          } else if (corner === 'tr') {
            next.x2 = x;
            next.y1 = y;
          } else if (corner === 'bl') {
            next.x1 = x;
            next.y2 = y;
          } else {
            next.x2 = x;
            next.y2 = y;
          }
          if (next.x2 - next.x1 < MIN_WIDTH) {
            if (corner === 'tl' || corner === 'bl') next.x1 = next.x2 - MIN_WIDTH;
            else next.x2 = next.x1 + MIN_WIDTH;
          }
          if (next.y2 - next.y1 < MIN_HEIGHT) {
            if (corner === 'tl' || corner === 'tr') next.y1 = next.y2 - MIN_HEIGHT;
            else next.y2 = next.y1 + MIN_HEIGHT;
          }
          return next;
        });
      };

      const handleMouseUp = () => {
        draggingRef.current = null;
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        commitBounds();
        inputRef.current?.focus();
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [toImageCoords, commitBounds],
  );

  const handleMoveMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      draggingRef.current = 'move';
      const startImg = toImageCoords(e.clientX, e.clientY);

      const handleMouseMove = (me: MouseEvent) => {
        const current = toImageCoords(me.clientX, me.clientY);
        const dx = current.x - startImg.x;
        const dy = current.y - startImg.y;
        setBounds((prev) => {
          const w = prev.x2 - prev.x1;
          const h = prev.y2 - prev.y1;
          let newX1 = region.x1 + dx;
          let newY1 = region.y1 + dy;
          // Clamp to image bounds
          newX1 = Math.max(0, Math.min(imageWidth - w, newX1));
          newY1 = Math.max(0, Math.min(imageHeight - h, newY1));
          return { x1: newX1, y1: newY1, x2: newX1 + w, y2: newY1 + h };
        });
      };

      const handleMouseUp = () => {
        draggingRef.current = null;
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        commitBounds();
        inputRef.current?.focus();
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [toImageCoords, commitBounds, region.x1, region.y1, imageWidth, imageHeight],
  );

  const borderVisible = region.borderVisible !== false;

  const handleFontColorChange = useCallback(
    (color: string) => {
      updateRegionStyle(pageId, region.id, { fontColor: color });
    },
    [updateRegionStyle, pageId, region.id],
  );

  const handleBorderColorChange = useCallback(
    (color: string) => {
      updateRegionStyle(pageId, region.id, { borderColor: color });
    },
    [updateRegionStyle, pageId, region.id],
  );

  const handleBgColorChange = useCallback(
    (color: string) => {
      updateRegionStyle(pageId, region.id, { backgroundColor: color });
    },
    [updateRegionStyle, pageId, region.id],
  );

  const handleToggleBorder = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      updateRegionStyle(pageId, region.id, { borderVisible: !borderVisible });
    },
    [updateRegionStyle, pageId, region.id, borderVisible],
  );

  const handleToggleBg = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      const hasBg = region.backgroundColor && region.backgroundColor !== 'transparent';
      updateRegionStyle(pageId, region.id, {
        backgroundColor: hasBg ? 'transparent' : '#333333',
      });
    },
    [updateRegionStyle, pageId, region.id, region.backgroundColor],
  );

  const handleFontFamilyChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      updateRegionStyle(pageId, region.id, { fontFamily: e.target.value });
    },
    [updateRegionStyle, pageId, region.id],
  );

  const handleTextPositionChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      updateRegionStyle(pageId, region.id, { textPosition: e.target.value as 'inside' | 'top' | 'bottom' | 'left' | 'right' });
    },
    [updateRegionStyle, pageId, region.id],
  );

  const handleToggleBold = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      updateRegionStyle(pageId, region.id, {
        fontWeight: region.fontWeight === 'bold' ? 'normal' : 'bold',
      });
    },
    [updateRegionStyle, pageId, region.id, region.fontWeight],
  );

  const handleToggleItalic = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      updateRegionStyle(pageId, region.id, {
        fontStyle: region.fontStyle === 'italic' ? 'normal' : 'italic',
      });
    },
    [updateRegionStyle, pageId, region.id, region.fontStyle],
  );

  const handleToggleStrikethrough = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      updateRegionStyle(pageId, region.id, {
        textDecoration: region.textDecoration === 'line-through' ? 'none' : 'line-through',
      });
    },
    [updateRegionStyle, pageId, region.id, region.textDecoration],
  );

  const w = bounds.x2 - bounds.x1;
  const h = bounds.y2 - bounds.y1;
  const fontSize = h * 0.65;
  const half = HANDLE_SIZE / 2;
  const TOOLBAR_HEIGHT = 28;

  const handleStyle = (cursor: string): React.CSSProperties => ({
    position: 'absolute',
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    background: theme.palette.primary.main,
    border: `1px solid ${theme.palette.background.paper}`,
    borderRadius: 2,
    cursor,
    zIndex: 12,
  });

  return (
    <div
      ref={wrapperRef}
      className="inline-editor"
      style={{
        position: 'absolute',
        left: bounds.x1,
        top: bounds.y1,
        width: w,
        height: h,
        zIndex: 10,
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => {
          savedRef.current = false;
          setValue(e.target.value);
        }}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          boxSizing: 'border-box',
          padding: '0 4px',
          margin: 0,
          border: `2px solid ${theme.palette.primary.main}`,
          borderRadius: 2,
          background: luminance(region.fontColor ?? theme.palette.text.primary) < 0.4
            ? '#ffffffee'
            : `${theme.palette.background.paper}ee`,
          color: region.fontColor ?? theme.palette.text.primary,
          fontFamily: region.fontFamily ?? (theme.typography.fontFamily as string),
          fontWeight: region.fontWeight ?? 'normal',
          fontStyle: region.fontStyle ?? 'normal',
          textDecoration: region.textDecoration ?? 'none',
          fontSize,
          lineHeight: `${h}px`,
          outline: 'none',
        }}
      />

      {/* Move handle — drag bar along top edge */}
      <div
        onMouseDown={handleMoveMouseDown}
        style={{
          position: 'absolute',
          top: -HANDLE_SIZE,
          left: HANDLE_SIZE,
          right: HANDLE_SIZE + 10,
          height: HANDLE_SIZE,
          cursor: 'move',
          background: theme.palette.primary.main,
          opacity: 0.5,
          borderRadius: '2px 2px 0 0',
          zIndex: 12,
        }}
        title="Drag to move"
      />

      {/* Delete button (bin icon) */}
      <div
        onMouseDown={(e) => handleDelete(e)}
        style={{
          position: 'absolute',
          top: -HANDLE_SIZE - 6,
          right: -HANDLE_SIZE - 6,
          width: HANDLE_SIZE + 8,
          height: HANDLE_SIZE + 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: theme.palette.error.main,
          color: theme.palette.error.contrastText,
          borderRadius: 4,
          cursor: 'pointer',
          zIndex: 12,
        }}
        title="Delete region"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6" />
          <path d="M14 11v6" />
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
        </svg>
      </div>

      {/* Confirm & Cancel buttons (bottom-right) */}
      <div
        style={{
          position: 'absolute',
          bottom: -HANDLE_SIZE - 8,
          right: -HANDLE_SIZE - 6,
          display: 'flex',
          gap: 3,
          zIndex: 12,
        }}
      >
        <div
          onMouseDown={handleCancel}
          style={{
            width: HANDLE_SIZE + 8,
            height: HANDLE_SIZE + 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: theme.palette.grey[700],
            color: theme.palette.grey[300],
            borderRadius: 4,
            cursor: 'pointer',
          }}
          title="Cancel (Esc)"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </div>
        <div
          onMouseDown={handleConfirm}
          style={{
            width: HANDLE_SIZE + 8,
            height: HANDLE_SIZE + 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            borderRadius: 4,
            cursor: 'pointer',
          }}
          title="Confirm (Enter)"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      </div>

      {/* Resize handles */}
      <div
        onMouseDown={handleResizeMouseDown('tl')}
        style={{ ...handleStyle('nw-resize'), top: -half, left: -half }}
      />
      <div
        onMouseDown={handleResizeMouseDown('tr')}
        style={{ ...handleStyle('ne-resize'), top: -half, right: -half }}
      />
      <div
        onMouseDown={handleResizeMouseDown('bl')}
        style={{ ...handleStyle('sw-resize'), bottom: -half, left: -half }}
      />
      <div
        onMouseDown={handleResizeMouseDown('br')}
        style={{ ...handleStyle('se-resize'), bottom: -half, right: -half }}
      />

      {/* Style toolbar */}
      <div
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          left: 0,
          top: h + 4,
          height: TOOLBAR_HEIGHT,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          background: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 4,
          padding: '0 6px',
          zIndex: 12,
          whiteSpace: 'nowrap',
        }}
      >
        {/* Font group */}
        <select
          value={region.fontFamily ?? 'Inter'}
          onChange={handleFontFamilyChange}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            height: 20,
            fontSize: 10,
            background: theme.palette.background.default,
            color: theme.palette.text.primary,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 2,
            padding: '0 2px',
            cursor: 'pointer',
            outline: 'none',
            maxWidth: 80,
          }}
        >
          <option value="Inter">Inter</option>
          <option value="Roboto">Roboto</option>
          <option value="Arial">Arial</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Courier New">Courier New</option>
          <option value="Georgia">Georgia</option>
        </select>
        <div
          onMouseDown={handleToggleBold}
          style={{
            width: 20,
            height: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 700,
            borderRadius: 2,
            cursor: 'pointer',
            userSelect: 'none',
            background: region.fontWeight === 'bold' ? theme.palette.primary.main : 'transparent',
            color: region.fontWeight === 'bold' ? theme.palette.primary.contrastText : theme.palette.text.secondary,
          }}
          title="Bold"
        >
          B
        </div>
        <div
          onMouseDown={handleToggleItalic}
          style={{
            width: 20,
            height: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontStyle: 'italic',
            borderRadius: 2,
            cursor: 'pointer',
            userSelect: 'none',
            background: region.fontStyle === 'italic' ? theme.palette.primary.main : 'transparent',
            color: region.fontStyle === 'italic' ? theme.palette.primary.contrastText : theme.palette.text.secondary,
          }}
          title="Italic"
        >
          I
        </div>
        <div
          onMouseDown={handleToggleStrikethrough}
          style={{
            width: 20,
            height: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            textDecoration: 'line-through',
            borderRadius: 2,
            cursor: 'pointer',
            userSelect: 'none',
            background: region.textDecoration === 'line-through' ? theme.palette.primary.main : 'transparent',
            color: region.textDecoration === 'line-through' ? theme.palette.primary.contrastText : theme.palette.text.secondary,
          }}
          title="Strikethrough"
        >
          S
        </div>
        <DebouncedColorPicker
          value={region.fontColor ?? theme.palette.text.primary}
          onChange={handleFontColorChange}
        />

        {/* Divider */}
        <div style={{ width: 1, height: 16, background: theme.palette.divider }} />

        {/* Border group */}
        <span style={{ fontSize: 10, color: theme.palette.text.secondary }}>Border</span>
        <DebouncedColorPicker
          value={region.borderColor ?? theme.palette.primary.main}
          onChange={handleBorderColorChange}
        />
        <div
          onMouseDown={handleToggleBorder}
          style={{
            width: 14,
            height: 14,
            border: `2px solid ${theme.palette.text.secondary}`,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            lineHeight: 1,
            cursor: 'pointer',
            userSelect: 'none',
          }}
          title={borderVisible ? 'Hide border' : 'Show border'}
        >
          {borderVisible ? '✓' : ''}
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 16, background: theme.palette.divider }} />

        {/* Background group */}
        <span style={{ fontSize: 10, color: theme.palette.text.secondary }}>BG</span>
        {region.backgroundColor && region.backgroundColor !== 'transparent' ? (
          <DebouncedColorPicker
            value={region.backgroundColor}
            onChange={handleBgColorChange}
          />
        ) : (
          <DebouncedColorPicker
            value="#000000"
            onChange={handleBgColorChange}
            style={{ opacity: 0.4 }}
          />
        )}
        <div
          onMouseDown={handleToggleBg}
          style={{
            width: 14,
            height: 14,
            border: `2px solid ${theme.palette.text.secondary}`,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            lineHeight: 1,
            cursor: 'pointer',
            userSelect: 'none',
            backgroundColor: region.backgroundColor && region.backgroundColor !== 'transparent' ? region.backgroundColor : 'transparent',
          }}
          title={region.backgroundColor && region.backgroundColor !== 'transparent' ? 'Clear background' : 'Add background'}
        >
          {region.backgroundColor && region.backgroundColor !== 'transparent' ? '✓' : ''}
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 16, background: theme.palette.divider }} />

        {/* Text position */}
        <span style={{ fontSize: 10, color: theme.palette.text.secondary }}>Text</span>
        <select
          value={region.textPosition ?? 'inside'}
          onChange={handleTextPositionChange}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            height: 20,
            fontSize: 10,
            background: theme.palette.background.default,
            color: theme.palette.text.primary,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 2,
            padding: '0 2px',
            cursor: 'pointer',
            outline: 'none',
            maxWidth: 64,
          }}
        >
          <option value="inside">Inside</option>
          <option value="top">Top</option>
          <option value="bottom">Bottom</option>
          <option value="left">Left</option>
          <option value="right">Right</option>
        </select>
      </div>
    </div>
  );
};
