import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
  Grid2 as Grid,
} from '@mui/material';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined';
import { Reviso } from './reviso/Reviso';
import { ExportDocumentDialog } from './reviso/components/export/ExportDocumentDialog';
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

const ExportDemo: React.FC = () => {
  const [documents, setDocuments] = useState<RevisoDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<RevisoDocument | null>(null);
  const [exportDoc, setExportDoc] = useState<RevisoDocument | null>(null);

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

      setDocuments(docs);
      setLoading(false);
    }

    loadDocs();
  }, []);

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
          Demo of <code>ExportDocumentDialog</code> — click Export to open the same export dialog used inside the editor.
        </Typography>

        <Grid container spacing={2}>
          {documents.map((doc) => (
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
                </CardContent>

                <CardActions sx={{ px: 2, pb: 2, gap: 1 }}>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<FileDownloadOutlinedIcon />}
                    onClick={() => setExportDoc(doc)}
                  >
                    Export
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
          ))}
        </Grid>
      </Box>

      <ExportDocumentDialog
        open={exportDoc !== null}
        onClose={() => setExportDoc(null)}
        document={exportDoc}
      />
    </Box>
  );
};

export default ExportDemo;
