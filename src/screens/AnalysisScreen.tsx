import { useState, useEffect, useRef } from 'react'
import NavBar from '../components/NavBar'
import PdfPageCanvas from '../components/PdfPageCanvas'
import { C } from '../colors'
import type { Screen } from '../App'
import { AlertTriangle, ArrowRight, Maximize2, Home, Loader2 } from 'lucide-react'

type Props = {
  onNavigate: (s: Screen) => void;
  previousScreen?: Screen;
  lrfFlowActive?: boolean;
  documentType?: 'label' | 'ifu';
  bulkMode?: boolean;
  masterFilename: string;
  revisedFilename: string;
  historyPreview?: boolean;
}

type BBox = { x: number; y: number; w: number; h: number }

type IfuCategory =
  | 'change'
  | 'deletion'
  | 'insertion'
  | 'case'
  | 'hyphen'
  | 'line-break'
  | 'size'
  | 'bold'
  | 'italic'
  | 'font-type'
  | 'underline'

type Finding = {
  id: string
  type: 'text' | 'graphics' | 'barcode' | IfuCategory
  summary: string
  masterHad: string
  revisedHas: string
  classification?: 'Expected' | 'Unexpected'
  page?: number
  master: BBox
  revised: BBox
}

// Findings for additional changes master.pdf vs revised.pdf
const findings: Finding[] = [
  {
    id: 'G1',
    type: 'graphics',
    summary: "replaced 'ec' → 'eu'",
    masterHad: 'EC Rep',
    revisedHas: 'EU Rep',
    classification: 'Expected',
    master: { x: 272, y: 92, w: 238, h: 132 },
    revised: { x: 272, y: 92, w: 238, h: 132 }
  },
  {
    id: 'T1',
    type: 'text',
    summary: "replaced 'medosinternational sarl chemin-blanc38 2400lelocle,switzerland' → '1302wrights lane east, westchester,pa19380, usa(craniomaxillofacial)'",
    masterHad: '2026-01-22 MedosInternational SARL Chemin-Blanc38 2400 Le Locle, Switzerland',
    revisedHas: '2026-01-22 1302 Wrights Lane East, West Westchester, PA 19380, USA (Craniomaxillofacial)',
    classification: 'Expected',
    master: { x: 55, y: 250, w: 402, h: 145 },
    revised: { x: 55, y: 250, w: 402, h: 145 }
  },
  {
    id: 'T2',
    type: 'text',
    summary: "replaced 'depuysynthes' → 'depuy synthes'",
    masterHad: 'DePuySynthes',
    revisedHas: 'DePuy Synthes',
    classification: 'Expected',
    master: { x: 240, y: 118, w: 92, h: 18 },
    revised: { x: 240, y: 118, w: 92, h: 18 }
  },
  {
    id: 'T3',
    type: 'text',
    summary: "replaced 'rev.a' → 'rev.b'",
    masterHad: 'REV.A',
    revisedHas: 'REV.B',
    classification: 'Unexpected',
    master: { x: 353, y: 478, w: 60, h: 18 },
    revised: { x: 353, y: 478, w: 60, h: 18 }
  },
  {
    id: 'T4',
    type: 'text',
    summary: "replaced '//www.e-ifu.com/symbols-glossary' → '//www.e-depuysynthes-ifu.com/symbols-glossary'",
    masterHad: 'www.e-ifu.com',
    revisedHas: 'www.e-depuysynthes-ifu.com',
    classification: 'Expected',
    master: { x: 68, y: 310, w: 188, h: 16 },
    revised: { x: 68, y: 310, w: 188, h: 16 }
  },
  {
    id: 'T5',
    type: 'text',
    summary: "replaced 'medosinternational sarl chemin-blanc38 2400lelocle,switzerland' → '1302wrights lane east, westchester,pa19380, usa(craniomaxillofacial)'",
    masterHad: '2026-01-22 MedosInternational SARL Chemin-Blanc38 2400 Le Locle, Switzerland',
    revisedHas: '2026-01-22 1302 Wrights Lane East, West Westchester, PA 19380, USA (Craniomaxillofacial)',
    classification: 'Expected',
    master: { x: 55, y: 250, w: 402, h: 145 },
    revised: { x: 55, y: 250, w: 402, h: 145 }
  },
  {
    id: 'T6',
    type: 'text',
    summary: "replaced 'belgium' → 'usa'",
    masterHad: 'Belguim',
    revisedHas: 'USA',
    classification: 'Unexpected',
    master: { x: 148, y: 498, w: 74, h: 16 },
    revised: { x: 148, y: 498, w: 74, h: 16 }
  },
  {
    id: 'T7',
    type: 'text',
    summary: "replaced 'rev.a' → 'rev.b'",
    masterHad: 'REV.A',
    revisedHas: 'REV.B',
    classification: 'Unexpected',
    master: { x: 353, y: 478, w: 60, h: 18 },
    revised: { x: 353, y: 478, w: 60, h: 18 }
  }
]

// Findings for Master.pdf vs Revised.pdf (from user screenshot)
const newFindingsList: Finding[] = [
  {
    id: 'T1',
    type: 'text',
    summary: "replaced 'medosinternational sarl chemin-blanc38 2400 le locle,switzerland' → '1302wrightslaneeast, westchester,pa19380, usa(craniomaxillofacial)'",
    masterHad: '2026-01-22 MedosInternational SARL Chemin-Blanc38 2400 Le Locle, Switzerland',
    revisedHas: '2020-01-22 1302WrightsLaneEast, WestChester,PA19380, USACraniomaxillofacial',
    classification: 'Expected',
    master: { x: 55, y: 250, w: 402, h: 145 },
    revised: { x: 55, y: 250, w: 402, h: 145 }
  },
  {
    id: 'T2',
    type: 'text',
    summary: "replaced 'depuysynthes' → 'depuy synthes'",
    masterHad: 'DePuySynthes',
    revisedHas: 'DePuy Synthes',
    classification: 'Expected',
    master: { x: 240, y: 118, w: 92, h: 18 },
    revised: { x: 240, y: 118, w: 92, h: 18 }
  },
  {
    id: 'T3',
    type: 'text',
    summary: "replaced '//www.e-ifu.com/symbols-glossary' → '//www.e-depuysynthes-ifu.com/symbols-glossary'",
    masterHad: '//www.e-ifu.com/symbols-glossary',
    revisedHas: '//www.e-depuysynthes-ifu.com/symbols-glossary',
    classification: 'Expected',
    master: { x: 68, y: 310, w: 188, h: 16 },
    revised: { x: 68, y: 310, w: 188, h: 16 }
  },
  {
    id: 'T4',
    type: 'text',
    summary: "replaced 'medosinternationalsarl chemin-blanc38 2400lelocle,switzerland' → '1302wrights lane east, westchester,pa19380, usa(craniomaxillofacial)'",
    masterHad: 'MedosInternationalSARL Chemin-Blanc38 2400LeLocle,Switzerland',
    revisedHas: '1302Wrights Lane East, WestChester,PA19380, USA(Craniomaxillofacial)',
    classification: 'Expected',
    master: { x: 55, y: 250, w: 402, h: 145 },
    revised: { x: 55, y: 250, w: 402, h: 145 }
  },
  {
    id: 'G1',
    type: 'graphics',
    summary: "replaced 'ec' → 'eu'",
    masterHad: 'EC REP',
    revisedHas: 'EU REP',
    classification: 'Expected',
    master: { x: 488, y: 183, w: 80, h: 44 },
    revised: { x: 488, y: 183, w: 80, h: 44 }
  }
]

const typeColors: Record<string, { bg: string; text: string; color: string }> = {
  text: { bg: '#EFF6FF', text: '#1E40AF', color: '#378ADD' },
  graphics: { bg: '#FEF2F2', text: '#991B1B', color: '#DC2626' },
  barcode: { bg: '#FFFBEB', text: '#92400E', color: '#BA7517' },
  change: { bg: '#EEF2FF', text: '#3730A3', color: '#6366F1' },
  deletion: { bg: '#FEF2F2', text: '#991B1B', color: '#DC2626' },
  insertion: { bg: '#ECFDF5', text: '#065F46', color: '#10B981' },
  case: { bg: '#FFFBEB', text: '#92400E', color: '#D97706' },
  hyphen: { bg: '#F0F9FF', text: '#075985', color: '#0EA5E9' },
  'line-break': { bg: '#FDF4FF', text: '#86198F', color: '#C026D3' },
  size: { bg: '#FFF7ED', text: '#9A3412', color: '#EA580C' },
  bold: { bg: '#F5F3FF', text: '#5B21B6', color: '#7C3AED' },
  italic: { bg: '#ECFEFF', text: '#155E75', color: '#06B6D4' },
  'font-type': { bg: '#FEF2F8', text: '#9D174D', color: '#DB2777' },
  underline: { bg: '#F0FDF4', text: '#166534', color: '#16A34A' },
}

// IFU document-comparison categories (no bulk upload / sidebar for this flow)
const IFU_CATEGORIES: { id: IfuCategory; label: string }[] = [
  { id: 'change', label: 'Change' },
  { id: 'deletion', label: 'Deletion' },
  { id: 'insertion', label: 'Insertion' },
  { id: 'case', label: 'Case' },
  { id: 'hyphen', label: 'Hyphen' },
  { id: 'line-break', label: 'Line Break (Space)' },
  { id: 'size', label: 'Size' },
  { id: 'bold', label: 'Bold' },
  { id: 'italic', label: 'Italic' },
  { id: 'font-type', label: 'Font Type' },
  { id: 'underline', label: 'Underline' },
]

