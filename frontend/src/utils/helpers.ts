export const validators = {
  email: (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
  bin: (bin: string) => /^[A-Z0-9]{17}$/.test(bin),
  qrCode: (code: string) => code.length > 0,
}

export const formatters = {
  date: (date: string | Date) => new Date(date).toLocaleDateString('es-ES'),
  time: (date: string | Date) => new Date(date).toLocaleTimeString('es-ES'),
  dateTime: (date: string | Date) => new Date(date).toLocaleString('es-ES'),
}

export const downloadFile = (
  content: string | Blob,
  fileName: string,
  type: string = 'application/json'
) => {
  const blob = new Blob([content], { type })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  window.URL.revokeObjectURL(url)
}
