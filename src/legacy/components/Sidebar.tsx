import { Box, Divider } from '@mui/material';
import { useDocumentStore } from '../../reviso/stores/documentStore';
import { useUiStore } from '../../reviso/stores/uiStore';
import { DocumentList } from './DocumentList';
import { PageThumbnails } from '../../reviso/components/layout/PageThumbnails';

const SIDEBAR_WIDTH = 280;

interface SidebarProps {
  open: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ open }) => {
  const activeDocumentId = useUiStore((s) => s.activeDocumentId);
  const activeDocument = useDocumentStore((s) =>
    s.getActiveDocument(activeDocumentId),
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
      <DocumentList />
      {activeDocument && (
        <>
          <Divider sx={{ my: 1 }} />
          <PageThumbnails />
        </>
      )}
    </Box>
  );
};
