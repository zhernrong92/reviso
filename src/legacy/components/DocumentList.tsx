import { useCallback } from 'react';
import {
  Box,
  List,
  ListItemButton,
  ListItemText,
  Typography,
} from '@mui/material';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import { useDocumentStore } from '../../reviso/stores/documentStore';
import { useUiStore } from '../../reviso/stores/uiStore';

export const DocumentList: React.FC = () => {
  const documents = useDocumentStore((s) => s.documents);
  const activeDocumentId = useUiStore((s) => s.activeDocumentId);
  const setActiveDocument = useUiStore((s) => s.setActiveDocument);
  const setActivePage = useUiStore((s) => s.setActivePage);

  const handleDocumentClick = useCallback(
    (docId: string) => {
      setActiveDocument(docId);
      const doc = useDocumentStore.getState().getActiveDocument(docId);
      const firstPage = doc?.pages[0];
      if (firstPage) {
        setActivePage(firstPage.id);
      }
    },
    [setActiveDocument, setActivePage],
  );

  return (
    <>
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
    </>
  );
};