// Findings parsed from the IFU Proofreading Report (IFU-149990B_test.pdf vs IFU-149990C_test.pdf)
const ifuFindings: Finding[] = [
  {
    id: 'I1',
    type: 'change',
    summary: 'Change: Complete each procedure: Preparation for Cleaning, Manual Cleaning or Automated Cleaning,…',
    masterHad: 'Complete each procedure: Preparation for Cleaning, Manual Cleaning or Automated Cleaning, Disinfection and Sterilization when reprocessing the instruments.',
    revisedHas: 'Complete each procedure: Preparation preparation for Cleaning, cleaning, Manual manual Cleaning cleaning or Automated automated Cleaning, cleaning, Disinfection disinfection, and Sterilization sterilization when reprocessing the instruments.',
    page: 1,
    master: { x: 17, y: 57, w: 181, h: 40 },
    revised: { x: 19, y: 39, w: 204, h: 27 }
  },
  {
    id: 'I2',
    type: 'change',
    summary: 'Change: Wear appropriate protective equipment (gloves, eye protection, etc.) when reprocessing an…',
    masterHad: 'Wear appropriate protective equipment (gloves, eye protection, etc.) when reprocessing any medical device.',
    revisedHas: 'Wear appropriate protective equipment (gloves, eye/eve protection, etc.) when reprocessing any medical device.',
    page: 1,
    master: { x: 17, y: 75, w: 181, h: 40 },
    revised: { x: 19, y: 51, w: 204, h: 27 }
  },
  {
    id: 'I3',
    type: 'change',
    summary: 'Change: Point of Use Care The drying of gross soil (blood, tissue and/or debris) on devices follo…',
    masterHad: 'Point of Use Care The drying of gross soil (blood, tissue and/or debris) on devices following surgical use should be avoided.',
    revisedHas: 'Point of Use Care The drying of gross soil (blood, tissue and/or debris) on devices following surgical use should be avoided. (bullet marker removed)',
    page: 1,
    master: { x: 17, y: 93, w: 181, h: 40 },
    revised: { x: 19, y: 64, w: 204, h: 27 }
  },
  {
    id: 'I4',
    type: 'change',
    summary: 'Change: Do not use saline, environmental disinfection (including chlorine solutions) or surgical…',
    masterHad: 'Do not use saline, environmental disinfection (including chlorine solutions) or surgical antiseptics (such as iodine- or chlorhexidine-containing products.)',
    revisedHas: 'Do not use saline, environmental disinfection (including chlorine solutions) or surgical antiseptics (such as iodine- or chlorhexidine-containing products).',
    page: 1,
    master: { x: 17, y: 112, w: 181, h: 40 },
    revised: { x: 19, y: 76, w: 204, h: 27 }
  },
  {
    id: 'I5',
    type: 'change',
    summary: 'Change: Flush all lumens, blind holes small clearances, and moving and intricate parts with water…',
    masterHad: 'Flush all lumens, blind holes small clearances, and moving and intricate parts with water (or detergent solution) to prevent the drying of soil and/or debris.',
    revisedHas: 'Flush all lumens, blind holes, small clearances, and moving and intricate parts with water (or detergent solution) to prevent the drying of soil and/or debris.',
    page: 1,
    master: { x: 17, y: 130, w: 181, h: 40 },
    revised: { x: 19, y: 89, w: 204, h: 27 }
  },
  {
    id: 'I6',
    type: 'change',
    summary: 'Change: Transport to Processing Area Surgically used devices may be considered biohazardous and s…',
    masterHad: 'Transport to Processing Area Surgically used devices may be considered biohazardous and should be safely transported to a designated processing area in accordance with local policies.',
    revisedHas: 'Transport to processing area. Surgically used devices may be considered bio-hazardous and should be safely transported to a designated processing area in accordance with local policies.',
    page: 1,
    master: { x: 17, y: 148, w: 181, h: 40 },
    revised: { x: 19, y: 101, w: 204, h: 27 }
  },
  {
    id: 'I7',
    type: 'change',
    summary: 'Change: Preparation for Cleaning It is recommended that devices should be reprocessed as soon as…',
    masterHad: 'Preparation for Cleaning It is recommended that devices should be reprocessed as soon as is reasonably practical following surgical use.',
    revisedHas: 'Preparation for Cleaning It is recommended that devices should be reprocessed as soon as is reasonably practical following surgical use. (bullet marker removed)',
    page: 1,
    master: { x: 17, y: 167, w: 181, h: 40 },
    revised: { x: 19, y: 114, w: 204, h: 27 }
  },
  {
    id: 'I8',
    type: 'change',
    summary: 'Change: Care should be taken in the handling and cleaning of sharp devices.',
    masterHad: 'Care should be taken in the handling and cleaning of sharp devices.',
    revisedHas: 'Care should be taken in the handling and cleaning of sharp devices. (table/heading artifact overlap in source)',
    page: 1,
    master: { x: 17, y: 185, w: 181, h: 40 },
    revised: { x: 19, y: 126, w: 204, h: 27 }
  },
  {
    id: 'I9',
    type: 'change',
    summary: 'Change: These are recommended to be cleaned separately to reduce risks of iniury.',
    masterHad: 'These are recommended to be cleaned separately to reduce risks of iniury.',
    revisedHas: 'Care should be taken in the handling and cleaning of sharp devices. These are recommended to be cleaned separately to reduce risks of injury.',
    page: 1,
    master: { x: 17, y: 203, w: 181, h: 40 },
    revised: { x: 19, y: 139, w: 204, h: 27 }
  },
  {
    id: 'I10',
    type: 'change',
    summary: 'Change: Disassemble the instruments.',
    masterHad: 'Disassemble the instruments.',
    revisedHas: 'Disassemble the instruments according to the following instructions:',
    page: 1,
    master: { x: 17, y: 222, w: 181, h: 40 },
    revised: { x: 19, y: 151, w: 204, h: 27 }
  },
  {
    id: 'I11',
    type: 'line-break',
    summary: 'Line break: 1. Disconnect the light cable from the light guidepost.',
    masterHad: '1. Disconnect the light cable from the light guidepost.',
    revisedHas: '1. Disconnect the light cable from the lightguide post.',
    page: 1,
    master: { x: 17, y: 240, w: 181, h: 40 },
    revised: { x: 19, y: 164, w: 204, h: 27 }
  },
  {
    id: 'I12',
    type: 'deletion',
    summary: 'Removed: 2. Disconnect the camera-coupling device from the eyepiece',
    masterHad: '2. Disconnect the camera-coupling device from the eyepiece',
    revisedHas: '—',
    page: 1,
    master: { x: 17, y: 258, w: 181, h: 40 },
    revised: { x: 19, y: 176, w: 0, h: 0 }
  },
  {
    id: 'I13',
    type: 'change',
    summary: 'Change: 3. Remove any light cable adapters from the endoscope.',
    masterHad: '3. Remove any light cable adapters from the endoscope.',
    revisedHas: '3. Remove any light cable adaptors from the endoscope.',
    page: 1,
    master: { x: 17, y: 277, w: 181, h: 40 },
    revised: { x: 19, y: 189, w: 204, h: 27 }
  },
  {
    id: 'I14',
    type: 'change',
    summary: 'Change: 3. Remove any light cable adapters from the endoscope.',
    masterHad: '3. Remove any light cable adapters from the endoscope.',
    revisedHas: '2. Sterilize the endoscope and light cable adaptors disassembled.',
    page: 1,
    master: { x: 17, y: 295, w: 181, h: 40 },
    revised: { x: 19, y: 201, w: 204, h: 27 }
  },
  {
    id: 'I15',
    type: 'change',
    summary: 'Change: 4. Disassemble the endoscope from any devices or accessories used during the procedure.',
    masterHad: '4. Disassemble the endoscope from any devices or accessories used during the procedure.',
    revisedHas: '4. Disassemble the endoscope from any devices or compatible devices used during the procedure.',
    page: 1,
    master: { x: 17, y: 313, w: 181, h: 40 },
    revised: { x: 19, y: 214, w: 204, h: 27 }
  },
  {
    id: 'I16',
    type: 'change',
    summary: 'Change: 5. Disassemble the sheath including the stopcocks according to Figure 2: Disassembly',
    masterHad: '5. Disassemble the sheath including the stopcocks according to Figure 2: Disassembly',
    revisedHas: '5. Disassemble the sheath including the stopcocks according to Figure',
    page: 1,
    master: { x: 17, y: 332, w: 181, h: 40 },
    revised: { x: 19, y: 226, w: 204, h: 27 }
  },
  {
    id: 'I17',
    type: 'change',
    summary: 'Change: 6. Perform either the Manual Cleaning Procedure or the Automated Cleaning procedure below.',
    masterHad: '6. Perform either the Manual Cleaning Procedure or the Automated Cleaning procedure below.',
    revisedHas: '6. Perform either the manual cleaning procedure or the automated cleaning procedure described below.',
    page: 1,
    master: { x: 17, y: 350, w: 181, h: 40 },
    revised: { x: 19, y: 239, w: 204, h: 27 }
  },
  {
    id: 'I18',
    type: 'change',
    summary: 'Change: MANUAL CLEANING Perform the following steps at the point of central reprocessing',
    masterHad: 'MANUAL CLEANING Perform the following steps at the point of central reprocessing',
    revisedHas: 'MANUAL CLEANING Perform the following steps at the point of central reprocessing:',
    page: 1,
    master: { x: 17, y: 368, w: 181, h: 40 },
    revised: { x: 19, y: 251, w: 204, h: 27 }
  },
  {
    id: 'I19',
    type: 'change',
    summary: 'Change: 4. Soak for five (5) minutes and then use soft bristle brushes to remove any debris/soil…',
    masterHad: '4. Soak for five (5) minutes and then use soft bristle brushes to remove any debris/soil from the instruments while they are submerged.',
    revisedHas: '4. Soak for five (5) minutes and then use soft bristle brushes to remove any debris or soil from the instruments while they are submerged.',
    page: 1,
    master: { x: 17, y: 387, w: 181, h: 40 },
    revised: { x: 19, y: 264, w: 204, h: 27 }
  },
  {
    id: 'I20',
    type: 'change',
    summary: 'Change: Ensure that the brushes can access the hard-to-reach areas such as cannulations, cracks,…',
    masterHad: 'Ensure that the brushes can access the hard-to-reach areas such as cannulations, cracks, crevices, and threads.',
    revisedHas: 'Ensure that the brushes can access the hard-to-reach areas such as cannulations, cracks, crevices, and threads. Remove all visible debris.',
    page: 1,
    master: { x: 17, y: 405, w: 181, h: 40 },
    revised: { x: 19, y: 276, w: 204, h: 27 }
  },
  {
    id: 'I21',
    type: 'change',
    summary: 'Change: Remove all visible debris.',
    masterHad: 'Remove all visible debris.',
    revisedHas: 'Remove any excess lubricant.',
    page: 1,
    master: { x: 17, y: 424, w: 181, h: 40 },
    revised: { x: 19, y: 289, w: 204, h: 27 }
  },
  {
    id: 'I22',
    type: 'change',
    summary: 'Change: 5. Fill a syringe with the detergent and use to flush',
    masterHad: '5. Fill a syringe with the detergent and use to flush',
    revisedHas: '5. Fill a syringe with the detergent and use to flush cannulations, crevices, and threads while submerged.',
    page: 1,
    master: { x: 17, y: 442, w: 181, h: 40 },
    revised: { x: 19, y: 301, w: 204, h: 27 }
  },
  {
    id: 'I23',
    type: 'case',
    summary: 'Case: 6. Repeat the Brushing step (Step',
    masterHad: '6. Repeat the Brushing step (Step',
    revisedHas: '6. Repeat the brushing step (step',
    page: 1,
    master: { x: 17, y: 460, w: 181, h: 40 },
    revised: { x: 19, y: 314, w: 204, h: 27 }
  },
  {
    id: 'I24',
    type: 'case',
    summary: 'Case: 3) and the Flushing step (Step',
    masterHad: '3) and the Flushing step (Step',
    revisedHas: '3) and the flushing step (step',
    page: 1,
    master: { x: 17, y: 479, w: 181, h: 40 },
    revised: { x: 19, y: 326, w: 204, h: 27 }
  },
  {
    id: 'I25',
    type: 'change',
    summary: 'Change: 8. For the Sheath only: Completely submerge the devices in an ultrasonic bath.',
    masterHad: '8. For the Sheath only: Completely submerge the devices in an ultrasonic bath.',
    revisedHas: '8. For the sheath only, completely submerge the devices in an ultrasonic bath.',
    page: 1,
    master: { x: 17, y: 497, w: 181, h: 40 },
    revised: { x: 19, y: 339, w: 204, h: 27 }
  },
  {
    id: 'I26',
    type: 'change',
    summary: 'Change: Carry out an ultrasonic second soaking bath in a neutral pH detergent solution for 10 min…',
    masterHad: 'Carry out an ultrasonic second soaking bath in a neutral pH detergent solution for 10 minutes using an ultrasonic bath.',
    revisedHas: 'Carry out an ultrasonic second soaking bath in a neutral pH detergent solution for 10 minutes using an ultrasonic bath (refer to cleaning agent solution manufacturer\'s instructions for immersion time and temperature).',
    page: 1,
    master: { x: 17, y: 515, w: 181, h: 40 },
    revised: { x: 19, y: 351, w: 204, h: 27 }
  },
  {
    id: 'I27',
    type: 'change',
    summary: 'Change: (Refer to cleaning agent solution manufacturer\'s instructions for immersion time and temp…',
    masterHad: '(Refer to cleaning agent solution manufacturer\'s instructions for immersion time and temperature.)',
    revisedHas: 'Use a water-soluble lubricant in accordance with the lubricant manufacturer\'s instructions to lubricate parts as necessary.',
    page: 1,
    master: { x: 17, y: 534, w: 181, h: 40 },
    revised: { x: 19, y: 364, w: 204, h: 27 }
  },
  {
    id: 'I28',
    type: 'change',
    summary: 'Change: 10. For the final rinsing processes, soak the devices for a minimum of three (3) minutes…',
    masterHad: '10. For the final rinsing processes, soak the devices for a minimum of three (3) minutes in purified (e.g., deionized, reverse osmosis, distilled, or Critical Water), per AAMI TIR 34:2014, Dry with a lint-free soft cloth.',
    revisedHas: '10. For the final rinsing processes, soak the devices for a minimum of three (3) minutes in purified (e.g., deionized, reverse osmosis, distilled, or critical water), per AAMI TIR 34:2014.',
    page: 1,
    master: { x: 17, y: 552, w: 181, h: 40 },
    revised: { x: 19, y: 376, w: 204, h: 27 }
  },
  {
    id: 'I29',
    type: 'insertion',
    summary: 'Added: CLEANING, THERMAL DISINFECTION, AND STERILIZATION These cleaning, disinfection, and steri…',
    masterHad: '—',
    revisedHas: 'CLEANING, THERMAL DISINFECTION, AND STERILIZATION These cleaning, disinfection, and sterilization instructions have been validated for preparing reusable DePuy Synthes instruments for reuse.',
    page: 1,
    master: { x: 17, y: 570, w: 0, h: 0 },
    revised: { x: 19, y: 389, w: 204, h: 27 }
  },
  {
    id: 'I30',
    type: 'insertion',
    summary: 'Added: It is the responsibility of the end user to ensure that the cleaning, disinfection, and s…',
    masterHad: '—',
    revisedHas: 'It is the responsibility of the end user to ensure that the cleaning, disinfection, and sterilization is performed using appropriate equipment, materials, and personnel to achieve the desired result.',
    page: 1,
    master: { x: 17, y: 589, w: 0, h: 0 },
    revised: { x: 19, y: 401, w: 204, h: 27 }
  },
  {
    id: 'I31',
    type: 'insertion',
    summary: 'Added: Any deviation from these instructions should be evaluated for effectiveness and potential…',
    masterHad: '—',
    revisedHas: 'Any deviation from these instructions should be evaluated for effectiveness and potential adverse consequences.',
    page: 1,
    master: { x: 17, y: 607, w: 0, h: 0 },
    revised: { x: 19, y: 414, w: 204, h: 27 }
  },
  {
    id: 'I32',
    type: 'insertion',
    summary: 'Added: General considerations for processing',
    masterHad: '—',
    revisedHas: 'General considerations for processing',
    page: 1,
    master: { x: 17, y: 625, w: 0, h: 0 },
    revised: { x: 19, y: 426, w: 204, h: 27 }
  },
  {
    id: 'I33',
    type: 'insertion',
    summary: 'Added: Observe point of use and transport procedures as described below.',
    masterHad: '—',
    revisedHas: 'Observe point of use and transport procedures as described below.',
    page: 1,
    master: { x: 17, y: 644, w: 0, h: 0 },
    revised: { x: 19, y: 439, w: 204, h: 27 }
  },
  {
    id: 'I34',
    type: 'insertion',
    summary: 'Added: Highly alkaline conditions (pH>10) can damage components or device.',
    masterHad: '—',
    revisedHas: 'Highly alkaline conditions (pH>10) can damage components or device.',
    page: 1,
    master: { x: 17, y: 662, w: 0, h: 0 },
    revised: { x: 19, y: 451, w: 204, h: 27 }
  },
  {
    id: 'I35',
    type: 'insertion',
    summary: 'Added: Point of use care',
    masterHad: '—',
    revisedHas: 'Point of use care',
    page: 1,
    master: { x: 17, y: 680, w: 0, h: 0 },
    revised: { x: 19, y: 464, w: 204, h: 27 }
  },
  {
    id: 'I36',
    type: 'insertion',
    summary: 'Added: Preparation for cleaning',
    masterHad: '—',
    revisedHas: 'Preparation for cleaning',
    page: 1,
    master: { x: 17, y: 699, w: 0, h: 0 },
    revised: { x: 19, y: 476, w: 204, h: 27 }
  },
  {
    id: 'I37',
    type: 'insertion',
    summary: 'Added: 2.',
    masterHad: '—',
    revisedHas: '2.',
    page: 1,
    master: { x: 17, y: 717, w: 0, h: 0 },
    revised: { x: 19, y: 489, w: 204, h: 27 }
  },
  {
    id: 'I38',
    type: 'insertion',
    summary: 'Added: 4',
    masterHad: '—',
    revisedHas: '4',
    page: 1,
    master: { x: 17, y: 735, w: 0, h: 0 },
    revised: { x: 19, y: 501, w: 204, h: 27 }
  },
  {
    id: 'I39',
    type: 'change',
    summary: 'Change: AUTOMATED CLEANING Equipment Required: Automated washing shall be conducted in a validate…',
    masterHad: 'AUTOMATED CLEANING Equipment Required: Automated washing shall be conducted in a validated washer-disinfector in compliance to ISO 15883-1 and -2, or to an equivalent standard.',
    revisedHas: 'AUTOMATED CLEANING Equipment required: Automated washing shall be conducted in a validated washer-disinfector in compliance to ISO 15883-1 and-2, or to an equivalent standard.',
    page: 2,
    master: { x: 17, y: 57, w: 181, h: 40 },
    revised: { x: 19, y: 39, w: 204, h: 27 }
  },
  {
    id: 'I40',
    type: 'change',
    summary: 'Change: 2. Place the endoscope and its light cable adapters into a separate mesh basket.',
    masterHad: '2. Place the endoscope and its light cable adapters into a separate mesh basket.',
    revisedHas: '2. Place the endoscope and its light cable adaptors into a separate mesh basket.',
    page: 2,
    master: { x: 17, y: 77, w: 181, h: 40 },
    revised: { x: 19, y: 52, w: 204, h: 27 }
  },
  {
    id: 'I41',
    type: 'change',
    summary: 'Change: Ensure that the endoscope and light cable adapters do not touch each other when placed in…',
    masterHad: 'Ensure that the endoscope and light cable adapters do not touch each other when placed into the basket.',
    revisedHas: 'Ensure that the endoscope and light cable adaptors do not touch each other when placed into the basket.',
    page: 2,
    master: { x: 17, y: 96, w: 181, h: 40 },
    revised: { x: 19, y: 65, w: 204, h: 27 }
  },
  {
    id: 'I42',
    type: 'change',
    summary: 'Change: Place a mesh screen over the basket to contain the endoscope and light cable adapters in…',
    masterHad: 'Place a mesh screen over the basket to contain the endoscope and light cable adapters in the basket during processing.',
    revisedHas: 'Place a mesh screen over the basket to contain the endoscope and light cable adaptors in the basket during processing.',
    page: 2,
    master: { x: 17, y: 115, w: 181, h: 40 },
    revised: { x: 19, y: 79, w: 204, h: 27 }
  },
  {
    id: 'I43',
    type: 'change',
    summary: 'Change: Clean in a validated washer disinfector using the Clean in a Valldated washer disinfector…',
    masterHad: 'Clean in a validated washer disinfector using the Clean in a Valldated washer disinfector using the "INSTRUMENTS" cycle and a pH neutral cleaning agent intended for use in automated cleaning as shown in Table',
    revisedHas: '3. Clean in a validated washer disinfector using the "INSTRUMENTS" cycle and a pH neutral cleaning agent intended for use in automated cleaning as shown in Table',
    page: 2,
    master: { x: 17, y: 135, w: 181, h: 40 },
    revised: { x: 19, y: 92, w: 204, h: 27 }
  },
  {
    id: 'I44',
    type: 'change',
    summary: 'Change: 1. Note: Enzol (1 oz/gal) and Prolystica 2X Neutral (1/8 oz/gal) were used for the valida…',
    masterHad: '1. Note: Enzol (1 oz/gal) and Prolystica 2X Neutral (1/8 oz/gal) were used for the validation.',
    revisedHas: '2. NOTE: Enzol® (1oz/gal) and Prolystica 2X Neutral® (1/8 oz/gal) were used for the validation.',
    page: 2,
    master: { x: 17, y: 154, w: 181, h: 40 },
    revised: { x: 19, y: 105, w: 204, h: 27 }
  },
  {
    id: 'I45',
    type: 'change',
    summary: 'Change: Table 1: Automatic Cleaning Parameters: INSPECTION AFTER CLEANING After either Manual Cle…',
    masterHad: 'Table 1: Automatic Cleaning Parameters: INSPECTION AFTER CLEANING After either Manual Cleaning or Automated Cleaning, visually inspect the instruments to verify the absence of visible soil, stains and debris.',
    revisedHas: 'Table 1: Automatic Cleaning Parameters: INSPECTION AFTER CLEANING After either manual cleaning or automated cleaning, visually inspect the instruments to verify the absence of visible soil, stains, and debris.',
    page: 2,
    master: { x: 17, y: 173, w: 181, h: 40 },
    revised: { x: 19, y: 118, w: 204, h: 27 }
  },
  {
    id: 'I46',
    type: 'line-break',
    summary: 'Line break: Thermal disinfection should be conducted in a washer-disinfector compliant to ISO 15883-1…',
    masterHad: 'Thermal disinfection should be conducted in a washer-disinfector compliant to ISO 15883-1 and -2, or to an equivalent standard.',
    revisedHas: 'Thermal disinfection should be conducted in a washer-disinfector compliant to ISO 15883-1 and-2, or to an equivalent standard.',
    page: 2,
    master: { x: 17, y: 193, w: 181, h: 40 },
    revised: { x: 19, y: 131, w: 204, h: 27 }
  },
  {
    id: 'I47',
    type: 'change',
    summary: 'Change: If this is not possible due to space limitations within the washer-disinfector, use an ir…',
    masterHad: 'If this is not possible due to space limitations within the washer-disinfector, use an irrigating rack/load carrier with connections designed to ensure an adequate flow of process fluids to the lumen or cannulation of the device if provided.',
    revisedHas: 'If this is not possible due to space limitations within the washer-disinfector, use an irrigating rack or load carrier with connections designed to ensure an adequate flow of process fluids to the lumen or cannulation of the device if provided.',
    page: 2,
    master: { x: 17, y: 212, w: 181, h: 40 },
    revised: { x: 19, y: 145, w: 204, h: 27 }
  },
  {
    id: 'I48',
    type: 'change',
    summary: 'Change: The following automated cycles are examples of validated cycles: STERRAD Sterilization: E…',
    masterHad: 'The following automated cycles are examples of validated cycles: STERRAD Sterilization: Endoscope and adapters only CAUTION: The sheaths are not validated for sterilization using STERRAD.',
    revisedHas: 'STERRAD™ sterilization: endoscope and light adaptors only CAUTION: The sheaths are not validated for sterilization using STERRAD.',
    page: 2,
    master: { x: 17, y: 231, w: 181, h: 40 },
    revised: { x: 19, y: 158, w: 204, h: 27 }
  },
  {
    id: 'I49',
    type: 'change',
    summary: 'Change: 1. Ensure the endoscope and light cable adapters are disassembled before sterilization.',
    masterHad: '1. Ensure the endoscope and light cable adapters are disassembled before sterilization.',
    revisedHas: '1. Ensure the endoscope and light cable adaptors are disassembled before sterilization.',
    page: 2,
    master: { x: 17, y: 251, w: 181, h: 40 },
    revised: { x: 19, y: 171, w: 204, h: 27 }
  },
  {
    id: 'I50',
    type: 'change',
    summary: 'Change: 2. The endoscope and light cable adapters can be sterilized in the STERRAD 100S system, a…',
    masterHad: '2. The endoscope and light cable adapters can be sterilized in the STERRAD 100S system, and in the STERRAD 100NX and STERRAD NX sterilization systems using the STANDARD Cycle.',
    revisedHas: '2. The endoscope and light cable adaptors can be sterilized in the STERRAD™100S system, and in the STERRAD™100NX, and STERRAD™NX sterilization systems using the STANDARD cycle.',
    page: 2,
    master: { x: 17, y: 270, w: 181, h: 40 },
    revised: { x: 19, y: 184, w: 204, h: 27 }
  },
  {
    id: 'I51',
    type: 'change',
    summary: 'Change: 3. Clean and thoroughly dry the endoscope and light cable adapters per the Cleaning/Disin…',
    masterHad: '3. Clean and thoroughly dry the endoscope and light cable adapters per the Cleaning/Disinfection Section.',
    revisedHas: '3. Clean and thoroughly dry the endoscope and light cable adaptors per the section titled "CLEANING, THERMAL DISINFECTION, AND STERILIZATION."',
    page: 2,
    master: { x: 17, y: 290, w: 181, h: 40 },
    revised: { x: 19, y: 197, w: 204, h: 27 }
  },
  {
    id: 'I52',
    type: 'change',
    summary: 'Change: 4. Place the endoscope and light cable adapters into the appropriate location within the…',
    masterHad: '4. Place the endoscope and light cable adapters into the appropriate location within the Mitek Sport Medicine sterilization tray that is compatible with the STERRAD 100S, NX and100NX sterilization systems.',
    revisedHas: '4. Place the endoscope and light cable adaptors into the appropriate location within the Mitek Sport Medicine sterilization tray that is compatible with the STERRAD 100S, NX, and 100NX sterilization systems.',
    page: 2,
    master: { x: 17, y: 309, w: 181, h: 40 },
    revised: { x: 19, y: 211, w: 204, h: 27 }
  },
  {
    id: 'I53',
    type: 'change',
    summary: 'Change: Package trays/ instruments with a barrier wrap material in accordance with local procedur…',
    masterHad: 'Package trays/ instruments with a barrier wrap material in accordance with local procedures, using standardized wrapping techniques such as those described in ANSI/AAMI',
    revisedHas: 'Package trays or instruments with a barrier wrap material in accordance with local procedures, using standardized wrapping techniques such as those described in ANSI/AAMI',
    page: 2,
    master: { x: 17, y: 328, w: 181, h: 40 },
    revised: { x: 19, y: 224, w: 204, h: 27 }
  },
  {
    id: 'I54',
    type: 'change',
    summary: 'Change: 79. In the United States use an FDA-cleared sterilization wrap.',
    masterHad: '79. In the United States use an FDA-cleared sterilization wrap.',
    revisedHas: '79. In the United States, use an FDA-cleared sterilization wrap.',
    page: 2,
    master: { x: 17, y: 348, w: 181, h: 40 },
    revised: { x: 19, y: 237, w: 204, h: 27 }
  },
  {
    id: 'I55',
    type: 'insertion',
    summary: 'Added: NOTE: The cleaning solution may contain enzymes.',
    masterHad: '—',
    revisedHas: 'NOTE: The cleaning solution may contain enzymes.',
    page: 2,
    master: { x: 17, y: 367, w: 0, h: 0 },
    revised: { x: 19, y: 250, w: 204, h: 27 }
  },
  {
    id: 'I56',
    type: 'insertion',
    summary: 'Added: 34. Dry with a lint-free soft cloth.',
    masterHad: '—',
    revisedHas: '34. Dry with a lint-free soft cloth.',
    page: 2,
    master: { x: 17, y: 386, w: 0, h: 0 },
    revised: { x: 19, y: 263, w: 204, h: 27 }
  },
  {
    id: 'I57',
    type: 'insertion',
    summary: 'Added: The following automated cycles are examples of validated cycles (Table 3): Table 3: Examp…',
    masterHad: '—',
    revisedHas: 'The following automated cycles are examples of validated cycles (Table 3): Table 3: Examples of automated validated cycles.',
    page: 3,
    master: { x: 17, y: 91, w: 0, h: 0 },
    revised: { x: 19, y: 62, w: 204, h: 27 }
  },
  {
    id: 'I58',
    type: 'insertion',
    summary: 'Added: Table 3: Examples of automated validated cycles.',
    masterHad: '—',
    revisedHas: 'Table 3: Examples of automated validated cycles.',
    page: 3,
    master: { x: 17, y: 178, w: 0, h: 0 },
    revised: { x: 19, y: 122, w: 204, h: 27 }
  },
  {
    id: 'I59',
    type: 'insertion',
    summary: 'Added: Autoclave (steam) sterilization CAUTION: Do not use an "immediate use or flash" cycle to…',
    masterHad: '—',
    revisedHas: 'Autoclave (steam) sterilization CAUTION: Do not use an "immediate use or flash" cycle to sterilize the instruments.',
    page: 3,
    master: { x: 17, y: 265, w: 0, h: 0 },
    revised: { x: 19, y: 181, w: 204, h: 27 }
  },
  {
    id: 'I60',
    type: 'insertion',
    summary: 'Added: 1. Before assembly of the sheath for sterilization, make sure that all O-rings are in pla…',
    masterHad: '—',
    revisedHas: '1. Before assembly of the sheath for sterilization, make sure that all O-rings are in place and are not damaged.',
    page: 3,
    master: { x: 17, y: 352, w: 0, h: 0 },
    revised: { x: 19, y: 240, w: 204, h: 27 }
  },
  {
    id: 'I61',
    type: 'insertion',
    summary: 'Added: Remove and replace any O-rings that show any sign of damage or wear.',
    masterHad: '—',
    revisedHas: 'Remove and replace any O-rings that show any sign of damage or wear.',
    page: 3,
    master: { x: 17, y: 440, w: 0, h: 0 },
    revised: { x: 19, y: 300, w: 204, h: 27 }
  },
  {
    id: 'I62',
    type: 'insertion',
    summary: 'Added: Sterilize the sheath with the stopcocks in the open position.',
    masterHad: '—',
    revisedHas: 'Sterilize the sheath with the stopcocks in the open position.',
    page: 3,
    master: { x: 17, y: 527, w: 0, h: 0 },
    revised: { x: 19, y: 359, w: 204, h: 27 }
  },
  {
    id: 'I63',
    type: 'insertion',
    summary: 'Added: 3. If the instruments come with a protective transport sleeve, do not sterilize the endos…',
    masterHad: '—',
    revisedHas: '3. If the instruments come with a protective transport sleeve, do not sterilize the endoscopic compatible devices with the protective transport sleeve.',
    page: 3,
    master: { x: 17, y: 614, w: 0, h: 0 },
    revised: { x: 19, y: 418, w: 204, h: 27 }
  },
  {
    id: 'I64',
    type: 'insertion',
    summary: 'Added: 1',
    masterHad: '—',
    revisedHas: '1',
    page: 3,
    master: { x: 17, y: 701, w: 0, h: 0 },
    revised: { x: 19, y: 478, w: 204, h: 27 }
  },
  {
    id: 'I65',
    type: 'case',
    summary: 'Case: Recirculation Time set points',
    masterHad: 'Recirculation Time set points',
    revisedHas: 'Recirculation time set points',
    page: 2,
    master: { x: 17, y: 406, w: 181, h: 40 },
    revised: { x: 19, y: 277, w: 204, h: 27 }
  },
  {
    id: 'I66',
    type: 'case',
    summary: 'Case: Water Temperature',
    masterHad: 'Water Temperature',
    revisedHas: 'Water temperature',
    page: 2,
    master: { x: 17, y: 425, w: 181, h: 40 },
    revised: { x: 19, y: 290, w: 204, h: 27 }
  },
  {
    id: 'I67',
    type: 'case',
    summary: 'Case: Detergent Type',
    masterHad: 'Detergent Type',
    revisedHas: 'Detergent type',
    page: 2,
    master: { x: 17, y: 444, w: 181, h: 40 },
    revised: { x: 19, y: 303, w: 204, h: 27 }
  },
  {
    id: 'I68',
    type: 'case',
    summary: 'Case: Pre-Wash',
    masterHad: 'Pre-Wash',
    revisedHas: 'Pre-wash',
    page: 2,
    master: { x: 17, y: 464, w: 181, h: 40 },
    revised: { x: 19, y: 316, w: 204, h: 27 }
  },
  {
    id: 'I69',
    type: 'change',
    summary: 'Change: N/A',
    masterHad: 'N/A',
    revisedHas: 'Not applicable',
    page: 2,
    master: { x: 17, y: 483, w: 181, h: 40 },
    revised: { x: 19, y: 329, w: 204, h: 27 }
  },
  {
    id: 'I70',
    type: 'case',
    summary: 'Case: Enzyme Wash',
    masterHad: 'Enzyme Wash',
    revisedHas: 'Enzyme wash',
    page: 2,
    master: { x: 17, y: 502, w: 181, h: 40 },
    revised: { x: 19, y: 343, w: 204, h: 27 }
  },
  {
    id: 'I71',
    type: 'case',
    summary: 'Case: 65°C (Set Point)',
    masterHad: '65°C (Set Point)',
    revisedHas: '65°C (set point)',
    page: 2,
    master: { x: 17, y: 522, w: 181, h: 40 },
    revised: { x: 19, y: 356, w: 204, h: 27 }
  },
  {
    id: 'I72',
    type: 'change',
    summary: 'Change: N/A',
    masterHad: 'N/A',
    revisedHas: 'Not applicable',
    page: 2,
    master: { x: 17, y: 541, w: 181, h: 40 },
    revised: { x: 19, y: 369, w: 204, h: 27 }
  },
  {
    id: 'I73',
    type: 'case',
    summary: 'Case: Dry Phase',
    masterHad: 'Dry Phase',
    revisedHas: 'Dry phase',
    page: 2,
    master: { x: 17, y: 561, w: 181, h: 40 },
    revised: { x: 19, y: 382, w: 204, h: 27 }
  },
  {
    id: 'I74',
    type: 'case',
    summary: 'Case: 66°C (Set Point)',
    masterHad: '66°C (Set Point)',
    revisedHas: '66°C (set point)',
    page: 2,
    master: { x: 17, y: 580, w: 181, h: 40 },
    revised: { x: 19, y: 395, w: 204, h: 27 }
  },
  {
    id: 'I75',
    type: 'change',
    summary: 'Change: N/A',
    masterHad: 'N/A',
    revisedHas: 'Not applicable',
    page: 2,
    master: { x: 17, y: 599, w: 181, h: 40 },
    revised: { x: 19, y: 409, w: 204, h: 27 }
  },
  {
    id: 'I76',
    type: 'case',
    summary: 'Case: Recirculation Time (mins)',
    masterHad: 'Recirculation Time (mins)',
    revisedHas: 'Recirculation time (mins)',
    page: 2,
    master: { x: 17, y: 619, w: 181, h: 40 },
    revised: { x: 19, y: 422, w: 204, h: 27 }
  },
  {
    id: 'I77',
    type: 'case',
    summary: 'Case: Water Temp',
    masterHad: 'Water Temp',
    revisedHas: 'Water temp',
    page: 2,
    master: { x: 17, y: 638, w: 181, h: 40 },
    revised: { x: 19, y: 435, w: 204, h: 27 }
  },
  {
    id: 'I78',
    type: 'case',
    summary: 'Case: Water Type',
    masterHad: 'Water Type',
    revisedHas: 'Water type',
    page: 2,
    master: { x: 17, y: 657, w: 181, h: 40 },
    revised: { x: 19, y: 448, w: 204, h: 27 }
  },
  {
    id: 'I79',
    type: 'case',
    summary: 'Case: Thermal Disinfection',
    masterHad: 'Thermal Disinfection',
    revisedHas: 'Thermal disinfection',
    page: 2,
    master: { x: 17, y: 677, w: 181, h: 40 },
    revised: { x: 19, y: 461, w: 204, h: 27 }
  },
  {
    id: 'I80',
    type: 'line-break',
    summary: 'Line break: >90° (194°F)',
    masterHad: '>90° (194°F)',
    revisedHas: '> 90° (194°F)',
    page: 2,
    master: { x: 17, y: 696, w: 181, h: 40 },
    revised: { x: 19, y: 475, w: 204, h: 27 }
  },
  {
    id: 'I81',
    type: 'case',
    summary: 'Case: Thermal Disinfection',
    masterHad: 'Thermal Disinfection',
    revisedHas: 'Thermal disinfection',
    page: 2,
    master: { x: 17, y: 715, w: 181, h: 40 },
    revised: { x: 19, y: 488, w: 204, h: 27 }
  },
  {
    id: 'I82',
    type: 'change',
    summary: 'Change: >90°C (194°F)',
    masterHad: '>90°C (194°F)',
    revisedHas: '> 90 (194°F)',
    page: 2,
    master: { x: 17, y: 735, w: 181, h: 40 },
    revised: { x: 19, y: 501, w: 204, h: 27 }
  }
]

