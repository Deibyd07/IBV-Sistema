import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useVehiculoStore } from '~/stores/vehiculoStore'

describe('useVehiculoStore', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  // ─── Computed ─────────────────────────────────────────────────────────────
  describe('computed properties', () => {
    it('total reflects 6 initial vehicles', () => {
      const store = useVehiculoStore()
      expect(store.total).toBe(6)
    })

    it('recibidos counts non-dispatched vehicles', () => {
      const store = useVehiculoStore()
      expect(store.recibidos).toBe(5) // vp-1..vp-5 not despachado
    })

    it('conImpronta counts vehicles with completed impronta', () => {
      const store = useVehiculoStore()
      // vp-1,2,4,5,6 = true; vp-3 = false
      expect(store.conImpronta).toBe(5)
    })

    it('conInventario counts vehicles with approved inventory', () => {
      const store = useVehiculoStore()
      // vp-1, vp-2, vp-6
      expect(store.conInventario).toBe(3)
    })

    it('listosDespacho counts vehicles in listo_despacho state', () => {
      const store = useVehiculoStore()
      expect(store.listosDespacho).toBe(2) // vp-1 and vp-2
    })

    it('despachados counts dispatched vehicles', () => {
      const store = useVehiculoStore()
      expect(store.despachados).toBe(1) // vp-6
    })

    it('pendientesImpronta counts non-dispatched without completed impronta', () => {
      const store = useVehiculoStore()
      expect(store.pendientesImpronta).toBe(1) // vp-3
    })

    it('pendientesInventario counts vehicles with impronta but no approved inventory', () => {
      const store = useVehiculoStore()
      expect(store.pendientesInventario).toBe(2) // vp-4, vp-5
    })
  })

  // ─── Getters ──────────────────────────────────────────────────────────────
  describe('getters', () => {
    it('getByVin is case-insensitive and returns the correct vehicle', () => {
      const store = useVehiculoStore()
      const v = store.getByVin('1HGBH41JXMN109186'.toLowerCase())
      expect(v).toBeDefined()
      expect(v!.id).toBe('vp-1')
    })

    it('getById returns the correct vehicle', () => {
      const store = useVehiculoStore()
      expect(store.getById('vp-3')!.marca).toBe('Nissan')
    })

    it('getListosParaDespacho returns only vehicles ready for dispatch', () => {
      const store = useVehiculoStore()
      const list = store.getListosParaDespacho
      expect(list).toHaveLength(2)
      expect(list.every((v) => v.improntaCompletada && v.inventarioAprobado && !v.despachado)).toBe(
        true
      )
    })

    it('getPendientesInventario returns vehicles awaiting inventory', () => {
      const store = useVehiculoStore()
      const list = store.getPendientesInventario
      expect(list).toHaveLength(2)
    })

    it('getPendientesImpronta returns vehicles awaiting impronta', () => {
      const store = useVehiculoStore()
      const list = store.getPendientesImpronta
      expect(list).toHaveLength(1)
      expect(list[0].id).toBe('vp-3')
    })
  })

  // ─── puedeDespachar ───────────────────────────────────────────────────────
  describe('puedeDespachar()', () => {
    it('returns ok: true for a vehicle listo_despacho', () => {
      const store = useVehiculoStore()
      expect(store.puedeDespachar('1HGBH41JXMN109186').ok).toBe(true)
    })

    it('returns ok: false for a vehicle without completed impronta', () => {
      const store = useVehiculoStore()
      const result = store.puedeDespachar('WVWZZZ3CZWE123789') // vp-3 impronta pendiente
      expect(result.ok).toBe(false)
      expect(result.razon).toContain('impronta')
    })

    it('returns ok: false for a vehicle without approved inventory', () => {
      const store = useVehiculoStore()
      const result = store.puedeDespachar('KNDJP3A53H7654321') // vp-4 inventario pendiente
      expect(result.ok).toBe(false)
      expect(result.razon).toContain('inventario')
    })

    it('returns ok: false for an already dispatched vehicle', () => {
      const store = useVehiculoStore()
      const result = store.puedeDespachar('1FADP3F29JL234567') // vp-6 despachado
      expect(result.ok).toBe(false)
      expect(result.razon).toContain('despachado')
    })

    it('returns ok: false for an unknown VIN', () => {
      const store = useVehiculoStore()
      const result = store.puedeDespachar('UNKNOWN_VIN')
      expect(result.ok).toBe(false)
    })
  })

  // ─── registrarRecepcion ───────────────────────────────────────────────────
  describe('registrarRecepcion()', () => {
    it('adds a new vehicle and increments total', () => {
      const store = useVehiculoStore()
      store.registrarRecepcion({
        vin: 'NEW_VIN_001',
        marca: 'Renault',
        modelo: 'Logan',
        anio: '2025',
        color: 'Gris',
      })
      expect(store.total).toBe(7)
    })

    it('new vehicle starts with estado recibido', () => {
      const store = useVehiculoStore()
      store.registrarRecepcion({
        vin: 'NEW_VIN_002',
        marca: 'Chevrolet',
        modelo: 'Sail',
        anio: '2024',
        color: 'Negro',
      })
      const v = store.getByVin('NEW_VIN_002')!
      expect(v.estado).toBe('recibido')
      expect(v.improntaCompletada).toBe(false)
      expect(v.despachado).toBe(false)
    })

    it('does not duplicate if VIN already exists', () => {
      const store = useVehiculoStore()
      store.registrarRecepcion({
        vin: '1HGBH41JXMN109186', // already exists as vp-1
        marca: 'Toyota',
        modelo: 'Corolla',
        anio: '2024',
        color: 'Blanco',
      })
      expect(store.total).toBe(6) // no change
    })
  })

  // ─── vincularImpronta / completarImpronta ─────────────────────────────────
  describe('vincularImpronta() / completarImpronta()', () => {
    it('vincularImpronta sets improntaId and folio', () => {
      const store = useVehiculoStore()
      store.vincularImpronta('WVWZZZ3CZWE123789', 'imp-999', 'IMP-0099')
      const v = store.getByVin('WVWZZZ3CZWE123789')!
      expect(v.improntaId).toBe('imp-999')
      expect(v.improntaFolio).toBe('IMP-0099')
    })

    it('completarImpronta sets improntaCompletada and updates estado', () => {
      const store = useVehiculoStore()
      store.completarImpronta('WVWZZZ3CZWE123789') // vp-3, was impronta_pendiente
      const v = store.getByVin('WVWZZZ3CZWE123789')!
      expect(v.improntaCompletada).toBe(true)
      expect(v.estado).toBe('inventario_pendiente')
    })
  })

  // ─── aprobarInventario ────────────────────────────────────────────────────
  describe('aprobarInventario()', () => {
    it('marks inventory approved and updates estado to listo_despacho', () => {
      const store = useVehiculoStore()
      // vp-4: improntaCompletada, !inventarioAprobado
      store.aprobarInventario(
        'KNDJP3A53H7654321',
        { totalItems: 30, aprobados: 30, fallas: 0, na: 0 },
        'Inspector Ana'
      )
      const v = store.getByVin('KNDJP3A53H7654321')!
      expect(v.inventarioAprobado).toBe(true)
      expect(v.estado).toBe('listo_despacho')
    })
  })

  // ─── rechazarInventario ───────────────────────────────────────────────────
  describe('rechazarInventario()', () => {
    it('marks inventory completed but not approved', () => {
      const store = useVehiculoStore()
      store.rechazarInventario('KNDJP3A53H7654321', 'Falta pieza')
      const v = store.getByVin('KNDJP3A53H7654321')!
      expect(v.inventarioCompletado).toBe(true)
      expect(v.inventarioAprobado).toBe(false)
      expect(v.inventarioResultado?.nota).toBe('Falta pieza')
    })
  })

  // ─── despachar ────────────────────────────────────────────────────────────
  describe('despachar()', () => {
    it('dispatches a vehicle and returns true', () => {
      const store = useVehiculoStore()
      const result = store.despachar('1HGBH41JXMN109186', 'LT-2026-0002', 'Luis Despachador')
      expect(result).toBe(true)
      const v = store.getByVin('1HGBH41JXMN109186')!
      expect(v.despachado).toBe(true)
      expect(v.estado).toBe('despachado')
      expect(v.lotDespacho).toBe('LT-2026-0002')
    })

    it('returns false and rejects dispatching an incomplete vehicle', () => {
      const store = useVehiculoStore()
      const result = store.despachar('WVWZZZ3CZWE123789', 'LT-X', 'Luis') // vp-3 not ready
      expect(result).toBe(false)
    })

    it('persists dispatch to localStorage', () => {
      const store = useVehiculoStore()
      store.despachar('1HGBH41JXMN109186', 'LT-2026-0099', 'Luis')
      const stored = JSON.parse(localStorage.getItem('ibv_vehiculos_pipeline') || '[]')
      const v = stored.find((x: { vin: string }) => x.vin === '1HGBH41JXMN109186')
      expect(v.despachado).toBe(true)
    })
  })
})
