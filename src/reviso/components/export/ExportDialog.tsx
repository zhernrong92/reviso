import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Box,
  Typography,
} from '@mui/material';
import { useDocumentStore } from '../../stores/documentStore';
import { useUiStore } from '../../stores/uiStore';
import { exportJson } from '../../utils/exportJson';
import { exportPdf } from '../../utils/exportPdf';
import { exportImage } from '../../utils/exportImage';
import { downloadFile } from '../../utils/downloadFile';

type ExportFormat = 'json' | 'pdf' | 'image';

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
}

/** Parse a printer-style page range string (e.g. "1-5, 8, 11-13") into a Set of page numbers. */
function parsePageRange(input: string, maxPage: number): Set<number> {
  const result = new Set<number>();
  const parts = input.split(',');
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const rangeMatch = /^(\d+)\s*-\s*(\d+)$/.exec(trimmed);
    if (rangeMatch && rangeMatch[1] && rangeMatch[2]) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);
      for (let i = Math.max(1, start); i <= Math.min(maxPage, end); i++) {
        result.add(i);
      }
    } else {
      const num = parseInt(trimmed, 10);
      if (!isNaN(num) && num >= 1 && num <= maxPage) {
        result.add(num);
      }
    }
  }
  return result;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({ open, onClose }) => {
  const [format, setFormat] = useState<ExportFormat>('json');
  const [exporting, setExporting] = useState(false);
  const [pageRangeInput, setPageRangeInput] = useState('');

  const activeDocumentId = useUiStore((s) => s.activeDocumentId);
  const onExportCallback = useUiStore((s) => s.onExportCallback);
  const activeDocument = useDocumentStore((s) => s.getActiveDocument(activeDocumentId));

  const totalPages = activeDocument?.pages.length ?? 0;
  const showPageSelection = totalPages > 1;

  // Reset page range to "all" when dialog opens
  useEffect(() => {
    if (open && activeDocument) {
      setPageRangeInput(`1-${activeDocument.pages.length}`);
    }
  }, [open, activeDocument]);

  const selectedPageNumbers = useMemo(
    () => parsePageRange(pageRangeInput, totalPages),
    [pageRangeInput, totalPages],
  );

  const hasValidSelection = selectedPageNumbers.size > 0;

  const filteredDocument = useMemo(() => {
    if (!activeDocument) return null;
    const filtered = activeDocument.pages.filter((p) => selectedPageNumbers.has(p.pageNumber));
    return {
      ...activeDocument,
      pages: filtered,
      pageCount: filtered.length,
    };
  }, [activeDocument, selectedPageNumbers]);

  const handleExport = useCallback(async () => {
    if (!filteredDocument || filteredDocument.pages.length === 0) return;

    const docsToExport = [filteredDocument];
    setExporting(true);

    try {
      const baseName = filteredDocument.name.replace(/\s+/g, '_').toLowerCase();

      if (format === 'json') {
        const json = exportJson(docsToExport);
        if (onExportCallback) {
          onExportCallback('json', new Blob([json], { type: 'application/json' }));
        } else {
          downloadFile(json, `${baseName}.json`, 'application/json');
        }
      } else if (format === 'pdf') {
        const pdfBytes = await exportPdf(docsToExport);
        if (onExportCallback) {
          onExportCallback('pdf', new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' }));
        } else {
          downloadFile(pdfBytes, `${baseName}.pdf`, 'application/pdf');
        }
      } else {
        const images = await exportImage(docsToExport);
        if (onExportCallback) {
          for (const { blob } of images) {
            onExportCallback('png', blob);
          }
        } else {
          for (const { filename, blob } of images) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          }
        }
      }

      onClose();
    } finally {
      setExporting(false);
    }
  }, [format, filteredDocument, onClose, onExportCallback]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Export Document</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <FormControl>
            <FormLabel>Format</FormLabel>
            <RadioGroup
              value={format}
              onChange={(e) => setFormat(e.target.value as ExportFormat)}
            >
              <FormControlLabel value="json" control={<Radio size="small" />} label="JSON — Corrected data" />
              <FormControlLabel value="pdf" control={<Radio size="small" />} label="PDF — Text at original positions" />
              <FormControlLabel value="image" control={<Radio size="small" />} label="PNG — Images with text overlays" />
            </RadioGroup>
          </FormControl>

          {showPageSelection && (
            <FormControl>
              <FormLabel>Pages</FormLabel>
              <TextField
                size="small"
                value={pageRangeInput}
                onChange={(e) => setPageRangeInput(e.target.value)}
                placeholder={`e.g. 1-${totalPages}`}
                helperText={
                  hasValidSelection
                    ? `${selectedPageNumbers.size} of ${totalPages} pages`
                    : 'Invalid range'
                }
                error={!hasValidSelection}
                sx={{ mt: 0.5 }}
                slotProps={{ htmlInput: { sx: { fontSize: 13 } } }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                e.g. 1-5, 8, 11-13
              </Typography>
            </FormControl>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={exporting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleExport}
          disabled={exporting || !activeDocument || !hasValidSelection}
        >
          {exporting ? 'Exporting...' : `Export${hasValidSelection && showPageSelection ? ` (${selectedPageNumbers.size})` : ''}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
