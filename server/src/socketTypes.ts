import type {Server, Socket} from 'socket.io';
import type {ClientToServerEvents, ServerToClientEvents, SocketData} from '@timebomb/shared';

/** Inter-server events (unused: single instance). */
type InterServerEvents = Record<string, never>;

export type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
export type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
