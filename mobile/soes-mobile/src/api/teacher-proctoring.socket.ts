import { io, type Socket } from 'socket.io-client'
import { API_BASE_URL } from './client'
import { tokenStorage } from '../auth/tokenStorage'

const SOCKET_URL = API_BASE_URL.replace(/\/api\/?$/, '')
let socket: Socket | null = null

export async function getTeacherSocket() {
  const token = await tokenStorage.getAccessToken()
  if (!socket) socket = io(SOCKET_URL, { autoConnect: false, transports: ['websocket', 'polling'], withCredentials: true })
  socket.auth = { token }
  if (!socket.connected) socket.connect()
  return socket
}

export function disconnectTeacherSocket() {
  socket?.disconnect()
  socket = null
}
