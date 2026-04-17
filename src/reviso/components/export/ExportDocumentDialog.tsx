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
  Divider,
  Chip,
} from '@mui/material';
import { exportDocument, exportAllDocuments } from '../../utils/exportDocument';
import type { ExportType, ExportFormat } from '../../utils/exportDocument';
import type { RevisoDocument } from '../../types/public';

export interface ExportDocumentDialogProps {
  open: boolean;
  onClose: () => void;
  /** The document to export */
  document: RevisoDocument | null;
  /** Currently active page number — enables the "Current page" shortcut */
  activePageNumber?: number;
  /** Intercept export instead of auto-downloading */
  onExport?: (format: 'json' | 'pdf' | 'png', data: Blob) => void;
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

export const ExportDocumentDialog: React.FC<ExportDocumentDialogProps> = ({
  open,
  onClose,
  document: doc,
  activePageNumber,
  onExport,
}) => {
  const [exportType, setExportType] = useState<ExportType | 'all'>('synthetic');
  const [fileFormat, setFileFormat] = useState<ExportFormat>('pdf');
  const [exporting, setExporting] = useState(false);
  const [pageRangeInput, setPageRangeInput] = useState('');

  const totalPages = doc?.pages.length ?? 0;
  const showPageSelection = totalPages > 1;

  // Reset state when dialog opens
  useEffect(() => {
    if (open && doc) {
      setPageRangeInput(`1-${doc.pages.length}`);
    }
  }, [open, doc]);

  const selectedPageNumbers = useMemo(
    () => parsePageRange(pageRangeInput, totalPages),
    [pageRangeInput, totalPages],
  );

  const hasValidSelection = selectedPageNumbers.size > 0;

  const filteredDocument = useMemo(() => {
    if (!doc) return null;
    const filtered = doc.pages.filter((p) => selectedPageNumbers.has(p.pageNumber));
    return { ...doc, pages: filtered };
  }, [doc, selectedPageNumbers]);

  const handleExport = useCallback(async () => {
    if (!filteredDocument || filteredDocument.pages.length === 0) return;

    setExporting(true);

    try {
      const result = exportType === 'all'
        ? await exportAllDocuments({
            documents: [filteredDocument],
            format: fileFormat,
          })
        : await exportDocument({
            documents: [filteredDocument],
            type: exportType,
            format: fileFormat,
          });

      if (onExport && exportType !== 'all') {
        const callbackFormat = exportType === 'json' ? 'json' as const
          : fileFormat === 'pdf' ? 'pdf' as const
          : 'png' as const;
        onExport(callbackFormat, result.blob);
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
  }, [exportType, fileFormat, filteredDocument, onClose, onExport]);

  const showFormatSelect = exportType !== 'json';

  const typeOptions: { value: ExportType | 'all'; label: string; description: string }[] = [
    { value: 'synthetic', label: 'Synthetic Reconstruct', description: 'Clean regenerated pages from extracted text' },
    { value: 'overlay', label: 'Overlay', description: 'Original pages with restored text overlaid' },
    { value: 'original', label: 'Original', description: 'Unchanged source pages' },
    { value: 'json', label: 'Document JSON', description: 'Structured data for re-import into Reviso' },
    { value: 'all', label: 'All Formats (ZIP)', description: 'All of the above bundled in one archive (respects page selection)' },
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Export Document</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <FormControl>
            <FormLabel sx={{ fontWeight: 500, mb: 0.5 }}>What to export</FormLabel>
            <RadioGroup
              value={exportType}
              onChange={(e) => setExportType(e.target.value as ExportType | 'all')}
            >
              {typeOptions.map((opt) => (
                <FormControlLabel
                  key={opt.value}
                  value={opt.value}
                  control={<Radio size="small" />}
                  sx={{ alignItems: 'flex-start', mb: 0.5, '& .MuiRadio-root': { pt: 0.5 } }}
                  label={
                    <Box>
                      <Typography variant="body2">{opt.label}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.3 }}>
                        {opt.description}
                      </Typography>
                    </Box>
                  }
                />
              ))}
            </RadioGroup>
          </FormControl>

          <Divider />

          {showFormatSelect && (
            <FormControl size="small">
              <FormLabel>File format</FormLabel>
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <FormLabel sx={{ m: 0 }}>Pages</FormLabel>
                <Chip
                  size="small"
                  label="All"
                  variant="outlined"
                  onClick={() => setPageRangeInput(`1-${totalPages}`)}
                  sx={{ height: 20, fontSize: 11 }}
                />
                {activePageNumber !== undefined && (
                  <Chip
                    size="small"
                    label="Current page"
                    variant="outlined"
                    onClick={() => setPageRangeInput(String(activePageNumber))}
                    sx={{ height: 20, fontSize: 11 }}
                  />
                )}
              </Box>
              <TextField
                size="small"
                value={pageRangeInput}
                onChange={(e) => setPageRangeInput(e.target.value)}
                placeholder="e.g. 1-5, 8, 11-13"
                helperText={
                  hasValidSelection
                    ? `${selectedPageNumbers.size} of ${totalPages} pages`
                    : 'No pages match that range'
                }
                error={!hasValidSelection}
                slotProps={{ htmlInput: { sx: { fontSize: 13 } } }}
              />
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
          disabled={exporting || !doc || !hasValidSelection}
        >
          {exporting ? 'Exporting...' : `Export${hasValidSelection && showPageSelection ? ` (${selectedPageNumbers.size})` : ''}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
