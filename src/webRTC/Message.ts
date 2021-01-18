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
  header: MessageHeader;
  timestamp?: Date;
  transferCompleted: boolean;
  transferProgress: number;
  payload?: string | File;
}
