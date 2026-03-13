import {
  Dialog,
  DialogTitle,
  DialogContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useUiStore } from '../../stores/uiStore';

const Key = styled('kbd')(({ theme }) => ({
  display: 'inline-block',
  padding: '2px 6px',
  fontSize: '0.75rem',
  fontFamily: 'monospace',
  lineHeight: 1.4,
  color: theme.palette.text.primary,
  backgroundColor: theme.palette.action.hover,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 4,
}));

interface Shortcut {
  keys: string;
  description: string;
}

const shortcuts: Shortcut[] = [
  { keys: '← / →', description: 'Previous / Next page' },
  { keys: 'PageUp / PageDown', description: 'Previous / Next page' },
  { keys: 'Ctrl+↑ / Ctrl+↓', description: 'Previous / Next document' },
  { keys: 'Ctrl+E', description: 'Toggle Edit / Preview mode' },
  { keys: 'Ctrl+Z', description: 'Undo' },
  { keys: 'Ctrl+Shift+Z', description: 'Redo' },
  { keys: 'N', description: 'Toggle create mode' },
  { keys: 'Escape', description: 'Deselect / exit create mode' },
  { keys: 'Delete', description: 'Delete selected region' },
  { keys: 'Tab / Shift+Tab', description: 'Next / Previous region' },
  { keys: 'Enter', description: 'Confirm edit' },
  { keys: '?', description: 'Show this help' },
];

export const KeyboardHelpDialog: React.FC = () => {
  const open = useUiStore((s) => s.helpDialogOpen);
  const setOpen = useUiStore((s) => s.setHelpDialogOpen);

  return (
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: { bgcolor: 'background.paper' },
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h6" component="span">
          Keyboard Shortcuts
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, width: '45%' }}>Shortcut</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {shortcuts.map((s) => (
              <TableRow key={s.keys}>
                <TableCell>
                  {s.keys.split(' / ').map((k, i) => (
                    <span key={k}>
                      {i > 0 && ' / '}
                      <Key>{k.trim()}</Key>
                    </span>
                  ))}
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{s.description}</Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  );
};
