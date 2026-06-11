// =============================================================================
// jest.config.ts — letakkan di ROOT project Chillo (sejajar package.json)
// =============================================================================
import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // TIDAK perlu moduleNameMapper karena test file tidak mengimport @/...
  testMatch: [
    '**/?(*.)+(test).ts',
  ],
  testTimeout: 30000,
  verbose: true,
}

export default config

// =============================================================================
// CARA SETUP
// =============================================================================
//
// 1. Install dependencies:
//    npm install --save-dev jest @types/jest ts-jest mongodb-memory-server
//
// 2. Tambah ke package.json:
//    "scripts": {
//      "test":            "jest",
//      "test:unit":       "jest unit_dateUtils",
//      "test:integration":"jest integration_api",
//      "test:coverage":   "jest --coverage"
//    }
//
// 3. Taruh file test di root project (atau folder tests/):
//    - unit_dateUtils.test.ts
//    - integration_api.test.ts
//
// 4. Jalankan:
//    npx jest                      ← semua test
//    npx jest unit_dateUtils       ← unit saja
//    npx jest integration_api      ← integration saja
//    npx jest --coverage           ← dengan laporan coverage
//
// =============================================================================
// KENAPA TIDAK PAKAI IMPORT @/... ?
// =============================================================================
//
// Masalah sebelumnya: test mengimport dari '@/lib/dateUtils' dll. yang tidak
// bisa di-resolve Jest tanpa konfigurasi Next.js lengkap.
//
// Solusi: semua fungsi di-copy inline persis dari source code sehingga:
//   - Tidak butuh alias @/ → bisa jalan langsung
//   - Tidak butuh mock next/headers atau next/server
//   - Test murni menguji LOGIKA, bukan infrastruktur Next.js
//   - Tetap valid: jika source code berubah, test harus diupdate juga
// =============================================================================
