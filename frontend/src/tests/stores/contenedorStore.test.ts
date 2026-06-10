import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useContenedorStore } from '~/stores/contenedorStore'

describe('useContenedorStore', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  // ─── Computed ─────────────────────────────────────────────────────────────
  describe('computed properties', () => {
    it('totalContenedores reflects 3 initial containers', () => {
      const store = useContenedorStore()
      expect(store.totalContenedores).toBe(3)
    })

    it('pendientes counts containers with estado pendiente', () => {
      const store = useContenedorStore()
      expect(store.pendientes).toBe(2) // CONT-2026-0001 and CONT-2026-0002
    })

    it('enRecepcion counts containers with estado en_recepcion', () => {
      const store = useContenedorStore()
      expect(store.enRecepcion).toBe(0)
    })

    it('completados counts containers with estado completado', () => {
      const store = useContenedorStore()
      expect(store.completados).toBe(1) // CONT-2026-0003
    })
  })

  // ─── Getters ──────────────────────────────────────────────────────────────
  describe('getters', () => {
    it('getById returns correct container', () => {
      const store = useContenedorStore()
      const cnt = store.getById('1')
      expect(cnt).toBeDefined()
      expect(cnt!.codigo).toBe('CONT-2026-0001')
    })

    it('getById returns undefined for unknown id', () => {
      const store = useContenedorStore()
      expect(store.getById('99')).toBeUndefined()
    })

    it('getByCodigo is case-insensitive', () => {
      const store = useContenedorStore()
      const cnt = store.getByCodigo('cont-2026-0002')
      expect(cnt).toBeDefined()
      expect(cnt!.id).toBe('2')
    })

    it('buscarVehiculoPorCodigo finds a vehicle by impronta code', () => {
      const store = useContenedorStore()
      const result = store.buscarVehiculoPorCodigo('IMP-VH-001')
      expect(result).toBeDefined()
      expect(result!.vehiculo.vin).toBe('1HGBH41JXMN109186')
    })

    it('buscarVehiculoPorVin finds a vehicle by VIN', () => {
      const store = useContenedorStore()
      const result = store.buscarVehiculoPorVin('3VWDX7AJ5BM123456')
      expect(result).toBeDefined()
      expect(result!.contenedor.id).toBe('1')
    })

    it('buscarVehiculoPorVin returns undefined for unknown VIN', () => {
      const store = useContenedorStore()
      expect(store.buscarVehiculoPorVin('UNKNOWN_VIN')).toBeUndefined()
    })
  })

  // ─── iniciarRecepcion ─────────────────────────────────────────────────────
  describe('iniciarRecepcion()', () => {
    it('changes estado to en_recepcion and sets recibidoPor', () => {
      const store = useContenedorStore()
      store.iniciarRecepcion('1', 'María Recibidora')

      const cnt = store.getById('1')!
      expect(cnt.estado).toBe('en_recepcion')
      expect(cnt.recibidoPor).toBe('María Recibidora')
    })

    it('increments enRecepcion computed', () => {
      const store = useContenedorStore()
      store.iniciarRecepcion('1', 'Tester')
      expect(store.enRecepcion).toBe(1)
    })

    it('persists the change to localStorage', () => {
      const store = useContenedorStore()
      store.iniciarRecepcion('1', 'Tester')
      const stored = JSON.parse(localStorage.getItem('ibv_contenedores') || '[]')
      const cnt = stored.find((c: { id: string }) => c.id === '1')
      expect(cnt.estado).toBe('en_recepcion')
    })
  })

  // ─── marcarVehiculoEscaneado ───────────────────────────────────────────────
  describe('marcarVehiculoEscaneado()', () => {
    it('marks vehicle as scanned and attaches improntaId', () => {
      const store = useContenedorStore()
      store.marcarVehiculoEscaneado('1', 'IMP-VH-001', 'imp-99')

      const veh = store.getById('1')!.vehiculos.find((v) => v.codigoImpronta === 'IMP-VH-001')
      expect(veh!.escaneado).toBe(true)
      expect(veh!.improntaId).toBe('imp-99')
    })

    it('sets container to completado when all vehicles are scanned', () => {
      const store = useContenedorStore()
      // Container 1 has 3 vehicles (IMP-VH-001 to IMP-VH-003). Scan all three.
      store.marcarVehiculoEscaneado('1', 'IMP-VH-001')
      store.marcarVehiculoEscaneado('1', 'IMP-VH-002')
      store.marcarVehiculoEscaneado('1', 'IMP-VH-003')

      expect(store.getById('1')!.estado).toBe('completado')
    })
  })

  // ─── completarRecepcion ───────────────────────────────────────────────────
  describe('completarRecepcion()', () => {
    it('sets estado to completado', () => {
      const store = useContenedorStore()
      store.completarRecepcion('2')
      expect(store.getById('2')!.estado).toBe('completado')
    })

    it('attaches optional observaciones', () => {
      const store = useContenedorStore()
      store.completarRecepcion('2', 'Todo bien')
      expect(store.getById('2')!.observaciones).toBe('Todo bien')
    })

    it('increments completados computed', () => {
      const store = useContenedorStore()
      const before = store.completados
      store.completarRecepcion('2')
      expect(store.completados).toBe(before + 1)
    })
  })
})
