export interface Room {
  id: number;
  number: string;
  floor: number;
  capacity: number;
  /** Nombre de résidents actifs dans la chambre. */
  occupied: number;
}

export interface RoomPayload {
  number: string;
  floor: number;
  capacity: number;
}
