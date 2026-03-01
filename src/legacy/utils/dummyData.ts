import type { Document, TextRegion } from '../../reviso/types/document';

const PAGE_WIDTH = 1200;
const PAGE_HEIGHT = 1600;

function generatePlaceholderSvg(
  docName: string,
  pageNum: number,
  bgColor: string,
  lineColor: string
): string {
  const lines: string[] = [];
  for (let y = 120; y < PAGE_HEIGHT - 100; y += 40) {
    const width = 600 + Math.floor(Math.random() * 400);
    lines.push(
      `<rect x="100" y="${y}" width="${width}" height="8" rx="4" fill="${lineColor}" opacity="0.15"/>`
    );
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${PAGE_WIDTH}" height="${PAGE_HEIGHT}" viewBox="0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}">
    <rect width="${PAGE_WIDTH}" height="${PAGE_HEIGHT}" fill="${bgColor}"/>
    <text x="100" y="80" font-family="serif" font-size="36" fill="${lineColor}" opacity="0.4">${docName} - Page ${pageNum}</text>
    ${lines.join('\n    ')}
  </svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function generateDamagedSvg(
  docName: string,
  pageNum: number,
  bgColor: string,
  lineColor: string
): string {
  // Seeded pseudo-random based on page number for consistency
  const seed = pageNum * 137 + docName.length * 31;
  const rand = (i: number) => ((seed * (i + 1) * 9301 + 49297) % 233280) / 233280;

  const lines: string[] = [];

  // Water stain circles
  for (let i = 0; i < 5; i++) {
    const cx = 200 + rand(i * 3) * 800;
    const cy = 200 + rand(i * 3 + 1) * 1200;
    const r = 80 + rand(i * 3 + 2) * 180;
    lines.push(
      `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#3a2510" opacity="${0.12 + rand(i) * 0.15}"/>`
    );
  }

  // Dark patches (rectangles)
  for (let i = 0; i < 3; i++) {
    const px = rand(i * 2 + 20) * 900;
    const py = rand(i * 2 + 21) * 1300;
    const pw = 150 + rand(i + 30) * 300;
    const ph = 100 + rand(i + 31) * 200;
    lines.push(
      `<rect x="${px}" y="${py}" width="${pw}" height="${ph}" fill="#1a0d00" opacity="${0.1 + rand(i + 40) * 0.12}" rx="20"/>`
    );
  }

  // Title text (faded)
  lines.push(
    `<text x="100" y="80" font-family="serif" font-size="36" fill="${lineColor}" opacity="0.2">${docName} - Page ${pageNum}</text>`
  );

  // Content lines — some missing or faded to simulate damage
  for (let y = 120; y < PAGE_HEIGHT - 100; y += 40) {
    const lineIdx = (y - 120) / 40;
    const skip = rand(lineIdx + 50) < 0.2; // 20% of lines missing
    if (skip) continue;
    const width = 600 + Math.floor(rand(lineIdx + 60) * 400);
    const opacity = 0.04 + rand(lineIdx + 70) * 0.08; // much fainter than clean version
    lines.push(
      `<rect x="100" y="${y}" width="${width}" height="8" rx="4" fill="${lineColor}" opacity="${opacity}"/>`
    );
  }

  // Edge darkening (vignette effect)
  lines.push(
    `<rect width="${PAGE_WIDTH}" height="${PAGE_HEIGHT}" fill="url(#damage-vignette)"/>`
  );

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${PAGE_WIDTH}" height="${PAGE_HEIGHT}" viewBox="0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}">
    <defs>
      <radialGradient id="damage-vignette" cx="50%" cy="50%" r="70%">
        <stop offset="0%" stop-color="transparent"/>
        <stop offset="100%" stop-color="#0a0500" stop-opacity="0.3"/>
      </radialGradient>
    </defs>
    <rect width="${PAGE_WIDTH}" height="${PAGE_HEIGHT}" fill="${bgColor}"/>
    ${lines.join('\n    ')}
  </svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function makeRegion(
  id: string,
  x1: number,
  y1: number,
  w: number,
  h: number,
  originalText: string,
  currentText: string,
  confidence: number
): TextRegion {
  return {
    id,
    x1,
    y1,
    x2: x1 + w,
    y2: y1 + h,
    originalText,
    currentText,
    isEdited: originalText !== currentText,
    isNew: false,
    confidence,
  };
}

function generateDoc1Regions(pageId: string, pageNum: number): TextRegion[] {
  const prefix = `${pageId}-r`;
  if (pageNum === 1) {
    return [
      makeRegion(`${prefix}01`, 100, 120, 500, 28, 'RESTORATION REPORT', 'RESTORATION REPORT', 0.99),
      makeRegion(`${prefix}02`, 100, 160, 300, 24, 'Date: March 1943', 'Date: March 1943', 0.97),
      makeRegion(`${prefix}03`, 100, 200, 700, 24, 'Tbe following docurnent has been restored from archives.', 'Tbe following docurnent has been restored from archives.', 0.42),
      makeRegion(`${prefix}04`, 100, 240, 650, 24, 'Original condition: severely darniged by water exposure.', 'Original condition: severely darniged by water exposure.', 0.38),
      makeRegion(`${prefix}05`, 100, 280, 600, 24, 'All text has been carefully transcrlbed from the source.', 'All text has been carefully transcrlbed from the source.', 0.45),
      makeRegion(`${prefix}06`, 100, 340, 720, 24, 'Section 1: Historical background of tbe artifact collection.', 'Section 1: Historical background of tbe artifact collection.', 0.51),
      makeRegion(`${prefix}07`, 100, 380, 680, 24, 'The museum acquired these iterns in the spring of 1938.', 'The museum acquired these iterns in the spring of 1938.', 0.48),
      makeRegion(`${prefix}08`, 100, 420, 710, 24, 'Professor Heinrich oversaw the cataloguing process.', 'Professor Heinrich oversaw the cataloguing process.', 0.95),
      makeRegion(`${prefix}09`, 100, 460, 640, 24, 'Each piece was photographed and given a unlque identifier.', 'Each piece was photographed and given a unlque identifier.', 0.52),
      makeRegion(`${prefix}10`, 100, 500, 690, 24, 'The col1ection includes manuscripts, letters, and maps.', 'The col1ection includes manuscripts, letters, and maps.', 0.44),
      makeRegion(`${prefix}11`, 100, 560, 720, 24, 'Section 2: Damage assessment and restoration priorities.', 'Section 2: Damage assessment and restoration priorities.', 0.93),
      makeRegion(`${prefix}12`, 100, 600, 670, 24, 'Water darnage affected approximately 60% of materiaIs.', 'Water darnage affected approximately 60% of materiaIs.', 0.39),
      makeRegion(`${prefix}13`, 100, 640, 700, 24, 'Ink degradation was observed on rnost handwritten pages.', 'Ink degradation was observed on rnost handwritten pages.', 0.41),
      makeRegion(`${prefix}14`, 100, 680, 650, 24, 'Priority 1evels were assigned based on historica1 value.', 'Priority 1evels were assigned based on historica1 value.', 0.36),
      makeRegion(`${prefix}15`, 100, 720, 690, 24, 'The rnost critical items were treated within the first week.', 'The rnost critical items were treated within the first week.', 0.43),
      makeRegion(`${prefix}16`, 100, 780, 500, 24, 'Section 3: Methodology notes.', 'Section 3: Methodology notes.', 0.96),
      makeRegion(`${prefix}17`, 100, 820, 710, 24, 'Standard conservation techniques were ernployed throughout.', 'Standard conservation techniques were ernployed throughout.', 0.47),
      makeRegion(`${prefix}18`, 100, 860, 680, 24, 'Chemical analysis confirmed the paper dates to the l940s.', 'Chemical analysis confirmed the paper dates to the l940s.', 0.40),
      makeRegion(`${prefix}19`, 100, 900, 650, 24, 'No further deterioration is expected if stored properIy.', 'No further deterioration is expected if stored properIy.', 0.50),
      makeRegion(`${prefix}20`, 100, 940, 400, 24, 'Report prepared by Dr. M. Weber', 'Report prepared by Dr. M. Weber', 0.94),
    ];
  }
  if (pageNum === 2) {
    return [
      makeRegion(`${prefix}01`, 100, 120, 600, 28, 'APPENDIX A: Catalog of Restored lterns', 'APPENDIX A: Catalog of Restored lterns', 0.46),
      makeRegion(`${prefix}02`, 100, 170, 300, 24, 'Item 001 — Manuscript', 'Item 001 — Manuscript', 0.98),
      makeRegion(`${prefix}03`, 100, 210, 650, 24, 'Origin: Bavarian State Library, circa l9l2.', 'Origin: Bavarian State Library, circa l9l2.', 0.35),
      makeRegion(`${prefix}04`, 100, 250, 700, 24, 'Condition: Moderate water staining, text 1egible.', 'Condition: Moderate water staining, text 1egible.', 0.42),
      makeRegion(`${prefix}05`, 100, 290, 670, 24, 'Restoration: Cleaned, deacidified, rebound.', 'Restoration: Cleaned, deacidified, rebound.', 0.91),
      makeRegion(`${prefix}06`, 100, 350, 300, 24, 'Item 002 — Letter', 'Item 002 — Letter', 0.97),
      makeRegion(`${prefix}07`, 100, 390, 680, 24, 'Author: Unknown, addressed to Prof. K1ein.', 'Author: Unknown, addressed to Prof. K1ein.', 0.44),
      makeRegion(`${prefix}08`, 100, 430, 690, 24, 'Date on letter: Decernber 1917. Ink partially faded.', 'Date on letter: Decernber 1917. Ink partially faded.', 0.40),
      makeRegion(`${prefix}09`, 100, 470, 660, 24, 'Content discusses expedition findings in northem Africa.', 'Content discusses expedition findings in northem Africa.', 0.49),
      makeRegion(`${prefix}10`, 100, 510, 700, 24, 'References to artifacts now he1d in the British Museum.', 'References to artifacts now he1d in the British Museum.', 0.38),
      makeRegion(`${prefix}11`, 100, 570, 300, 24, 'Item 003 — Map', 'Item 003 — Map', 0.96),
      makeRegion(`${prefix}12`, 100, 610, 710, 24, 'Region: Eastern Mediterranean, hand-drawn on ve11um.', 'Region: Eastern Mediterranean, hand-drawn on ve11um.', 0.37),
      makeRegion(`${prefix}13`, 100, 650, 680, 24, 'Several place narnes are illegible due to fold damage.', 'Several place narnes are illegible due to fold damage.', 0.43),
      makeRegion(`${prefix}14`, 100, 690, 650, 24, 'Restoration: Flattened, infil1ed torn sections.', 'Restoration: Flattened, infil1ed torn sections.', 0.41),
      makeRegion(`${prefix}15`, 100, 730, 700, 24, 'Digital scan cornpleted at 600 DPI resolution.', 'Digital scan cornpleted at 600 DPI resolution.', 0.45),
      makeRegion(`${prefix}16`, 100, 790, 300, 24, 'Item 004 — Notebook', 'Item 004 — Notebook', 0.95),
      makeRegion(`${prefix}17`, 100, 830, 670, 24, 'Field notes frorn the 1923 archaeological survey.', 'Field notes frorn the 1923 archaeological survey.', 0.39),
      makeRegion(`${prefix}18`, 100, 870, 700, 24, 'Contains sketches of pottery fragments and too1s.', 'Contains sketches of pottery fragments and too1s.', 0.42),
      makeRegion(`${prefix}19`, 100, 910, 680, 24, 'Author identified as Dr. Franz Meier via handwriting.', 'Author identified as Dr. Franz Meier via handwriting.', 0.92),
      makeRegion(`${prefix}20`, 100, 950, 400, 24, 'End of Appendix A', 'End of Appendix A', 0.99),
    ];
  }
  // Page 3
  return [
    makeRegion(`${prefix}01`, 100, 120, 500, 28, 'APPENDIX B: Photographic Record', 'APPENDIX B: Photographic Record', 0.94),
    makeRegion(`${prefix}02`, 100, 170, 700, 24, 'A11 photographs were taken under controlled lighting.', 'A11 photographs were taken under controlled lighting.', 0.40),
    makeRegion(`${prefix}03`, 100, 210, 680, 24, 'Camera: Leica M3 with 50rnrn Surnmicron lens.', 'Camera: Leica M3 with 50rnrn Surnmicron lens.', 0.33),
    makeRegion(`${prefix}04`, 100, 250, 650, 24, 'Film: llford HP5 Plus, developed in Rodina1.', 'Film: llford HP5 Plus, developed in Rodina1.', 0.35),
    makeRegion(`${prefix}05`, 100, 290, 700, 24, 'Each item was photographed before and after restoration.', 'Each item was photographed before and after restoration.', 0.93),
    makeRegion(`${prefix}06`, 100, 350, 720, 24, 'Photo 001: Manuscript front cover, showing water stains.', 'Photo 001: Manuscript front cover, showing water stains.', 0.90),
    makeRegion(`${prefix}07`, 100, 390, 680, 24, 'Photo 002: Manuscript page 12, severe ink b1eeding.', 'Photo 002: Manuscript page 12, severe ink b1eeding.', 0.41),
    makeRegion(`${prefix}08`, 100, 430, 700, 24, 'Photo 003: Letter, fu11 view with UV fluorescence.', 'Photo 003: Letter, fu11 view with UV fluorescence.', 0.38),
    makeRegion(`${prefix}09`, 100, 470, 660, 24, 'Photo 004: Map detail, northem coastline section.', 'Photo 004: Map detail, northem coastline section.', 0.47),
    makeRegion(`${prefix}10`, 100, 510, 700, 24, 'Photo 005: Notebook, pages 3-4 spread with sketches.', 'Photo 005: Notebook, pages 3-4 spread with sketches.', 0.91),
    makeRegion(`${prefix}11`, 100, 570, 720, 24, 'All negatives are stored in acid-free sleeves.', 'All negatives are stored in acid-free sleeves.', 0.96),
    makeRegion(`${prefix}12`, 100, 610, 680, 24, 'Digital copies have been uploaded to the centra1 archive.', 'Digital copies have been uploaded to the centra1 archive.', 0.44),
    makeRegion(`${prefix}13`, 100, 650, 650, 24, 'Access restricted to authorized personne1 only.', 'Access restricted to authorized personne1 only.', 0.46),
    makeRegion(`${prefix}14`, 100, 690, 700, 24, 'For inquiries, contact the Restoration Departrnent.', 'For inquiries, contact the Restoration Departrnent.', 0.43),
    makeRegion(`${prefix}15`, 100, 750, 500, 24, 'Document classification: CONF1DENTIAL', 'Document classification: CONF1DENTIAL', 0.37),
    makeRegion(`${prefix}16`, 100, 790, 650, 24, 'This report rnay not be reproduced without permission.', 'This report rnay not be reproduced without permission.', 0.40),
    makeRegion(`${prefix}17`, 100, 830, 680, 24, 'Signed: Dr. M. Weber, Head of Restoration.', 'Signed: Dr. M. Weber, Head of Restoration.', 0.95),
    makeRegion(`${prefix}18`, 100, 870, 500, 24, 'Date: 15 March 1943', 'Date: 15 March 1943', 0.97),
    makeRegion(`${prefix}19`, 100, 910, 600, 24, 'Archive reference: REST-1943-00l-WEBER', 'Archive reference: REST-1943-00l-WEBER', 0.39),
    makeRegion(`${prefix}20`, 100, 950, 300, 24, '— END OF REPORT —', '— END OF REPORT —', 0.99),
  ];
}

function generateDoc2Regions(pageId: string, pageNum: number): TextRegion[] {
  const prefix = `${pageId}-r`;
  if (pageNum === 1) {
    return [
      makeRegion(`${prefix}01`, 100, 120, 400, 28, 'Personal Correspondence', 'Personal Correspondence', 0.93),
      makeRegion(`${prefix}02`, 100, 170, 350, 24, '14th November, 1917', '14th November, 1917', 0.88),
      makeRegion(`${prefix}03`, 100, 230, 300, 24, 'My Dearest Clara,', 'My Dearest Clara,', 0.92),
      makeRegion(`${prefix}04`, 100, 280, 700, 24, 'I write to you frorn the field station near Verdun.', 'I write to you frorn the field station near Verdun.', 0.45),
      makeRegion(`${prefix}05`, 100, 320, 680, 24, 'The weather has turned bitterly co1d this past week.', 'The weather has turned bitterly co1d this past week.', 0.42),
      makeRegion(`${prefix}06`, 100, 360, 720, 24, 'We received your parce1 — the socks are most welcome.', 'We received your parce1 — the socks are most welcome.', 0.40),
      makeRegion(`${prefix}07`, 100, 400, 670, 24, 'Mora1e among the men rernains steady, though tired.', 'Mora1e among the men rernains steady, though tired.', 0.37),
      makeRegion(`${prefix}08`, 100, 440, 700, 24, 'I have been reading the book you sent — Thornas Mann.', 'I have been reading the book you sent — Thornas Mann.', 0.44),
      makeRegion(`${prefix}09`, 100, 480, 690, 24, 'It provides a welcorne escape from daily routlne.', 'It provides a welcorne escape from daily routlne.', 0.39),
      makeRegion(`${prefix}10`, 100, 540, 710, 24, 'Tell Father that his advice about the 1and was sound.', 'Tell Father that his advice about the 1and was sound.', 0.41),
      makeRegion(`${prefix}11`, 100, 580, 680, 24, 'When this is over, I intend to plant the south fie1d.', 'When this is over, I intend to plant the south fie1d.', 0.43),
      makeRegion(`${prefix}12`, 100, 620, 700, 24, 'The soil there is rich, as he a1ways said it was.', 'The soil there is rich, as he a1ways said it was.', 0.38),
      makeRegion(`${prefix}13`, 100, 680, 720, 24, 'I think of you and the chi1dren every evening.', 'I think of you and the chi1dren every evening.', 0.40),
      makeRegion(`${prefix}14`, 100, 720, 670, 24, 'Kiss little Hans and Te11 Erna I miss her songs.', 'Kiss little Hans and Te11 Erna I miss her songs.', 0.36),
      makeRegion(`${prefix}15`, 100, 760, 690, 24, 'With God\'s grace, I sha11 be home by spring.', 'With God\'s grace, I sha11 be home by spring.', 0.42),
      makeRegion(`${prefix}16`, 100, 820, 400, 24, 'Your loving husband,', 'Your loving husband,', 0.95),
      makeRegion(`${prefix}17`, 100, 860, 250, 24, 'Friedrich', 'Friedrich', 0.90),
      makeRegion(`${prefix}18`, 100, 920, 650, 24, 'P.S. — I enc1ose a pressed flower from the meadow.', 'P.S. — I enc1ose a pressed flower from the meadow.', 0.41),
      makeRegion(`${prefix}19`, 100, 960, 700, 24, 'It survived the journey better than rnost things here.', 'It survived the journey better than rnost things here.', 0.39),
      makeRegion(`${prefix}20`, 100, 1000, 500, 24, '[Censor stamp partially obscures text]', '[Censor stamp partially obscures text]', 0.30),
    ];
  }
  // Page 2
  return [
    makeRegion(`${prefix}01`, 100, 120, 400, 28, 'Reply Correspondence', 'Reply Correspondence', 0.91),
    makeRegion(`${prefix}02`, 100, 170, 350, 24, '3rd Decernber, 1917', '3rd Decernber, 1917', 0.43),
    makeRegion(`${prefix}03`, 100, 230, 300, 24, 'My Dear Friedrich,', 'My Dear Friedrich,', 0.94),
    makeRegion(`${prefix}04`, 100, 280, 700, 24, 'Your letter arrived this rnorning and brought great joy.', 'Your letter arrived this rnorning and brought great joy.', 0.41),
    makeRegion(`${prefix}05`, 100, 320, 680, 24, 'Hans has grown so ta11 — you will not recognise hirn.', 'Hans has grown so ta11 — you will not recognise hirn.', 0.35),
    makeRegion(`${prefix}06`, 100, 360, 720, 24, 'Erna sings the carol you taught her, every evening.', 'Erna sings the carol you taught her, every evening.', 0.92),
    makeRegion(`${prefix}07`, 100, 400, 670, 24, 'Father says the south fie1d will yield we11 next year.', 'Father says the south fie1d will yield we11 next year.', 0.38),
    makeRegion(`${prefix}08`, 100, 440, 700, 24, 'He has been preparing the soi1 despite the cold.', 'He has been preparing the soi1 despite the cold.', 0.40),
    makeRegion(`${prefix}09`, 100, 480, 690, 24, 'I arn sending another parcel with preserves and wool.', 'I arn sending another parcel with preserves and wool.', 0.42),
    makeRegion(`${prefix}10`, 100, 540, 710, 24, 'The vi11age church held a service for the soldiers.', 'The vi11age church held a service for the soldiers.', 0.39),
    makeRegion(`${prefix}11`, 100, 580, 680, 24, 'Everyone prays for your safe retum, as do I.', 'Everyone prays for your safe retum, as do I.', 0.37),
    makeRegion(`${prefix}12`, 100, 620, 700, 24, 'The pressed f1ower is beautiful — I keep it in your book.', 'The pressed f1ower is beautiful — I keep it in your book.', 0.41),
    makeRegion(`${prefix}13`, 100, 680, 720, 24, 'Please keep warm and stay safe, rny dearest.', 'Please keep warm and stay safe, rny dearest.', 0.40),
    makeRegion(`${prefix}14`, 100, 720, 670, 24, 'We will wait for you, however 1ong it takes.', 'We will wait for you, however 1ong it takes.', 0.43),
    makeRegion(`${prefix}15`, 100, 760, 690, 24, 'Spring wi11 come, and so will you.', 'Spring wi11 come, and so will you.', 0.38),
    makeRegion(`${prefix}16`, 100, 820, 400, 24, 'With all rny love,', 'With all rny love,', 0.41),
    makeRegion(`${prefix}17`, 100, 860, 200, 24, 'Clara', 'Clara', 0.96),
    makeRegion(`${prefix}18`, 100, 920, 650, 24, 'P.S. — The dog rnisses you terribly. He waits by the gate.', 'P.S. — The dog rnisses you terribly. He waits by the gate.', 0.39),
    makeRegion(`${prefix}19`, 100, 960, 600, 24, '[Water darnage obscures several words here]', '[Water darnage obscures several words here]', 0.31),
    makeRegion(`${prefix}20`, 100, 1000, 500, 24, '[Page torn — rernaining text lost]', '[Page torn — rernaining text lost]', 0.29),
  ];
}

export function createDummyDocuments(): Document[] {
  const doc1Pages = [1, 2, 3].map((pageNum) => {
    const pageId = `doc1-page${pageNum}`;
    return {
      id: pageId,
      documentId: 'doc1',
      pageNumber: pageNum,
      imageSrc: generatePlaceholderSvg(
        'Restoration Report 1943',
        pageNum,
        '#1a1510',
        '#c4a97d'
      ),
      originalImageSrc: generateDamagedSvg(
        'Restoration Report 1943',
        pageNum,
        '#1a1510',
        '#c4a97d'
      ),
      width: PAGE_WIDTH,
      height: PAGE_HEIGHT,
      regions: generateDoc1Regions(pageId, pageNum),
    };
  });

  const doc2Pages = [1, 2].map((pageNum) => {
    const pageId = `doc2-page${pageNum}`;
    return {
      id: pageId,
      documentId: 'doc2',
      pageNumber: pageNum,
      imageSrc: generatePlaceholderSvg(
        'Archive Letter 1917',
        pageNum,
        '#151a18',
        '#9db8a8'
      ),
      originalImageSrc: generateDamagedSvg(
        'Archive Letter 1917',
        pageNum,
        '#151a18',
        '#9db8a8'
      ),
      width: PAGE_WIDTH,
      height: PAGE_HEIGHT,
      regions: generateDoc2Regions(pageId, pageNum),
    };
  });

  return [
    {
      id: 'doc1',
      name: 'Restoration Report 1943',
      pageCount: 3,
      pages: doc1Pages,
    },
    {
      id: 'doc2',
      name: 'Archive Letter 1917',
      pageCount: 2,
      pages: doc2Pages,
    },
  ];
}
