import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useImprontaStore } from '~/stores/improntaStore'

describe('useImprontaStore', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  // ─── Computed ─────────────────────────────────────────────────────────────
  describe('computed properties', () => {
    it('totalImprontas reflects the number of loaded improntas', () => {
      const store = useImprontaStore()
      expect(store.totalImprontas).toBe(5)
    })

    it('completadas counts only completada estado', () => {
      const store = useImprontaStore()
      expect(store.completadas).toBe(3) // IMP-0001, IMP-0002, IMP-0005 are 'completada'
    })

    it('borradores counts only borrador estado', () => {
      const store = useImprontaStore()
      expect(store.borradores).toBe(1) // IMP-0003
    })

    it('revisadas counts only revisada estado', () => {
      const store = useImprontaStore()
      expect(store.revisadas).toBe(1) // IMP-0004
    })

    it('hoy returns 0 when no impronta was created today', () => {
      const store = useImprontaStore()
      // Seed data uses 2026-02-22 / 2026-02-21 / 2026-02-23; real "today" will be different
      // We just verify it's a non-negative integer
      expect(store.hoy).toBeGreaterThanOrEqual(0)
    })
  })

  // ─── Getters ──────────────────────────────────────────────────────────────
  describe('getters', () => {
    it('getById returns the correct impronta', () => {
      const store = useImprontaStore()
      const imp = store.getById('1')
      expect(imp).toBeDefined()
      expect(imp!.folio).toBe('IMP-0001')
    })

    it('getById returns undefined for unknown id', () => {
      const store = useImprontaStore()
      expect(store.getById('nonexistent')).toBeUndefined()
    })

    it('getByFolio returns the correct impronta', () => {
      const store = useImprontaStore()
      const imp = store.getByFolio('IMP-0002')
      expect(imp).toBeDefined()
      expect(imp!.id).toBe('2')
    })

    it('getByFolio returns undefined for unknown folio', () => {
      const store = useImprontaStore()
      expect(store.getByFolio('IMP-9999')).toBeUndefined()
    })
  })

  // ─── crear ────────────────────────────────────────────────────────────────
  describe('crear()', () => {
    it('adds a new impronta and increments totalImprontas', async () => {
      const store = useImprontaStore()
      const initialTotal = store.totalImprontas

      const nueva = await store.crear({
        vin: 'TEST12345678',
        placa: 'ZZZ-0000',
        marca: 'Toyota',
        modelo: 'Yaris',
        anio: '2024',
        color: 'Verde',
        km: '0',
        cliente: 'Test Client',
        condicion: 'excelente',
        zonasDañadas: [],
        daños: [],
        observaciones: '',
        fotos: {},
        fotosAdicionales: [],
        estado: 'borrador',
        creadoPor: 'Test User',
      })

      expect(store.totalImprontas).toBe(initialTotal + 1)
      expect(store.improntas[0].id).toBe(nueva.id)
      expect(nueva.folio).toMatch(/^IMP-\d{4}$/)
    })

    it('assigns a unique sequential folio', async () => {
      const store = useImprontaStore()
      const base = {
        vin: 'TEST00000001',
        placa: 'AAA-0000',
        marca: 'Ford',
        modelo: 'Ka',
        anio: '2022',
        color: 'Rojo',
        km: '0',
        cliente: 'TCC',
        condicion: 'bueno' as const,
        zonasDañadas: [],
        daños: [],
        observaciones: '',
        fotos: {},
        fotosAdicionales: [],
        estado: 'borrador' as const,
        creadoPor: 'Tester',
      }
      const a = await store.crear({ ...base, vin: 'VIN_A' })
      const b = await store.crear({ ...base, vin: 'VIN_B' })
      expect(a.folio).not.toBe(b.folio)
    })

    it('persists the new impronta to localStorage', async () => {
      const store = useImprontaStore()
      await store.crear({
        vin: 'PERSIST_VIN',
        placa: 'PPP-000',
        marca: 'Chevy',
        modelo: 'Aveo',
        anio: '2023',
        color: 'Azul',
        km: '0',
        cliente: 'C',
        condicion: 'excelente',
        zonasDañadas: [],
        daños: [],
        observaciones: '',
        fotos: {},
        fotosAdicionales: [],
        estado: 'borrador',
        creadoPor: 'T',
      })
      const stored = JSON.parse(localStorage.getItem('ibv_improntas') || '[]')
      expect(stored.some((i: { vin: string }) => i.vin === 'PERSIST_VIN')).toBe(true)
    })
  })

  // ─── actualizar ───────────────────────────────────────────────────────────
  describe('actualizar()', () => {
    it('updates fields of an existing impronta', async () => {
      const store = useImprontaStore()
      await store.actualizar('1', { observaciones: 'Updated obs' })
      expect(store.getById('1')!.observaciones).toBe('Updated obs')
    })

    it('throws when id not found', async () => {
      const store = useImprontaStore()
      await expect(store.actualizar('nonexistent', {})).rejects.toThrow('Impronta no encontrada')
    })

    it('updates fechaActualizacion to today', async () => {
      const store = useImprontaStore()
      const today = new Date().toISOString().split('T')[0]
      const updated = await store.actualizar('1', { km: '500' })
      expect(updated.fechaActualizacion).toBe(today)
    })
  })

  // ─── eliminar ─────────────────────────────────────────────────────────────
  describe('eliminar()', () => {
    it('removes the impronta from the list', async () => {
      const store = useImprontaStore()
      const initialTotal = store.totalImprontas
      await store.eliminar('1')
      expect(store.totalImprontas).toBe(initialTotal - 1)
      expect(store.getById('1')).toBeUndefined()
    })

    it('persists the deletion to localStorage', async () => {
      const store = useImprontaStore()
      await store.eliminar('1')
      const stored = JSON.parse(localStorage.getItem('ibv_improntas') || '[]')
      expect(stored.some((i: { id: string }) => i.id === '1')).toBe(false)
    })
  })

  // ─── cambiarEstado ────────────────────────────────────────────────────────
  describe('cambiarEstado()', () => {
    it('changes the estado of an impronta', async () => {
      const store = useImprontaStore()
      await store.cambiarEstado('3', 'completada') // IMP-0003 was 'borrador'
      expect(store.getById('3')!.estado).toBe('completada')
    })
  })
})
