import { useMemo } from 'react';
import { useDocumentStore } from '../../stores/documentStore';
import { useUiStore } from '../../stores/uiStore';
import { toPublicDocument } from '../../utils/typeMappers';
import { ExportDocumentDialog } from './ExportDocumentDialog';

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({ open, onClose }) => {
  const activeDocumentId = useUiStore((s) => s.activeDocumentId);
  const onExportCallback = useUiStore((s) => s.onExportCallback);
  const activeDocument = useDocumentStore((s) => s.getActiveDocument(activeDocumentId));

  const publicDoc = useMemo(
    () => (activeDocument ? toPublicDocument(activeDocument) : null),
    [activeDocument],
  );

  return (
    <ExportDocumentDialog
      open={open}
      onClose={onClose}
      document={publicDoc}
      onExport={onExportCallback ?? undefined}
    />
  );
};
