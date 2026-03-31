import { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid2 as Grid,
} from '@mui/material';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined';
import { Reviso } from './reviso/Reviso';
import { exportDocument } from './reviso/utils/exportDocument';
import type { ExportType, ExportFormat } from './reviso/utils/exportDocument';
import { parsePdf } from './legacy/utils/parsePdf';
import { parseUploadedJson } from './legacy/utils/parseUploadedJson';
import { toPublicDocument } from './reviso/utils/typeMappers';
import type { RevisoDocument } from './reviso/types/public';
import type { TextRegion } from './reviso/types/document';

function loadImageDimensions(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

/** Simulates a document listing page with headless export. */
const ExportDemo: React.FC = () => {
  const [documents, setDocuments] = useState<RevisoDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<RevisoDocument | null>(null);

  // Per-document export settings
  const [exportTypes, setExportTypes] = useState<Record<string, ExportType>>({});
  const [exportFormats, setExportFormats] = useState<Record<string, ExportFormat>>({});

  useEffect(() => {
    async function loadDocs() {
      const docs: RevisoDocument[] = [];

      // Load sample PDF
      try {
        const [pdfResponse, regionsResponse] = await Promise.all([
          fetch('/sample-doc.pdf'),
          fetch('/sample-pdf-regions.json'),
        ]);
        const blob = await pdfResponse.blob();
        const file = new File([blob], 'Sample PDF Document.pdf', { type: 'application/pdf' });
        const pdfDocs = await parsePdf(file);
        const pdfDoc = pdfDocs[0];

        if (pdfDoc && regionsResponse.ok) {
          const regionsJson = await regionsResponse.text();
          const regionDocs = parseUploadedJson(regionsJson);
          const regionPages = regionDocs[0]?.pages ?? [];
          const regionsByPage = new Map<number, TextRegion[]>();
          for (const rp of regionPages) {
            regionsByPage.set(rp.pageNumber, rp.regions);
          }
          for (const page of pdfDoc.pages) {
            const regions = regionsByPage.get(page.pageNumber);
            if (regions) page.regions = regions;
          }
        }

        if (pdfDoc) docs.push(toPublicDocument(pdfDoc));
      } catch {
        // PDF load failed
      }

      // Load sample PNG as a single-page document
      try {
        const { width, height } = await loadImageDimensions('/sample-receipt.png');
        docs.push({
          id: 'png-sample',
          name: 'Sample Receipt',
          pages: [
            {
              id: 'png-sample-p1',
              pageNumber: 1,
              imageSrc: '/sample-receipt.png',
              originalImageSrc: '/sample-receipt.png',
              width,
              height,
              regions: [],
            },
          ],
        });
      } catch {
        // PNG load failed
      }

      // Set default export settings
      const defaultTypes: Record<string, ExportType> = {};
      const defaultFormats: Record<string, ExportFormat> = {};
      for (const doc of docs) {
        defaultTypes[doc.id] = 'synthetic';
        defaultFormats[doc.id] = 'pdf';
      }
      setExportTypes(defaultTypes);
      setExportFormats(defaultFormats);

      setDocuments(docs);
      setLoading(false);
    }

    loadDocs();
  }, []);

  const handleExport = useCallback(async (doc: RevisoDocument) => {
    const type = exportTypes[doc.id] ?? 'synthetic';
    const format = exportFormats[doc.id] ?? 'pdf';

    setExporting(doc.id);
    try {
      const result = await exportDocument({
        documents: [doc],
        type,
        format,
      });

      // Trigger download
      const url = URL.createObjectURL(result.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setExporting(null);
    }
  }, [exportTypes, exportFormats]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100vw', height: '100vh', bgcolor: '#0f0f1a' }}>
        <CircularProgress />
      </Box>
    );
  }

  // If a document is selected, show it in Reviso
  if (selectedDoc) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh' }}>
        <Box
          sx={{
            height: 48,
            minHeight: 48,
            display: 'flex',
            alignItems: 'center',
            px: 2,
            bgcolor: '#1a1a2e',
            borderBottom: 1,
            borderColor: 'divider',
            gap: 2,
          }}
        >
          <Button
            size="small"
            variant="outlined"
            onClick={() => setSelectedDoc(null)}
            sx={{ color: '#e94560', borderColor: '#e94560' }}
          >
            Back to Documents
          </Button>
          <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>
            {selectedDoc.name}
          </Typography>
        </Box>
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <Reviso document={selectedDoc} />
        </Box>
      </Box>
    );
  }

  // Document listing page
  return (
    <Box sx={{ width: '100vw', minHeight: '100vh', bgcolor: '#0f0f1a', py: 4, px: 3 }}>
      <Box sx={{ maxWidth: 900, mx: 'auto' }}>
        <Typography variant="h5" sx={{ color: '#e94560', fontWeight: 700, mb: 1 }}>
          Documents
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
          Demo of the headless <code>exportDocument()</code> API — export directly from the listing page without opening the editor.
        </Typography>

        <Grid container spacing={2}>
          {documents.map((doc) => {
            const type = exportTypes[doc.id] ?? 'synthetic';
            const format = exportFormats[doc.id] ?? 'pdf';
            const isExporting = exporting === doc.id;
            const showFormat = type !== 'json';

            return (
              <Grid key={doc.id} size={{ xs: 12, sm: 6 }}>
                <Card sx={{ bgcolor: '#1a1a2e', borderRadius: 2 }}>
                  <CardContent sx={{ pb: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      {doc.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {doc.pages.length} page{doc.pages.length > 1 ? 's' : ''} &middot;{' '}
                      {doc.pages.reduce((sum, p) => sum + p.regions.length, 0)} regions
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                      <FormControl size="small" sx={{ minWidth: 160 }}>
                        <InputLabel>Export Type</InputLabel>
                        <Select
                          label="Export Type"
                          value={type}
                          onChange={(e) =>
                            setExportTypes((prev) => ({ ...prev, [doc.id]: e.target.value as ExportType }))
                          }
                        >
                          <MenuItem value="synthetic">Synthetic Reconstruct</MenuItem>
                          <MenuItem value="overlay">Overlay</MenuItem>
                          <MenuItem value="original">Original</MenuItem>
                          <MenuItem value="json">Document JSON</MenuItem>
                        </Select>
                      </FormControl>

                      {showFormat && (
                        <FormControl size="small" sx={{ minWidth: 80 }}>
                          <InputLabel>Format</InputLabel>
                          <Select
                            label="Format"
                            value={format}
                            onChange={(e) =>
                              setExportFormats((prev) => ({ ...prev, [doc.id]: e.target.value as ExportFormat }))
                            }
                          >
                            <MenuItem value="pdf">PDF</MenuItem>
                            <MenuItem value="png">PNG</MenuItem>
                          </Select>
                        </FormControl>
                      )}
                    </Box>
                  </CardContent>

                  <CardActions sx={{ px: 2, pb: 2, gap: 1 }}>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={isExporting ? <CircularProgress size={16} color="inherit" /> : <FileDownloadOutlinedIcon />}
                      disabled={isExporting}
                      onClick={() => handleExport(doc)}
                    >
                      {isExporting ? 'Exporting...' : 'Export'}
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<OpenInNewOutlinedIcon />}
                      onClick={() => setSelectedDoc(doc)}
                    >
                      Open in Editor
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    </Box>
  );
};

export default ExportDemo;
