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
  const activePageId = useUiStore((s) => s.activePageId);
  const onExportCallback = useUiStore((s) => s.onExportCallback);
  const activeDocument = useDocumentStore((s) => s.getActiveDocument(activeDocumentId));

  const publicDoc = useMemo(
    () => (activeDocument ? toPublicDocument(activeDocument) : null),
    [activeDocument],
  );

  const activePageNumber = useMemo(() => {
    if (!activeDocument || !activePageId) return undefined;
    const page = activeDocument.pages.find((p) => p.id === activePageId);
    return page?.pageNumber;
  }, [activeDocument, activePageId]);

  return (
    <ExportDocumentDialog
      open={open}
      onClose={onClose}
      document={publicDoc}
      activePageNumber={activePageNumber}
      onExport={onExportCallback ?? undefined}
    />
  );
};
