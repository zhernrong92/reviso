import { Box } from '@mui/material';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { DocumentViewer } from '../viewer/DocumentViewer';
import { ComparisonSlider } from '../comparison/ComparisonSlider';
import { KeyboardHelpDialog } from '../common/KeyboardHelpDialog';
import { useUiStore } from '../../stores/uiStore';
import { useNavigationKeyboard } from '../../hooks/useNavigationKeyboard';

export const AppShell: React.FC = () => {
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const viewMode = useUiStore((s) => s.viewMode);
  useNavigationKeyboard();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <TopBar />
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar open={sidebarOpen} />
        {viewMode === 'edit' ? <DocumentViewer /> : <ComparisonSlider />}
      </Box>
      <KeyboardHelpDialog />
    </Box>
  );
};
