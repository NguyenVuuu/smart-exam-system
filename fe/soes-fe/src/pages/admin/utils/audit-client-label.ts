import UAParser from 'ua-parser-js'

const deviceTypeLabels: Record<string, string> = {
  console: 'Máy chơi game',
  embedded: 'Thiết bị nhúng',
  mobile: 'Điện thoại',
  smarttv: 'TV thông minh',
  tablet: 'Máy tính bảng',
  wearable: 'Thiết bị đeo',
}

const getBrowserLabel = (browser: UAParser.IBrowser) =>
  [browser.name, browser.major].filter(Boolean).join(' ')

const getDeviceLabel = (device: UAParser.IDevice) => {
  if (device.model) return [device.vendor, device.model].filter(Boolean).join(' ')
  if (device.type) return deviceTypeLabels[device.type] ?? 'Thiết bị khác'
  return 'Máy tính'
}

export const getAuditClientLabel = (userAgent?: string | null) => {
  if (!userAgent?.trim()) return 'Không xác định'

  const { browser, device, os } = new UAParser(userAgent).getResult()
  const isRecognized = browser.name || os.name || device.model || device.type
  if (!isRecognized) return 'Không xác định'

  return [getBrowserLabel(browser), os.name, getDeviceLabel(device)]
    .filter(Boolean)
    .join(' · ')
}
