import { io, type Socket } from 'socket.io-client'
import { tokenStorage } from '../utils/token'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'
const SOCKET_URL = API_URL.replace(/\/api\/?$/, '')

let socket: Socket | null = null

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      withCredentials: true,
      transports: ['websocket', 'polling'],
    })
  }

  socket.auth = { token: tokenStorage.getAccessToken() }
  if (!socket.connected) socket.connect()
  return socket
}

export function disconnectSocket() {
  socket?.disconnect()
  socket = null
}
