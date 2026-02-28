import { useEffect } from 'react';
import { AppShell } from './components/layout/AppShell';
import { useDocumentStore } from './stores/documentStore';
import { useUiStore } from './stores/uiStore';
import { parsePdf } from './utils/parsePdf';
import { parseUploadedJson } from './utils/parseUploadedJson';
import type { Document, TextRegion } from './types/document';

function createPngDocument(width: number, height: number): Document {
  return {
    id: 'png-sample',
    name: 'Sample Receipt',
    pageCount: 1,
    pages: [
      {
        id: 'png-sample-p1',
        documentId: 'png-sample',
        pageNumber: 1,
        imageSrc: '/sample-receipt.png',
        originalImageSrc: '/sample-receipt.png',
        width,
        height,
        regions: [],
      },
    ],
  };
}

function loadImageDimensions(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

const App: React.FC = () => {
  const loadDocuments = useDocumentStore((s) => s.loadDocuments);
  const setActiveDocument = useUiStore((s) => s.setActiveDocument);
  const setActivePage = useUiStore((s) => s.setActivePage);

  useEffect(() => {
    async function loadDefaults() {
      const allDocs: Document[] = [];

      // Load sample PDF + merge dummy regions
      try {
        const [pdfResponse, regionsResponse] = await Promise.all([
          fetch('/sample-doc.pdf'),
          fetch('/sample-pdf-regions.json'),
        ]);
        const blob = await pdfResponse.blob();
        const file = new File([blob], 'Sample PDF Document.pdf', { type: 'application/pdf' });
        const pdfDocs = await parsePdf(file);

        // Merge regions from JSON into rendered PDF pages
        if (regionsResponse.ok) {
          const regionsJson = await regionsResponse.text();
          const regionDocs = parseUploadedJson(regionsJson);
          const regionPages = regionDocs[0]?.pages ?? [];
          const regionsByPage = new Map<number, TextRegion[]>();
          for (const rp of regionPages) {
            regionsByPage.set(rp.pageNumber, rp.regions);
          }

          const pdfDoc = pdfDocs[0];
          if (pdfDoc) {
            for (const page of pdfDoc.pages) {
              const regions = regionsByPage.get(page.pageNumber);
              if (regions) page.regions = regions;
            }
          }
        }

        allDocs.push(...pdfDocs);
      } catch {
        // PDF load failed — continue without it
      }

      // Load sample PNG
      try {
        const { width, height } = await loadImageDimensions('/sample-receipt.png');
        allDocs.push(createPngDocument(width, height));
      } catch {
        // PNG load failed — continue without it
      }

      if (allDocs.length > 0) {
        loadDocuments(allDocs);
        const firstDoc = allDocs[0]!;
        setActiveDocument(firstDoc.id);
        const firstPage = firstDoc.pages[0];
        if (firstPage) setActivePage(firstPage.id);
      }
    }

    loadDefaults();
  }, [loadDocuments, setActiveDocument, setActivePage]);

  return <AppShell />;
};

export default App;
