import { useCallback } from 'react';
import { Box, Typography } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useDocumentStore } from '../../stores/documentStore';
import { useUiStore } from '../../stores/uiStore';

export const PageThumbnails: React.FC = () => {
  const activeDocumentId = useUiStore((s) => s.activeDocumentId);
  const activePageId = useUiStore((s) => s.activePageId);
  const setActivePage = useUiStore((s) => s.setActivePage);
  const activeDocument = useDocumentStore((s) =>
    s.getActiveDocument(activeDocumentId),
  );

  const handlePageClick = useCallback(
    (pageId: string) => {
      setActivePage(pageId);
    },
    [setActivePage],
  );

  if (!activeDocument) return null;

  return (
    <>
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
  );
};
