/**
 * Branch Mapping Configuration
 * Maps SIVFU branch codes to ERP branch codes
 * 
 * SIVFU uses direct DB queries with legacy branch codes
 * ERP uses standardized branch codes from ERPNext
 */

// Active ERP branches (as of Dec 2025)
export const ACTIVE_ERP_BRANCHES = [
  'YGY',        // Yogyakarta
  'PTK',        // Pontianak
  'PLG',        // Palembang
  'PKU',        // Pekanbaru
  'PDG',        // Padang
  'MND',        // Manado
  'MKS',        // Makassar
  'MKP',        // Marketplace
  'MDN',        // Medan
  'KPG',        // Kupang
  'JATIM',      // Surabaya
  'JABAR-JKT',  // Jakarta
  'HO',         // Head Office
  'BKP',        // Balikpapan
  'BJM',        // Banjarmasin
  'BALI',       // Denpasar
  'AMB',        // Ambon
] as const

// Dead branches (no longer active in ERP)
export const DEAD_BRANCHES = [
  'SMR1',  // Samarinda - DEAD
] as const

// Special branches (display only, no ERP mapping)
export const SPECIAL_BRANCHES = [
  'PHL',   // Philippine - Display only, no ERP equivalent
] as const

/**
 * SIVFU to ERP Branch Mapping
 * 
 * Rules:
 * 1. Suffix "1" branches merge to parent (e.g., PDG1 → PDG)
 * 2. Dead branches (SMR1) are ignored in combined reports
 * 3. Special branches (PHL) display in SIVFU only
 * 4. Regional consolidations (SMG → YGY, JMB → PLG, etc.)
 */
export const BRANCH_MAPPING: Record<string, string> = {
  // ===== EXACT MATCH =====
  'YGY': 'YGY',         // Yogyakarta
  'PTK': 'PTK',         // Pontianak
  'PLG': 'PLG',         // Palembang
  'PKU': 'PKU',         // Pekanbaru
  'PDG': 'PDG',         // Padang
  'MND': 'MND',         // Manado
  'MKS': 'MKS',         // Makassar
  'MKP': 'MKP',         // Marketplace
  'MDN': 'MDN',         // Medan
  'KPG': 'KPG',         // Kupang
  'HO': 'HO',           // Head Office
  'BKP': 'BKP',         // Balikpapan
  'BJM': 'BJM',         // Banjarmasin
  'AMB': 'AMB',         // Ambon
  
  // ===== REGIONAL MAPPINGS =====
  'JKT': 'JABAR-JKT',   // Jakarta → JABAR-JKT
  'SBY': 'JATIM',       // Surabaya → JATIM
  'DPS': 'BALI',        // Denpasar → BALI
  'DP1': 'BALI',        // Denpasar 1 → BALI
  
  // ===== SUFFIX "1" BRANCHES - MERGE TO PARENT =====
  'PDG1': 'PDG',        // Padang 1 → Padang
  'MDN1': 'MDN',        // Medan 1 → Medan
  'PKU1': 'PKU',        // Pekanbaru 1 → Pekanbaru
  'AMB1': 'AMB',        // Ambon 1 → Ambon
  'PLG1': 'PLG',        // Palembang 1 → Palembang
  'MKS1': 'MKS',        // Makassar 1 → Makassar
  'BJM1': 'BJM',        // Banjarmasin 1 → Banjarmasin
  'PTK1': 'PTK',        // Pontianak 1 → Pontianak
  
  // ===== CONSOLIDATED BRANCHES =====
  'HO2': 'HO',          // Head Office 2 → Head Office
  'LPG': 'JABAR-JKT',   // Lampung → moved to Jakarta
  'LPG1': 'JABAR-JKT',  // Lampung 1 → moved to Jakarta
  'SMG': 'YGY',         // Semarang → merged to Yogyakarta
  'SMG1': 'YGY',        // Semarang 1 → merged to Yogyakarta
  'JMB1': 'PLG',        // Jambi → merged to Palembang
  'PLU1': 'MND',        // Palu → merged to Manado
  
  // ===== MARKETPLACE SUBDIVISIONS - STANDALONE =====
  'MKPS': 'MKPS',       // MKP Semarang (standalone)
  'MKPM': 'MKPM',       // MKP Manado (standalone)
  'MKPN': 'MKPN',       // MKP Medan (standalone)
  
  // ===== SPECIAL BRANCHES (No ERP mapping) =====
  // 'PHL': null,       // Philippine - display only, no merge
}

