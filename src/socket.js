import io from 'socket.io-client';

const SOCKET_URL = 'https://chat-server-uj70.onrender.com';

const socket = io(SOCKET_URL, {
  transports: ['websocket'],
  autoConnect: true,
  withCredentials: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

// Connection event listeners
socket.on('connect', () => {
  console.log('Socket connected:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.log('Socket disconnected:', reason);
});

socket.on('connect_error', (error) => {
  console.error('Socket connection error:', error);
});

socket.on('error', (error) => {
  console.error('Socket error:', error);
});

// Add explicit disconnect method
export const disconnectSocket = () => {
  if (socket.connected) {
    console.log('Disconnecting socket...');
    socket.disconnect();
  }
};

// Add reconnect method
export const reconnectSocket = () => {
  if (!socket.connected) {
    console.log('Reconnecting socket...');
    socket.connect();
  }
};

export default socket;

