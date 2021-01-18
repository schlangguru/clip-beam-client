export enum MessageType {
  TEXT = "TEXT",
  FILE = "FILE"
}

export interface MessageHeader {
  type: MessageType;
  name?: string;
  size: number;
}

export interface Message {
  type: MessageType;
  timestamp: Date;
  payload: string | File;
}
