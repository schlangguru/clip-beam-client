export enum MessageType {
  TEXT = "TEXT",
  FILE = "FILE"
}

export interface MessageHeader {
  type: MessageType;
  size: number;
  timeSent: Date;
}

export interface FileMessageHeader extends MessageHeader {
  fileName: string;
  mimeType: string;
}

export interface Message extends MessageHeader {
  payload: string | File;
}
