import { useCallback } from 'react';
import {
  Box,
  List,
  ListItemButton,
  ListItemText,
  Typography,
  Divider,
} from '@mui/material';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import { motion, AnimatePresence } from 'framer-motion';
import { useDocumentStore } from '../../stores/documentStore';
import { useUiStore } from '../../stores/uiStore';

const SIDEBAR_WIDTH = 280;

interface SidebarProps {
  open: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ open }) => {
  const documents = useDocumentStore((s) => s.documents);
  const activeDocumentId = useUiStore((s) => s.activeDocumentId);
  const activePageId = useUiStore((s) => s.activePageId);
  const setActiveDocument = useUiStore((s) => s.setActiveDocument);
  const setActivePage = useUiStore((s) => s.setActivePage);
  const activeDocument = useDocumentStore((s) => s.getActiveDocument(activeDocumentId));

  const handleDocumentClick = useCallback(
    (docId: string) => {
      setActiveDocument(docId);
      const doc = useDocumentStore.getState().getActiveDocument(docId);
      const firstPage = doc?.pages[0];
      if (firstPage) {
        setActivePage(firstPage.id);
      }
    },
    [setActiveDocument, setActivePage]
  );

  const handlePageClick = useCallback(
    (pageId: string) => {
      setActivePage(pageId);
    },
    [setActivePage]
  );

  return (
    <Box
      sx={{
        width: open ? SIDEBAR_WIDTH : 0,
        minWidth: open ? SIDEBAR_WIDTH : 0,
        overflow: 'hidden',
        transition: 'width 0.2s ease, min-width 0.2s ease',
        bgcolor: 'background.paper',
        borderRight: open ? 1 : 0,
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <Box sx={{ p: 2, pb: 1 }}>
        <Typography variant="overline" sx={{ color: 'text.secondary' }}>
          Documents
        </Typography>
      </Box>
      <List dense disablePadding>
        {documents.map((doc) => (
          <ListItemButton
            key={doc.id}
            selected={doc.id === activeDocumentId}
            onClick={() => handleDocumentClick(doc.id)}
            sx={{
              px: 2,
              '&.Mui-selected': {
                bgcolor: 'action.selected',
              },
            }}
          >
            <DescriptionOutlinedIcon
              sx={{ fontSize: 18, mr: 1.5, color: 'text.secondary' }}
            />
            <ListItemText
              primary={doc.name}
              primaryTypographyProps={{ variant: 'body2', noWrap: true }}
            />
          </ListItemButton>
        ))}
      </List>

      {activeDocument && (
        <>
          <Divider sx={{ my: 1 }} />
          <Box sx={{ p: 2, pb: 1 }}>
            <Typography variant="overline" sx={{ color: 'text.secondary' }}>
              Pages
            </Typography>
          </Box>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeDocumentId}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{ flex: 1, overflow: 'auto' }}
            >
              <Box sx={{ px: 1, pb: 1 }}>
                {activeDocument.pages.map((page) => (
                  <Box
                    key={page.id}
                    onClick={() => handlePageClick(page.id)}
                    sx={{
                      cursor: 'pointer',
                      border: 2,
                      borderColor:
                        page.id === activePageId ? 'primary.main' : 'transparent',
                      borderRadius: 1,
                      mb: 1,
                      overflow: 'hidden',
                      transition: 'border-color 0.15s ease',
                      '&:hover': {
                        borderColor:
                          page.id === activePageId
                            ? 'primary.main'
                            : 'action.hover',
                      },
                    }}
                  >
                    <Box
                      component="img"
                      src={page.imageSrc}
                      alt={`Page ${page.pageNumber}`}
                      sx={{
                        width: '100%',
                        height: 'auto',
                        display: 'block',
                        aspectRatio: `${page.width} / ${page.height}`,
                        objectFit: 'cover',
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        textAlign: 'center',
                        py: 0.5,
                        color:
                          page.id === activePageId
                            ? 'primary.main'
                            : 'text.secondary',
                      }}
                    >
                      Page {page.pageNumber}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </motion.div>
          </AnimatePresence>
        </>
      )}
    </Box>
  );
};
