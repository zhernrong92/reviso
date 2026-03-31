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
import { exportJson } from '../../utils/exportJson';
import { exportPdf } from '../../utils/exportPdf';
import { exportOverlayPdf } from '../../utils/exportOverlayPdf';
import { exportOriginalPdf, exportOriginalPng } from '../../utils/exportOriginal';
import { exportSyntheticImage } from '../../utils/exportSyntheticImage';
import { exportPreviewPageAsBlob } from '../../utils/exportPreviewImage';
import { downloadFile } from '../../utils/downloadFile';
import { createZipBlob, blobToUint8Array } from '../../utils/zipFiles';

type ExportType = 'synthetic' | 'overlay' | 'original' | 'json';
type FileFormat = 'pdf' | 'png';

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
  const [fileFormat, setFileFormat] = useState<FileFormat>('pdf');
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

  /** Download a single blob or, if callback is set, pass it through. */
  const downloadBlob = useCallback((blob: Blob, filename: string, format: 'pdf' | 'png') => {
    if (onExportCallback) {
      onExportCallback(format, blob);
      return;
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [onExportCallback]);

  /** Download multiple PNGs — zipped if more than one, single file otherwise. */
  const downloadPngs = useCallback(async (
    images: { filename: string; blob: Blob }[],
    zipName: string,
  ) => {
    if (onExportCallback) {
      for (const { blob } of images) {
        onExportCallback('png', blob);
      }
      return;
    }
    if (images.length === 1 && images[0]) {
      downloadBlob(images[0].blob, images[0].filename, 'png');
    } else {
      const entries = await Promise.all(
        images.map(async ({ filename, blob }) => ({
          filename,
          data: await blobToUint8Array(blob),
        })),
      );
      const zipBlob = createZipBlob(entries);
      downloadBlob(zipBlob, zipName, 'png');
    }
  }, [onExportCallback, downloadBlob]);

  const handleExport = useCallback(async () => {
    if (!filteredDocument || filteredDocument.pages.length === 0) return;

    const docsToExport = [filteredDocument];
    setExporting(true);

    try {
      const baseName = filteredDocument.name.replace(/\s+/g, '_').toLowerCase();

      if (exportType === 'json') {
        const json = exportJson(docsToExport);
        if (onExportCallback) {
          onExportCallback('json', new Blob([json], { type: 'application/json' }));
        } else {
          downloadFile(json, `${baseName}.json`, 'application/json');
        }
      } else if (exportType === 'synthetic') {
        if (fileFormat === 'pdf') {
          const pdfBytes = await exportPdf(docsToExport);
          downloadBlob(
            new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' }),
            `${baseName}_synthetic.pdf`,
            'pdf',
          );
        } else {
          const images = await exportSyntheticImage(docsToExport);
          await downloadPngs(images, `${baseName}_synthetic.zip`);
        }
      } else if (exportType === 'original') {
        if (fileFormat === 'pdf') {
          const pdfBytes = await exportOriginalPdf(docsToExport);
          downloadBlob(
            new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' }),
            `${baseName}_original.pdf`,
            'pdf',
          );
        } else {
          const images = await exportOriginalPng(docsToExport);
          await downloadPngs(images, `${baseName}_original.zip`);
        }
      } else if (exportType === 'overlay') {
        if (fileFormat === 'pdf') {
          const pdfBytes = await exportOverlayPdf(docsToExport);
          downloadBlob(
            new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' }),
            `${baseName}_overlay.pdf`,
            'pdf',
          );
        } else {
          const images: { filename: string; blob: Blob }[] = [];
          for (const page of filteredDocument.pages) {
            const blob = await exportPreviewPageAsBlob(page);
            const suffix = filteredDocument.pages.length > 1 ? `_page${page.pageNumber}` : '';
            images.push({ filename: `${baseName}${suffix}_overlay.png`, blob });
          }
          await downloadPngs(images, `${baseName}_overlay.zip`);
        }
      }

      onClose();
    } finally {
      setExporting(false);
    }
  }, [exportType, fileFormat, filteredDocument, onClose, onExportCallback, downloadBlob, downloadPngs]);

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
                onChange={(e) => setFileFormat(e.target.value as FileFormat)}
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
