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
type ExportScope = 'current' | 'all';

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({ open, onClose }) => {
  const [format, setFormat] = useState<ExportFormat>('json');
  const [scope, setScope] = useState<ExportScope>('current');
  const [exporting, setExporting] = useState(false);

  const documents = useDocumentStore((s) => s.documents);
  const activeDocumentId = useUiStore((s) => s.activeDocumentId);
  const activeDocument = useDocumentStore((s) => s.getActiveDocument(activeDocumentId));

  const handleExport = useCallback(async () => {
    const docsToExport = scope === 'current' && activeDocument
      ? [activeDocument]
      : documents;

    if (docsToExport.length === 0) return;

    setExporting(true);

    try {
      const baseName = scope === 'current' && activeDocument
        ? activeDocument.name.replace(/\s+/g, '_').toLowerCase()
        : 'reviso_export';

      if (format === 'json') {
        const json = exportJson(docsToExport);
        downloadFile(json, `${baseName}.json`, 'application/json');
      } else if (format === 'pdf') {
        const pdfBytes = await exportPdf(docsToExport);
        downloadFile(pdfBytes, `${baseName}.pdf`, 'application/pdf');
      } else {
        const images = await exportImage(docsToExport);
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

      onClose();
    } finally {
      setExporting(false);
    }
  }, [format, scope, documents, activeDocument, onClose]);

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

          <FormControl>
            <FormLabel>Scope</FormLabel>
            <RadioGroup
              value={scope}
              onChange={(e) => setScope(e.target.value as ExportScope)}
            >
              <FormControlLabel
                value="current"
                control={<Radio size="small" />}
                label={activeDocument ? `Current document: ${activeDocument.name}` : 'Current document'}
                disabled={!activeDocument}
              />
              <FormControlLabel
                value="all"
                control={<Radio size="small" />}
                label={`All documents (${documents.length})`}
              />
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
          disabled={exporting || (scope === 'current' && !activeDocument)}
        >
          {exporting ? 'Exporting...' : 'Export'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