function LabelPanel({
  title,
  version,
  variant,
  findings,
  selectedFinding,
  zoom,
  scrollRef,
  onReset,
  fileUrl,
  loading,
  fileKind = 'image',
  docLabel = 'LABEL',
  pdfPage = 1,
  onPdfPageChange,
  onPdfPageCountChange,
}: {
  title: string
  version: string
  variant: 'master' | 'revised'
  findings: Finding[]
  selectedFinding: string | null
  zoom: number
  scrollRef: React.RefObject<HTMLDivElement | null>
  onReset: () => void
  fileUrl: string
  loading: boolean
  fileKind?: 'image' | 'pdf'
  docLabel?: string
  pdfPage?: number
  onPdfPageChange?: (updater: number | ((p: number) => number)) => void
  onPdfPageCountChange?: (count: number) => void
}) {
  const scale = zoom / 100
  const headerBg = variant === 'master' ? '#FEF2F2' : '#EFF6FF'
  const dotColor = variant === 'master' ? '#E02424' : '#1A56DB'
  const versionLabel = variant === 'master' ? `CURRENT VERSION ${docLabel}` : `REVISED VERSION ${docLabel}`

  // Label source dimensions are approximately 680x900 to ensure full width and height render
  const width = 680
  const height = 900

  // Multi-page PDF navigation (IFU documents can have a different page count per version)
  const [pdfPageCount, setPdfPageCount] = useState(1)
  useEffect(() => {
    onPdfPageChange?.(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileUrl])

  const handleDocLoaded = (count: number) => {
    setPdfPageCount(count)
    onPdfPageCountChange?.(count)
  }

  // Click-and-drag to pan the label
  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    let dragging = false;
    let startX = 0, startY = 0, startLeft = 0, startTop = 0;
    const onDown = (e: MouseEvent) => {
      if (e.button !== 0 || (e.target as HTMLElement).closest('button')) return;
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      startLeft = scroller.scrollLeft;
      startTop = scroller.scrollTop;
      scroller.style.cursor = "grabbing";
      e.preventDefault();
    };
    const onMove = (e: MouseEvent) => {
      if (!dragging) return;
      scroller.scrollLeft = startLeft - (e.clientX - startX);
      scroller.scrollTop = startTop - (e.clientY - startY);
    };
    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      scroller.style.cursor = "";
    };
    scroller.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      scroller.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [scrollRef, loading]);

  // Intercept Ctrl+scroll at the container level
  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    const handler = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) e.preventDefault();
    };
    scroller.addEventListener("wheel", handler, { passive: false });
    return () => scroller.removeEventListener("wheel", handler);
  }, [scrollRef, loading]);

  return (
    <div className="flex-1 flex flex-col min-w-0 min-h-0">
      {/* Panel header */}
      <div
        className="h-11 px-4 flex items-center justify-between flex-shrink-0"
        style={{
          backgroundColor: headerBg,
          borderBottom: `2px solid ${dotColor}`,
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: dotColor }} />
          <span className="text-sm font-bold uppercase tracking-wide flex-shrink-0" style={{ color: dotColor }}>
            {versionLabel}
          </span>
          <span className="text-xs text-[#5F6368] truncate">· {title}</span>
        </div>
        <div className="flex items-center gap-2 ml-3 flex-shrink-0">
          {fileKind === 'pdf' && pdfPageCount > 1 && (
            <div className="flex items-center gap-1 mr-1">
              <button
                onClick={() => onPdfPageChange?.(p => Math.max(1, p - 1))}
                disabled={pdfPage <= 1}
                title="Previous page"
                className={`h-6 w-6 flex items-center justify-center rounded border transition-colors ${pdfPage <= 1 ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                style={{ borderColor: dotColor, color: dotColor, backgroundColor: 'transparent' }}
              >
                ‹
              </button>
              <span className="text-[11px] font-semibold px-1" style={{ color: dotColor }}>
                Page {pdfPage} / {pdfPageCount}
              </span>
              <button
                onClick={() => onPdfPageChange?.(p => Math.min(pdfPageCount, p + 1))}
                disabled={pdfPage >= pdfPageCount}
                title="Next page"
                className={`h-6 w-6 flex items-center justify-center rounded border transition-colors ${pdfPage >= pdfPageCount ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                style={{ borderColor: dotColor, color: dotColor, backgroundColor: 'transparent' }}
              >
                ›
              </button>
            </div>
          )}
          <button
            onClick={onReset}
            disabled={loading}
            title="Reset zoom"
            className={`h-6 w-6 flex items-center justify-center rounded border transition-colors ${loading ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
            style={{ borderColor: dotColor, color: dotColor, backgroundColor: 'transparent' }}
          >
            <Maximize2 className="h-3 w-3" />
          </button>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded border" style={{ color: dotColor, borderColor: dotColor }}>
            {loading ? '—' : findings.length} ANNOTATION{findings.length !== 1 ? 'S' : ''}
          </span>
        </div>
      </div>

      {loading ? (
        /* Loading state */
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center bg-[#F1F3F4] gap-3">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: dotColor }} />
          <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: dotColor }}>
            Loading Labels
          </div>
        </div>
      ) : fileKind === 'pdf' ? (
        /* Annotated document canvas — same pan/zoom interaction as the label image viewer */
        <div ref={scrollRef} className="flex-1 min-h-0 overflow-auto bg-[#F1F3F4] p-6 no-scrollbar cursor-grab select-none">
          <div className="flex justify-center">
            <PdfPageCanvas fileUrl={fileUrl} scale={scale} pageNumber={pdfPage} onDocLoaded={handleDocLoaded} />
          </div>
        </div>
      ) : (
        /* Canvas container */
        <div ref={scrollRef} className="flex-1 min-h-0 overflow-auto bg-[#F1F3F4] p-6 no-scrollbar cursor-grab select-none">
          <div
            className="relative mx-auto bg-white rounded-lg shadow-sm overflow-hidden"
            style={{ width: width * scale, height: height * scale }}
          >
            {/* Render label image */}
            <img
              src={fileUrl}
              alt={title}
              draggable={false}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'fill',
                display: 'block',
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            />

          </div>
        </div>
      )}
    </div>
  )
}

function expandedIdMatch(selectedId: string | null, currentId: string): boolean {
  if (!selectedId) return false
  if (selectedId === currentId) return true
  return false
}

function FilterPill({
  label,
  active,
  color,
  onClick,
}: {
  label: string
  active: boolean
  color: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1 text-xs rounded-full border transition-colors cursor-pointer"
      style={{
        backgroundColor: active ? color : 'transparent',
        color: active ? '#FFFFFF' : '#5F6368',
        borderColor: active ? color : '#E0E0E0',
      }}
    >
      {label}
    </button>
  )
}

export default function AnalysisScreen({ onNavigate, previousScreen, lrfFlowActive, documentType = 'label', bulkMode, masterFilename, revisedFilename, historyPreview }: Props) {
  const isIfu = documentType === 'ifu'
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'text' | 'graphics' | 'barcode' | IfuCategory>('all')
  const [activeStatus, setActiveStatus] = useState<'all' | 'expected' | 'unexpected'>('all')
  const [exporting, setExporting] = useState(false)
  const [syncScroll, setSyncScroll] = useState(true)

  // Separate zooms for split zoom support
  const [masterZoom, setMasterZoom] = useState(100)
  const [revisedZoom, setRevisedZoom] = useState(100)

  // Current PDF page shown per panel (IFU documents can have a different page count per version)
  const [masterPdfPage, setMasterPdfPage] = useState(1)
  const [revisedPdfPage, setRevisedPdfPage] = useState(1)
  const [masterPdfPageCount, setMasterPdfPageCount] = useState(1)
  const [revisedPdfPageCount, setRevisedPdfPageCount] = useState(1)

  const masterRef = useRef<HTMLDivElement>(null)
  const revisedRef = useRef<HTMLDivElement>(null)

  // IFU document comparison has no bulk upload, so it never shows the pairs sidebar
  const isTwentyPairs = !isIfu && !!bulkMode && !historyPreview;
  const isTwoPairs = !isIfu && !!bulkMode && !!historyPreview;
  const hasSidebar = isTwentyPairs || isTwoPairs;
  const [activePairIdx, setActivePairIdx] = useState(1);

  // Generate pairs list dynamically
  const bulkPairs = isTwoPairs
    ? [
        {
          idx: 1,
          master: masterFilename,
          revised: revisedFilename,
          actualMaster: masterFilename,
          actualRevised: revisedFilename,
          count: newFindingsList.length
        },
        {
          idx: 2,
          master: 'additional changes master.pdf',
          revised: 'additional changes revised.pdf',
          actualMaster: 'additional changes master.pdf',
          actualRevised: 'additional changes revised.pdf',
          count: findings.length
        }
      ]
    : Array.from({ length: 20 }, (_, i) => {
        const isEven = i % 2 === 0;
        const mName = isEven ? 'Master.pdf' : 'additional changes master.pdf';
        const rName = isEven ? 'Revised.pdf' : 'additional changes revised.pdf';
        const count = isEven ? newFindingsList.length : findings.length;
        return {
          idx: i + 1,
          master: mName,
          revised: rName,
          actualMaster: mName,
          actualRevised: rName,
          count
        };
      });

  const currentPair = hasSidebar ? bulkPairs[activePairIdx - 1] : null;

  // Determine actual files and paths being displayed
  const isMasterPdf = currentPair ? (currentPair.actualMaster !== 'Master.pdf') : (masterFilename !== 'Master.pdf');
  const activeFindingsList = isIfu ? ifuFindings : isMasterPdf ? findings : newFindingsList;
  const activeMasterName = currentPair ? currentPair.master : masterFilename;
  const activeRevisedName = currentPair ? currentPair.revised : revisedFilename;
  const masterPdfPath = isIfu
    ? '/ifu/IFU-149990B_test.pdf'
    : isMasterPdf ? '/labels/additional changes master.png' : '/labels/Master.png';
  const revisedPdfPath = isIfu
    ? '/ifu/IFU-149990C_test.pdf'
    : isMasterPdf ? '/labels/additional changes revised.png' : '/labels/Revised.png';

  // Every label pair starts loading at the same time (no click needed); each pair
  // tracks its own progress and stays disabled until its own load completes.
  // This simulation only applies in bulk mode — single-pair mode renders immediately.
  const [pairLoadState, setPairLoadState] = useState<Record<number, { loading: boolean; progress: number }>>(() => {
    if (isTwentyPairs) {
      const state: Record<number, { loading: boolean; progress: number }> = {};
      for (let i = 1; i <= 20; i++) {
        state[i] = { loading: true, progress: 0 };
      }
      return state;
    }
    if (isTwoPairs) {
      return {
        1: { loading: false, progress: 100 },
        2: { loading: false, progress: 100 }
      };
    }
    return { 1: { loading: false, progress: 100 } };
  });

  useEffect(() => {
    if (!isTwentyPairs) return;
    let cancelled = false;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    const runLoad = (idx: number, steps: number, stepDelay: number, startDelay: number) => {
      const step = (n: number) => {
        if (cancelled) return;
        if (n > steps) {
          setPairLoadState(prev => ({ ...prev, [idx]: { loading: true, progress: 100 } }));
          timeouts.push(setTimeout(() => {
            if (cancelled) return;
            setPairLoadState(prev => ({ ...prev, [idx]: { loading: false, progress: 100 } }));
          }, 200));
          return;
        }
        setPairLoadState(prev => ({ ...prev, [idx]: { loading: true, progress: Math.round((n / steps) * 100) } }));
        timeouts.push(setTimeout(() => step(n + 1), stepDelay));
      };
      timeouts.push(setTimeout(() => step(1), startDelay));
    };

    // Stagger loading of all 20 pairs - 30 steps, 150ms per step, staggered by 800ms
    for (let i = 1; i <= 20; i++) {
      runLoad(i, 30, 150, (i - 1) * 800);
    }

    return () => {
      cancelled = true;
      timeouts.forEach(clearTimeout);
    };
  }, [isTwentyPairs]);

  const activePairLoad = pairLoadState[activePairIdx] ?? { loading: false, progress: 100 }
  const labelsLoading = activePairLoad.loading

  const filteredFindings = activeFindingsList
    .filter(f => activeTab === 'all' || f.type === activeTab)
    .filter(f => activeStatus === 'all' || f.classification?.toLowerCase() === activeStatus)

  // Fit zoom function helper
  const calcFit = (el: HTMLDivElement | null) => {
    if (!el) return 100
    const w = 680
    const h = 900
    const availH = el.clientHeight - 48
    const availW = el.clientWidth - 48
    if (availH > 0 && availW > 0) {
      return Math.round(Math.max(5, Math.min(200, Math.min(availW / w, availH / h) * 100)))
    }
    return 100
  }

  // Calculate and set initial fit zoom on mount and window resize
  useEffect(() => {
    const updateZoom = () => {
      const el = masterRef.current
      if (el && el.clientHeight > 100) {
        const fit = calcFit(el)
        setMasterZoom(fit)
        setRevisedZoom(fit)
      }
    }
    
    updateZoom()
    const t = setTimeout(updateZoom, 200)
    
    window.addEventListener('resize', updateZoom)
    return () => {
      clearTimeout(t)
      window.removeEventListener('resize', updateZoom)
    }
  }, [])

  // Recalculate fit zoom once both labels have finished loading
  // (the canvas isn't mounted, so clientHeight isn't available, until loading completes).
  useEffect(() => {
    if (labelsLoading) return
    const t = setTimeout(() => {
      const el = masterRef.current
      if (el) {
        const fit = calcFit(el)
        setMasterZoom(fit)
        setRevisedZoom(fit)
      }
    }, 50)
    return () => clearTimeout(t)
  }, [labelsLoading])

  // Sync scroll
  useEffect(() => {
    if (!syncScroll) return
    const m = masterRef.current
    const r = revisedRef.current
    if (!m || !r) return
    let lock = false
    const sync = (a: HTMLDivElement, b: HTMLDivElement) => () => {
      if (lock) return
      lock = true
      b.scrollTop = a.scrollTop
      b.scrollLeft = a.scrollLeft
      requestAnimationFrame(() => {
        lock = false
      })
    }
    const onM = sync(m, r)
    const onR = sync(r, m)
    m.addEventListener('scroll', onM)
    r.addEventListener('scroll', onR)
    return () => {
      m.removeEventListener('scroll', onM)
      r.removeEventListener('scroll', onR)
    }
  }, [syncScroll, masterZoom, revisedZoom, labelsLoading])

  // Ctrl+wheel Zoom effect
  useEffect(() => {
    const updater = (z: number, delta: number) =>
      Math.max(10, Math.min(200, z + (delta > 0 ? -10 : 10)))
    const handler = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return
      e.preventDefault()
      setMasterZoom((z) => updater(z, e.deltaY))
      setRevisedZoom((z) => updater(z, e.deltaY))
    }
    window.addEventListener('wheel', handler, { passive: false })
    return () => window.removeEventListener('wheel', handler)
  }, [])

  const handleFindingClick = (f: Finding) => {
    const isCollapsing = expandedId === f.id
    setExpandedId(isCollapsing ? null : f.id)
    if (isCollapsing) return

    // Jump each panel to the finding's page (IFU documents can have a different page count per version)
    if (isIfu && f.page) {
      setMasterPdfPage(Math.min(f.page, masterPdfPageCount))
      setRevisedPdfPage(Math.min(f.page, revisedPdfPageCount))
    }

    // Scroll to center finding
    setTimeout(() => {
      [masterRef.current, revisedRef.current].forEach((el, idx) => {
        if (!el) return
        const bb = idx === 0 ? f.master : f.revised
        const scale = (idx === 0 ? masterZoom : revisedZoom) / 100
        const containerW = el.clientWidth
        const containerH = el.clientHeight
        const targetX = bb.x * scale + (bb.w * scale) / 2 - containerW / 2
        const targetY = bb.y * scale + (bb.h * scale) / 2 - containerH / 2
        el.scrollTo({
          left: Math.max(0, targetX),
          top: Math.max(0, targetY),
          behavior: 'smooth'
        })
      })
    }, 50)
  }

  const handleExport = () => {
    setExporting(true)
    const reportFile = isIfu
      ? '/IFU-Report.pdf'
      : (isTwentyPairs && !lrfFlowActive)
      ? '/ProofX_Bulk_Report_20Pairs.pdf'
      : (isTwentyPairs && lrfFlowActive)
      ? '/ProofX_Bulk_LRF_Report_20Pairs.pdf'
      : (bulkMode && lrfFlowActive)
      ? '/ProofX_Bulk_LRF_Report.pdf'
      : bulkMode
      ? '/ProofX_Bulk_Report.pdf'
      : lrfFlowActive
      ? '/ProofX_Report.pdf'
      : '/ProofX_Report_VisualComparison.pdf'
    const fileName = isIfu
      ? 'IFU-Report.pdf'
      : (isTwentyPairs && !lrfFlowActive)
      ? 'ProofX_Bulk_Report_20Pairs.pdf'
      : (isTwentyPairs && lrfFlowActive)
      ? 'ProofX_Bulk_LRF_Report_20Pairs.pdf'
      : (bulkMode && lrfFlowActive)
      ? 'ProofX_Bulk_LRF_Report.pdf'
      : bulkMode
      ? 'ProofX_Bulk_Report.pdf'
      : lrfFlowActive
      ? 'ProofX_Report.pdf'
      : 'ProofX_Report_VisualComparison.pdf'
    const a = document.createElement('a')
    a.href = reportFile
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => setExporting(false), 1500)
  }

  const totalCount = hasSidebar ? bulkPairs.length : 1;
  const analysedCount = Object.values(pairLoadState).filter(s => !s.loading && s.progress === 100).length;
  const analysedPercent = Math.round((analysedCount / totalCount) * 100);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#F8F9FA]">
      <style>{`
        @keyframes bbox-pulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
        .bbox-pulse {
          animation: bbox-pulse 1.2s infinite ease-in-out;
        }
      `}</style>

      <NavBar
        showBack
        onBack={() => onNavigate(previousScreen || 'proofreader-dashboard')}
        title={`${activeMasterName} vs ${activeRevisedName}`}
        steps={isIfu ? [
          { label: 'Upload IFUs', done: true },
          { label: 'Analysis', active: true },
        ] : lrfFlowActive ? [
          { label: 'Label Requirement Form', done: true },
          { label: 'Upload Labels', done: true },
          { label: 'Analysis', active: true },
        ] : [
          { label: 'Upload Labels', done: true },
          { label: 'Analysis', active: true },
        ]}
        showProfile
        onProfileClick={() => onNavigate('profile')}
        onLogout={() => onNavigate('login')}
        profileName={previousScreen && previousScreen.includes('admin') ? 'Admin' : 'Athmika'}
        profileInitials="A"
        rightNode={
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate(previousScreen && previousScreen.includes('admin') ? 'admin-dashboard' : 'proofreader-dashboard')}
              title="Go to Home"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded border border-white/30 text-white/80 hover:text-white hover:border-white/60 transition-colors cursor-pointer"
            >
              <Home className="h-3.5 w-3.5" />
              HOME
            </button>
          </div>
        }
      />

      {/* Main content grid - docked side-by-side with no gap/padding */}
      <div className="flex flex-1 overflow-hidden min-h-0 min-w-0">
        {/* Left LABEL PAIRS sidebar */}
        {hasSidebar && (
          <aside className="w-[200px] border-r border-[#E0E0E0] bg-white flex flex-col flex-shrink-0">
            <div className="px-4 py-3 border-b border-[#E0E0E0] text-xs uppercase tracking-wide text-[#5F6368]">
              Label pairs
            </div>
            <div className="flex-1 overflow-y-auto">
              {bulkPairs.map(pair => {
                const isActive = activePairIdx === pair.idx
                const state = pairLoadState[pair.idx] ?? { loading: false, progress: 100 }
                const pairLoading = state.loading
                return (
                  <button
                    key={pair.idx}
                    onClick={() => { if (!pairLoading) setActivePairIdx(pair.idx) }}
                    disabled={pairLoading}
                    className={`w-full text-left px-4 py-3 border-b border-[#E0E0E0] flex flex-col gap-2 text-sm transition-colors ${
                      pairLoading ? 'opacity-50 cursor-not-allowed' : ''
                    } ${
                      isActive
                        ? 'bg-[#F1F3F4] border-l-2 border-l-[#1C2E59]'
                        : !pairLoading ? 'hover:bg-[#F1F3F4] border-l-2 border-l-transparent cursor-pointer' : 'border-l-2 border-l-transparent'
                    }`}
                  >
                    <span className="flex items-center justify-between w-full">
                      <span className="text-[#1A1A2E] truncate">
                        {pair.master}
                        <span className="block text-[11px] text-[#5F6368] truncate">
                          vs {pair.revised}
                        </span>
                      </span>
                      <span
                        className="ml-2 text-[11px] px-1.5 py-0.5 rounded-full text-white font-medium shrink-0"
                        style={{ backgroundColor: pair.count === 0 ? '#1D9E75' : '#1C2E59' }}
                      >
                        {pair.count}
                      </span>
                    </span>
                    {pairLoading && (
                      <span className="h-1 w-full bg-white rounded-full overflow-hidden border border-[#E0E0E0] block">
                        <span
                          className="h-full rounded-full bg-[#1C2E59] transition-[width] duration-150 ease-out block"
                          style={{ width: `${state.progress}%` }}
                        />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </aside>
        )}

        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          {/* Workflow indicator */}
          <div
            className="h-7 px-4 flex items-center justify-center flex-shrink-0 border-b border-[#E0E0E0]"
            style={{ backgroundColor: '#F8F9FA' }}
          >
            <span
              className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
              style={{
                backgroundColor: isIfu ? '#f1edff' : lrfFlowActive ? C.navyLight : C.orangeLight,
                color: isIfu ? '#5b3ecf' : lrfFlowActive ? C.navy : C.orangeText,
              }}
            >
              {isIfu ? 'IFU Document Comparison' : lrfFlowActive ? 'Proof Reading' : 'Visual Comparison'}
            </span>
          </div>

          <div className="flex flex-1 min-h-0">
            {/* Left label panel */}
            <LabelPanel
              title={activeMasterName}
              version="CURRENT VERSION LABEL"
              variant="master"
              findings={filteredFindings}
              selectedFinding={expandedId}
              zoom={masterZoom}
              scrollRef={masterRef}
              fileUrl={masterPdfPath}
              loading={labelsLoading}
              fileKind={isIfu ? 'pdf' : 'image'}
              docLabel={isIfu ? 'IFU' : 'LABEL'}
              pdfPage={masterPdfPage}
              onPdfPageChange={setMasterPdfPage}
              onPdfPageCountChange={setMasterPdfPageCount}
              onReset={() => {
                const fit = calcFit(masterRef.current)
                setMasterZoom(fit)
                masterRef.current?.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
                if (syncScroll) {
                  setRevisedZoom(fit)
                  revisedRef.current?.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
                }
              }}
            />

            {/* Divider */}
            <div className="w-1 flex-shrink-0 self-stretch" style={{ backgroundColor: '#1C2E59' }} aria-hidden />

            {/* Right label panel */}
            <LabelPanel
              title={activeRevisedName}
              version="NEW VERSION LABEL"
              variant="revised"
              findings={filteredFindings}
              selectedFinding={expandedId}
              zoom={revisedZoom}
              scrollRef={revisedRef}
              fileUrl={revisedPdfPath}
              loading={labelsLoading}
              fileKind={isIfu ? 'pdf' : 'image'}
              docLabel={isIfu ? 'IFU' : 'LABEL'}
              pdfPage={revisedPdfPage}
              onPdfPageChange={setRevisedPdfPage}
              onPdfPageCountChange={setRevisedPdfPageCount}
              onReset={() => {
                const fit = calcFit(revisedRef.current)
                setRevisedZoom(fit)
                revisedRef.current?.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
                if (syncScroll) {
                  setMasterZoom(fit)
                  masterRef.current?.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
                }
              }}
            />
          </div>
        </div>

        {/* Findings sidebar */}
        <aside className="w-[400px] border-l border-[#E0E0E0] bg-white flex flex-col flex-shrink-0">
          {/* Header section with categories */}
          <div className="px-4 py-3 shrink-0 border-b border-[#E0E0E0] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#1A1A2E] text-sm">Findings</span>
              <span className="text-xs text-[#5F6368]">
                <span className="text-[#1A1A2E] font-medium">{filteredFindings.length}</span>
                {(activeTab !== 'all' || activeStatus !== 'all') && (
                  <span className="text-[#5F6368]"> / {activeFindingsList.length}</span>
                )}{' '}
                {activeFindingsList.length === 1 ? 'difference' : 'differences'}
              </span>
            </div>

            {/* Category tabs */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <FilterPill
                label="All"
                active={activeTab === 'all'}
                color="#1C2E59"
                onClick={() => setActiveTab('all')}
              />
              {isIfu ? (
                IFU_CATEGORIES.map(cat => (
                  <FilterPill
                    key={cat.id}
                    label={cat.label}
                    active={activeTab === cat.id}
                    color={typeColors[cat.id].color}
                    onClick={() => setActiveTab(cat.id)}
                  />
                ))
              ) : (
                <>
                  <FilterPill
                    label="Text"
                    active={activeTab === 'text'}
                    color="#378ADD"
                    onClick={() => setActiveTab('text')}
                  />
                  <FilterPill
                    label="Graphics"
                    active={activeTab === 'graphics'}
                    color="#DC2626"
                    onClick={() => setActiveTab('graphics')}
                  />
                  <FilterPill
                    label="Barcode"
                    active={activeTab === 'barcode'}
                    color="#BA7517"
                    onClick={() => setActiveTab('barcode')}
                  />
                </>
              )}
            </div>

            {/* LRF Status tabs */}
            {lrfFlowActive && (
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5 border-t border-[#E0E0E0]">
                <span className="text-[10px] uppercase tracking-wider text-[#5F6368] mr-0.5">Status</span>
                <FilterPill
                  label="All"
                  active={activeStatus === 'all'}
                  color="#1C2E59"
                  onClick={() => setActiveStatus('all')}
                />
                <FilterPill
                  label="✓ Expected"
                  active={activeStatus === 'expected'}
                  color="#1D9E75"
                  onClick={() => setActiveStatus('expected')}
                />
                <FilterPill
                  label="⚠ Unexpected"
                  active={activeStatus === 'unexpected'}
                  color="#D97706"
                  onClick={() => setActiveStatus('unexpected')}
                />
              </div>
            )}
          </div>

          {/* Scrollable continuous list */}
          <div className="flex-1 overflow-y-auto bg-white">
            {filteredFindings.length === 0 ? (
              <div className="px-5 py-4 text-xs text-[#5F6368] italic">
                No differences found matching filters.
              </div>
            ) : (() => {
              // Group by category
              const cats = isIfu
                ? IFU_CATEGORIES.map(c => ({ id: c.id, label: c.label, color: typeColors[c.id].color }))
                : ([
                    { id: 'text', label: 'Text', color: '#378ADD' },
                    { id: 'graphics', label: 'Graphics', color: '#DC2626' },
                    { id: 'barcode', label: 'Barcode', color: '#BA7517' }
                  ] as const);

              return cats.map(cat => {
                if (activeTab !== 'all' && activeTab !== cat.id) return null;
                const items = filteredFindings.filter(f => f.type === cat.id);

                return (
                  <div key={cat.id}>
                    {/* Category Divider Header */}
                    <div className="px-5 py-2.5 bg-[#F1F3F4] border-y border-[#E0E0E0] flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="text-xs uppercase tracking-wide text-[#1A1A2E] font-medium">
                        {cat.label}
                      </span>
                      <span className="text-xs text-[#5F6368]">
                        · {items.length} {items.length === 1 ? "difference" : "differences"}
                      </span>
                    </div>

                    {items.length === 0 ? (
                      <div className="px-5 py-4 text-xs text-[#5F6368] italic">
                        No differences found
                      </div>
                    ) : items.map(f => {
                      const isSelected = expandedId === f.id;
                      return (
                        <button
                          key={f.id}
                          onClick={() => handleFindingClick(f)}
                          className={`w-full text-left px-5 py-3.5 border-b border-[#E0E0E0] transition-colors ${
                            isSelected ? "bg-[#F1F3F4]" : "hover:bg-[#F1F3F4]"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1.5">
                            <span
                              className="text-[10px] font-semibold px-1.5 py-0.5 rounded text-white flex-shrink-0"
                              style={{ backgroundColor: cat.color }}
                            >
                              {f.id}
                            </span>
                            <span className="text-sm text-[#1A1A2E] flex-1 min-w-0">{f.summary}</span>
                            {lrfFlowActive && f.classification && (
                              <span
                                className="text-[10px] font-semibold px-1.5 py-0.5 rounded text-white flex-shrink-0"
                                style={{
                                  backgroundColor: f.classification === 'Expected' ? '#1D9E75' : '#D97706'
                                }}
                              >
                                {f.classification}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-[#5F6368] leading-relaxed pl-1">
                            <div>
                              <span className="text-[#1A1A2E]/70">{isIfu ? 'Current had:' : 'Master had:'}</span> {f.masterHad}
                            </div>
                            <div>
                              <span className="text-[#1A1A2E]/70">Revised has:</span> {f.revisedHas}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              });
            })()}
          </div>
        </aside>
      </div>

      {/* Bottom bar */}
      <footer
        className="flex items-center justify-between px-6 py-2.5 bg-white border-t border-[#E0E0E0] text-xs text-[#5F6368] shrink-0"
      >
        <div className="flex items-center gap-2 font-normal text-[#5F6368]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#1C2E59]" />
          <span className="flex items-center gap-3">
            <span>
              {labelsLoading
                ? 'Loading labels…'
                : isTwentyPairs
                ? `Pair ${activePairIdx} of 20`
                : isTwoPairs
                ? `Pair ${activePairIdx} of 2`
                : 'Analysis complete'}
            </span>
            {hasSidebar && (
              <div className="flex items-center gap-2.5 pl-3 border-l border-gray-200">
                <span className="font-semibold text-slate-500">
                  Analysed: {analysedCount} / {totalCount} labels ({analysedPercent}% complete)
                </span>
                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden shrink-0">
                  <div
                    className="h-full bg-[#1C2E59] rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${analysedPercent}%` }}
                  />
                </div>
              </div>
            )}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {!isIfu && (
            <>
              <label className="flex items-center gap-2 cursor-pointer">
                <span>Sync scroll & zoom</span>
                <button
                  onClick={() => {
                    setSyncScroll((s) => {
                      if (!s) setRevisedZoom(masterZoom);
                      return !s;
                    });
                  }}
                  className={`relative inline-flex h-4 w-7 rounded-full transition-colors ${
                    syncScroll ? "bg-[#F07922]" : "bg-[#F1F3F4] border border-[#E0E0E0]"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-3 w-3 rounded-full bg-white border border-[#E0E0E0] transition-transform ${
                      syncScroll ? "translate-x-3.5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </label>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setMasterZoom((z) => Math.max(10, z - 10))
                    setRevisedZoom((z) => Math.max(10, z - 10))
                  }}
                  className="h-6 w-6 rounded border border-[#E0E0E0] hover:bg-[#F1F3F4] flex items-center justify-center font-semibold text-slate-700 cursor-pointer"
                >
                  −
                </button>
                {syncScroll ? (
                  <span className="w-10 text-center text-[#1A1A2E] font-medium">{masterZoom}%</span>
                ) : (
                  <span className="flex items-center gap-1 text-[#1A1A2E] text-[11px] font-medium">
                    <span className="text-[#E02424]">{masterZoom}%</span>
                    <span className="text-slate-300">/</span>
                    <span className="text-[#1A56DB]">{revisedZoom}%</span>
                  </span>
                )}
                <button
                  onClick={() => {
                    setMasterZoom((z) => Math.min(200, z + 10))
                    setRevisedZoom((z) => Math.min(200, z + 10))
                  }}
                  className="h-6 w-6 rounded border border-[#E0E0E0] hover:bg-[#F1F3F4] flex items-center justify-center font-semibold text-slate-700 cursor-pointer"
                >
                  +
                </button>
              </div>
            </>
          )}

          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-7 py-2.5 text-[13px] font-bold uppercase tracking-widest rounded-lg shadow-sm bg-[#F07922] hover:bg-[#D9660C] text-white transition-colors cursor-pointer"
          >
            {exporting ? 'GENERATING PDF…' : 'EXPORT REPORT'}
          </button>
        </div>
      </footer>
    </div>
  )
}
