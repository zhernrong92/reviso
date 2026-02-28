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
          background: `${theme.palette.background.paper}ee`,
          color: region.fontColor ?? theme.palette.text.primary,
          fontFamily: theme.typography.fontFamily as string,
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

      {/* Delete button */}
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
          fontSize: 14,
          fontWeight: 700,
          lineHeight: 1,
          zIndex: 12,
        }}
        title="Delete region"
      >
        ×
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
          gap: 6,
          background: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 4,
          padding: '0 8px',
          zIndex: 12,
          whiteSpace: 'nowrap',
        }}
      >
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            fontSize: 11,
            color: theme.palette.text.secondary,
            cursor: 'pointer',
          }}
        >
          Font
          <DebouncedColorPicker
            value={region.fontColor ?? theme.palette.text.primary}
            onChange={handleFontColorChange}
          />
        </label>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            fontSize: 11,
            color: theme.palette.text.secondary,
            cursor: 'pointer',
          }}
        >
          Border
          <DebouncedColorPicker
            value={region.borderColor ?? theme.palette.primary.main}
            onChange={handleBorderColorChange}
          />
        </label>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            fontSize: 11,
            color: theme.palette.text.secondary,
            cursor: 'pointer',
          }}
        >
          BG
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
        </label>
        <div
          onMouseDown={handleToggleBg}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            fontSize: 11,
            color: theme.palette.text.secondary,
            cursor: 'pointer',
            userSelect: 'none',
          }}
          title={region.backgroundColor && region.backgroundColor !== 'transparent' ? 'Clear background' : 'Add background'}
        >
          <div
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
              backgroundColor: region.backgroundColor && region.backgroundColor !== 'transparent' ? region.backgroundColor : 'transparent',
            }}
          >
            {region.backgroundColor && region.backgroundColor !== 'transparent' ? '✓' : ''}
          </div>
          BG
        </div>
        <div
          onMouseDown={handleToggleBorder}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            fontSize: 11,
            color: theme.palette.text.secondary,
            cursor: 'pointer',
            userSelect: 'none',
          }}
          title={borderVisible ? 'Hide border' : 'Show border'}
        >
          <div
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
            }}
          >
            {borderVisible ? '✓' : ''}
          </div>
          Visible
        </div>
      </div>
    </div>
  );
};