/**
 * Check if a SIVFU branch is active (has ERP mapping or is special)
 */
export function isActiveBranch(sivfuBranch: string): boolean {
  // Dead branches
  if (DEAD_BRANCHES.includes(sivfuBranch as any)) {
    return false
  }
  
  // Has mapping or is special branch
  return BRANCH_MAPPING.hasOwnProperty(sivfuBranch) || 
         SPECIAL_BRANCHES.includes(sivfuBranch as any)
}

/**
 * Map SIVFU branch to ERP branch
 * Returns null for dead branches or unmapped branches
 */
export function mapSivfuToErp(sivfuBranch: string): string | null {
  // Dead branches return null
  if (DEAD_BRANCHES.includes(sivfuBranch as any)) {
    return null
  }
  
  // Special branches (display only) return null for ERP mapping
  if (SPECIAL_BRANCHES.includes(sivfuBranch as any)) {
    return null
  }
  
  return BRANCH_MAPPING[sivfuBranch] || null
}

/**
 * Get branch display name for UI
 */
export function getBranchDisplayName(branchCode: string): string {
  const displayNames: Record<string, string> = {
    'JABAR-JKT': 'Jakarta',
    'JATIM': 'Surabaya',
    'BALI': 'Denpasar',
    'YGY': 'Yogyakarta',
    'PTK': 'Pontianak',
    'PLG': 'Palembang',
    'PKU': 'Pekanbaru',
    'PDG': 'Padang',
    'MND': 'Manado',
    'MKS': 'Makassar',
    'MKP': 'Marketplace',
    'MDN': 'Medan',
    'KPG': 'Kupang',
    'HO': 'Head Office',
    'BKP': 'Balikpapan',
    'BJM': 'Banjarmasin',
    'AMB': 'Ambon',
    'MKPS': 'MKP Semarang',
    'MKPM': 'MKP Manado',
    'MKPN': 'MKP Medan',
    'PHL': 'Philippine',
  }
  
  return displayNames[branchCode] || branchCode
}

/**
 * Get reverse mapping (ERP → SIVFU branches that map to it)
 */
export function getErpToSivfuMapping(): Record<string, string[]> {
  const reverseMap: Record<string, string[]> = {}
  
  Object.entries(BRANCH_MAPPING).forEach(([sivfu, erp]) => {
    if (!reverseMap[erp]) {
      reverseMap[erp] = []
    }
    reverseMap[erp].push(sivfu)
  })
  
  return reverseMap
}

/**
 * Get all SIVFU branches that should be displayed
 * (excludes dead branches only)
 */
export function getActiveSivfuBranches(): string[] {
  return Object.keys(BRANCH_MAPPING)
    .concat(SPECIAL_BRANCHES as unknown as string[])
    .filter(branch => !DEAD_BRANCHES.includes(branch as any))
}

/**
 * Mapping summary for documentation
 */
export const MAPPING_SUMMARY = {
  total_sivfu_branches: 35,
  active_erp_branches: ACTIVE_ERP_BRANCHES.length,
  dead_branches: DEAD_BRANCHES.length,
  special_branches: SPECIAL_BRANCHES.length,
  mapped_branches: Object.keys(BRANCH_MAPPING).length,
  
  consolidations: {
    'JABAR-JKT': ['JKT', 'LPG', 'LPG1'],
    'YGY': ['YGY', 'SMG', 'SMG1'],
    'PLG': ['PLG', 'PLG1', 'JMB1'],
    'MND': ['MND', 'PLU1'],
    'PDG': ['PDG', 'PDG1'],
    'MDN': ['MDN', 'MDN1'],
    'PKU': ['PKU', 'PKU1'],
    'AMB': ['AMB', 'AMB1'],
    'MKS': ['MKS', 'MKS1'],
    'BJM': ['BJM', 'BJM1'],
    'PTK': ['PTK', 'PTK1'],
    'HO': ['HO', 'HO2'],
    'BALI': ['DPS', 'DP1'],
  },
  
  standalone_marketplace: ['MKPS', 'MKPM', 'MKPN'],
  special_display_only: ['PHL'],
  dead_ignored: ['SMR1'],
} as const
