import { useState, useRef, useCallback } from 'react';
import { useTheme } from '@mui/material/styles';
import { useDocumentStore } from '../../stores/documentStore';
import { useUiStore } from '../../stores/uiStore';

interface RegionCreatorProps {
  width: number;
  height: number;
  pageId: string;
}

interface DragRect {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

const MIN_WIDTH = 20;
const MIN_HEIGHT = 10;

export const RegionCreator: React.FC<RegionCreatorProps> = ({ width, height, pageId }) => {
  const theme = useTheme();
  const overlayRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<DragRect | null>(null);
  const addRegion = useDocumentStore((s) => s.addRegion);
  const selectRegion = useUiStore((s) => s.selectRegion);
  const setEditorMode = useUiStore((s) => s.setEditorMode);
  const regionDefaults = useUiStore((s) => s.regionDefaults);

  const toImageCoords = useCallback(
    (clientX: number, clientY: number) => {
      const el = overlayRef.current;
      if (!el) return { x: 0, y: 0 };
      const rect = el.getBoundingClientRect();
      const scaleX = width / rect.width;
      const scaleY = height / rect.height;
      return {
        x: Math.max(0, Math.min(width, (clientX - rect.left) * scaleX)),
        y: Math.max(0, Math.min(height, (clientY - rect.top) * scaleY)),
      };
    },
    [width, height],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      const { x, y } = toImageCoords(e.clientX, e.clientY);
      setDrag({ startX: x, startY: y, currentX: x, currentY: y });
    },
    [toImageCoords],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!drag) return;
      e.stopPropagation();
      const { x, y } = toImageCoords(e.clientX, e.clientY);
      setDrag((prev) => (prev ? { ...prev, currentX: x, currentY: y } : null));
    },
    [drag, toImageCoords],
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!drag) return;

      const x1 = Math.min(drag.startX, drag.currentX);
      const y1 = Math.min(drag.startY, drag.currentY);
      const x2 = Math.max(drag.startX, drag.currentX);
      const y2 = Math.max(drag.startY, drag.currentY);
      const w = x2 - x1;
      const h = y2 - y1;

      setDrag(null);

      if (w < MIN_WIDTH || h < MIN_HEIGHT) return;

      const regionId = `${pageId}-r-new-${Date.now()}`;
      addRegion(pageId, {
        id: regionId,
        x1: Math.round(x1),
        y1: Math.round(y1),
        x2: Math.round(x2),
        y2: Math.round(y2),
        originalText: '',
        currentText: '',
        isEdited: false,
        isNew: true,
        confidence: 1.0,
        fontColor: regionDefaults.fontColor,
        fontFamily: regionDefaults.fontFamily,
        fontWeight: regionDefaults.fontWeight,
        fontStyle: regionDefaults.fontStyle,
        textDecoration: regionDefaults.textDecoration,
        borderColor: regionDefaults.borderColor,
        borderVisible: regionDefaults.borderVisible,
        backgroundColor: regionDefaults.backgroundColor,
        textPosition: regionDefaults.textPosition,
      });
      selectRegion(regionId);
      setEditorMode('select');
    },
    [drag, pageId, addRegion, selectRegion, setEditorMode],
  );

  const previewRect = drag
    ? {
        left: Math.min(drag.startX, drag.currentX),
        top: Math.min(drag.startY, drag.currentY),
        width: Math.abs(drag.currentX - drag.startX),
        height: Math.abs(drag.currentY - drag.startY),
      }
    : null;

  return (
    <div
      ref={overlayRef}
      className="region-creator"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width,
        height,
        cursor: 'crosshair',
        zIndex: 5,
      }}
    >
      {previewRect && (
        <div
          style={{
            position: 'absolute',
            left: previewRect.left,
            top: previewRect.top,
            width: previewRect.width,
            height: previewRect.height,
            border: `2px dashed ${theme.palette.warning.main}`,
            borderRadius: 2,
            background: `${theme.palette.warning.main}15`,
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
};
