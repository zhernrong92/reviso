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
import type { ThemeOptions } from '@mui/material/styles';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined';
import { Reviso } from './reviso/Reviso';
import { ExportDocumentDialog } from './reviso/components/export/ExportDocumentDialog';
import { parsePdf } from './legacy/utils/parsePdf';
import { parseUploadedJson } from './legacy/utils/parseUploadedJson';
import { toPublicDocument } from './reviso/utils/typeMappers';
import type { RevisoDocument, RevisoProps } from './reviso/types/public';
import type { TextRegion } from './reviso/types/document';

// Mirrors doc-res-ui-1's RevisoDarkTheme (src/constants/ThemeConstant.tsx)
const ExternalAppDarkTheme: ThemeOptions = {
  palette: {
    mode: 'dark',
    primary: { main: '#0bda90', light: '#4de8ab', dark: '#08a86e', contrastText: '#000000' },
    background: { default: '#0a0a0a', paper: '#141414' },
    text: { primary: '#e0e0e0', secondary: '#a0a0a0' },
  },
  typography: { fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif' },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: { styleOverrides: { root: { textTransform: 'none' } } },
  },
};

const EXTERNAL_APP_DEFAULT_REGION_STYLES: RevisoProps['defaultRegionStyles'] = {
  fontColor: '#0000ff',
  borderColor: '#00ff00',
};

type DocConfig = {
  theme?: ThemeOptions;
  defaultRegionStyles?: RevisoProps['defaultRegionStyles'];
};

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
  const [docConfigs, setDocConfigs] = useState<Record<string, DocConfig>>({});
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<RevisoDocument | null>(null);
  const [exportDoc, setExportDoc] = useState<RevisoDocument | null>(null);

  useEffect(() => {
    async function loadDocs() {
      const docs: RevisoDocument[] = [];
      const configs: Record<string, DocConfig> = {};

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

      // Image + regions JSON samples
      const imageJsonSamples: Array<{ image: string; json: string; name: string }> = [
        { image: '/DBK_2022-61_T__86.jpg', json: '/dbk_2022-61_t__86.jpg.json', name: 'DBK 2022-61 T 86' },
        { image: '/receipt_ancient_003_598x922.jpg', json: '/receipt_ancient_003_598x922.jpg.json', name: 'Ancient Receipt 003' },
        { image: '/cn1.png', json: '/cn1.png.json', name: 'CN1 — Vertical CJK' },
        { image: '/cn2.png', json: '/cn2.png.json', name: 'CN2 — Vertical CJK' },
        { image: '/cn3.png', json: '/cn3.png.json', name: 'CN3 — Vertical CJK' },
      ];
      for (const sample of imageJsonSamples) {
        try {
          const [{ width, height }, regionsResponse] = await Promise.all([
            loadImageDimensions(sample.image),
            fetch(sample.json),
          ]);
          const regionsJson = await regionsResponse.text();

          // Converted (proper) version
          const internalDoc = parseUploadedJson(regionsJson)[0];
          if (internalDoc?.pages[0]) {
            const page = internalDoc.pages[0];
            page.imageSrc = sample.image;
            page.originalImageSrc = sample.image;
            page.width = width;
            page.height = height;
            internalDoc.name = sample.name;
            docs.push(toPublicDocument(internalDoc));
          }

          // External-app simulation: mimics doc-res-ui-1's path.
          // - Same public-shape conversion (their API already returns it)
          // - Page width/height kept as JSON-declared (NOT image natural dims)
          // - Reviso wrapped with their dark theme + defaultRegionStyles
          const extInternalDoc = parseUploadedJson(regionsJson)[0];
          if (extInternalDoc?.pages[0]) {
            const page = extInternalDoc.pages[0];
            page.imageSrc = sample.image;
            page.originalImageSrc = sample.image;
            // Intentionally do NOT override page.width / page.height
            extInternalDoc.id = `${extInternalDoc.id}-ext`;
            extInternalDoc.name = `${sample.name} (external-app config)`;
            const extDoc = toPublicDocument(extInternalDoc);
            docs.push(extDoc);
            configs[extDoc.id] = {
              theme: ExternalAppDarkTheme,
              defaultRegionStyles: EXTERNAL_APP_DEFAULT_REGION_STYLES,
            };
          }
        } catch {
          // sample load failed
        }
      }

      // Force textPosition: "top" on every region — the legacy loaders
      // (parseUploadedJson / parsePdf) drop this field, and the renderer
      // defaults missing values to "inside".
      for (const doc of docs) {
        for (const page of doc.pages) {
          for (const region of page.regions) {
            region.textPosition = 'top';
          }
        }
      }

      setDocuments(docs);
      setDocConfigs(configs);
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
          <Reviso
            document={selectedDoc}
            theme={docConfigs[selectedDoc.id]?.theme}
            defaultRegionStyles={docConfigs[selectedDoc.id]?.defaultRegionStyles}
          />
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
