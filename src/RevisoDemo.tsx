import { useEffect, useState } from 'react';
import { Box, CircularProgress, Typography, List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import { Reviso } from './reviso/Reviso';
import { parsePdf } from './legacy/utils/parsePdf';
import { parseUploadedJson } from './legacy/utils/parseUploadedJson';
import { toPublicDocument } from './reviso/utils/typeMappers';
import type { RevisoDocument } from './reviso/types/public';
import type { TextRegion } from './reviso/types/document';

const RevisoDemo: React.FC = () => {
  const [document, setDocument] = useState<RevisoDocument | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSamplePdf() {
      const [pdfResponse, regionsResponse] = await Promise.all([
        fetch('/sample-doc.pdf'),
        fetch('/sample-pdf-regions.json'),
      ]);

      const blob = await pdfResponse.blob();
      const file = new File([blob], 'Sample PDF Document.pdf', { type: 'application/pdf' });
      const pdfDocs = await parsePdf(file);
      const pdfDoc = pdfDocs[0];
      if (!pdfDoc) throw new Error('Failed to parse PDF');

      // Merge regions from JSON into rendered PDF pages
      if (regionsResponse.ok) {
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

      setDocument(toPublicDocument(pdfDoc));
    }

    loadSamplePdf().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : 'Failed to load sample PDF');
    });
  }, []);

  if (error) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100vw', height: '100vh' }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!document) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100vw', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh' }}>
      {/* Dummy host top bar */}
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
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#e94560' }}>
          HostApp
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Dashboard
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Documents
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.primary', borderBottom: 2, borderColor: '#e94560', pb: 0.25 }}>
          Editor
        </Typography>
        <Box sx={{ flex: 1 }} />
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          user@example.com
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Dummy host left panel */}
        <Box
          sx={{
            width: 200,
            minWidth: 200,
            bgcolor: '#1a1a2e',
            borderRight: 1,
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <List dense disablePadding sx={{ pt: 1 }}>
            <ListItemButton sx={{ px: 2 }}>
              <ListItemIcon sx={{ minWidth: 32 }}><HomeIcon sx={{ fontSize: 18, color: 'text.secondary' }} /></ListItemIcon>
              <ListItemText primary="Dashboard" primaryTypographyProps={{ variant: 'body2' }} />
            </ListItemButton>
            <ListItemButton selected sx={{ px: 2, '&.Mui-selected': { bgcolor: 'rgba(233, 69, 96, 0.12)' } }}>
              <ListItemIcon sx={{ minWidth: 32 }}><DescriptionOutlinedIcon sx={{ fontSize: 18, color: '#e94560' }} /></ListItemIcon>
              <ListItemText primary="Documents" primaryTypographyProps={{ variant: 'body2', color: '#e94560' }} />
            </ListItemButton>
            <ListItemButton sx={{ px: 2 }}>
              <ListItemIcon sx={{ minWidth: 32 }}><PeopleOutlinedIcon sx={{ fontSize: 18, color: 'text.secondary' }} /></ListItemIcon>
              <ListItemText primary="Team" primaryTypographyProps={{ variant: 'body2' }} />
            </ListItemButton>
            <ListItemButton sx={{ px: 2 }}>
              <ListItemIcon sx={{ minWidth: 32 }}><SettingsOutlinedIcon sx={{ fontSize: 18, color: 'text.secondary' }} /></ListItemIcon>
              <ListItemText primary="Settings" primaryTypographyProps={{ variant: 'body2' }} />
            </ListItemButton>
          </List>
        </Box>

        {/* Reviso component fills the remaining space */}
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <Reviso
            document={document}
            onChange={(doc) => console.log('onChange', doc)}
            onPageChange={(pageId) => console.log('onPageChange', pageId)}
            onSelectionChange={(regionId) => console.log('onSelectionChange', regionId)}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default RevisoDemo;
