import { Socket } from 'socket.io';

type SocketIOMiddleWare = {
  (client: Socket, next: (err?: Error) => void);
};

export const SocketAuthMiddleware = (
token
): SocketIOMiddleWare => {
  return (client, next) => {
    try {
      const { authorization } = client.handshake.headers;
       
      next();
    } catch (error) {
      next(error);
    }
  };
};
