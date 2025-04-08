import io from 'socket.io-client';

// Create a single socket instance
const socket = io('https://chat-server-uj70.onrender.com', {
  transports: ['websocket'],
  autoConnect: true,
});

export default socket;