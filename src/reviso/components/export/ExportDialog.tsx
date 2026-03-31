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
  Select,
  MenuItem,
} from '@mui/material';
import { useDocumentStore } from '../../stores/documentStore';
import { useUiStore } from '../../stores/uiStore';
import { toPublicDocument } from '../../utils/typeMappers';
import { exportDocument } from '../../utils/exportDocument';
import type { ExportType, ExportFormat } from '../../utils/exportDocument';

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
  const [exportType, setExportType] = useState<ExportType>('synthetic');
  const [fileFormat, setFileFormat] = useState<ExportFormat>('pdf');
  const [exporting, setExporting] = useState(false);
  const [pageRangeInput, setPageRangeInput] = useState('');

  const activeDocumentId = useUiStore((s) => s.activeDocumentId);
  const onExportCallback = useUiStore((s) => s.onExportCallback);
  const activeDocument = useDocumentStore((s) => s.getActiveDocument(activeDocumentId));

  const totalPages = activeDocument?.pages.length ?? 0;
  const showPageSelection = totalPages > 1;

  // Reset state when dialog opens
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

    setExporting(true);

    try {
      const publicDoc = toPublicDocument(filteredDocument);
      const result = await exportDocument({
        documents: [publicDoc],
        type: exportType,
        format: fileFormat,
      });

      if (onExportCallback) {
        const callbackFormat = exportType === 'json' ? 'json' as const
          : fileFormat === 'pdf' ? 'pdf' as const
          : 'png' as const;
        onExportCallback(callbackFormat, result.blob);
      } else {
        const url = URL.createObjectURL(result.blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = result.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      onClose();
    } finally {
      setExporting(false);
    }
  }, [exportType, fileFormat, filteredDocument, onClose, onExportCallback]);

  const showFormatSelect = exportType !== 'json';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Export Document</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <FormControl>
            <FormLabel>Export Type</FormLabel>
            <RadioGroup
              value={exportType}
              onChange={(e) => setExportType(e.target.value as ExportType)}
            >
              <FormControlLabel value="synthetic" control={<Radio size="small" />} label="Synthetic Reconstruct" />
              <FormControlLabel value="overlay" control={<Radio size="small" />} label="Overlay" />
              <FormControlLabel value="original" control={<Radio size="small" />} label="Original" />
              <FormControlLabel value="json" control={<Radio size="small" />} label="Document JSON" />
            </RadioGroup>
          </FormControl>

          {showFormatSelect && (
            <FormControl size="small">
              <FormLabel>Export Format</FormLabel>
              <Select
                value={fileFormat}
                onChange={(e) => setFileFormat(e.target.value as ExportFormat)}
                sx={{ mt: 0.5, maxWidth: 160 }}
              >
                <MenuItem value="pdf">PDF</MenuItem>
                <MenuItem value="png">PNG</MenuItem>
              </Select>
            </FormControl>
          )}

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
