import { useState, useCallback } from 'react';
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
  Box,
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

export const ExportDialog: React.FC<ExportDialogProps> = ({ open, onClose }) => {
  const [format, setFormat] = useState<ExportFormat>('json');
  const [exporting, setExporting] = useState(false);

  const activeDocumentId = useUiStore((s) => s.activeDocumentId);
  const onExportCallback = useUiStore((s) => s.onExportCallback);
  const activeDocument = useDocumentStore((s) => s.getActiveDocument(activeDocumentId));

  const handleExport = useCallback(async () => {
    if (!activeDocument) return;

    const docsToExport = [activeDocument];
    setExporting(true);

    try {
      const baseName = activeDocument.name.replace(/\s+/g, '_').toLowerCase();

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
  }, [format, activeDocument, onClose, onExportCallback]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Export Document</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
          <FormControl>
            <FormLabel>Format</FormLabel>
            <RadioGroup
              value={format}
              onChange={(e) => setFormat(e.target.value as ExportFormat)}
            >
              <FormControlLabel value="json" control={<Radio size="small" />} label="JSON — Corrected data in structured format" />
              <FormControlLabel value="pdf" control={<Radio size="small" />} label="PDF — Document with text at original positions" />
              <FormControlLabel value="image" control={<Radio size="small" />} label="PNG — Page images with text overlays" />
            </RadioGroup>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={exporting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleExport}
          disabled={exporting || !activeDocument}
        >
          {exporting ? 'Exporting...' : 'Export'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
