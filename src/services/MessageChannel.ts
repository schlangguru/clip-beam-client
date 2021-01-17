import { MessageType, MessageHeader, FileMessageHeader } from "./Message";
import { EventDispatcher } from "./EventDispatcher";

export class MessageChannel {
  public readonly onFileRecieved = new EventDispatcher<File>();
  public readonly onTextRecieved = new EventDispatcher<string>();
  public readonly onClose = new EventDispatcher<void>();
  public readonly onError = new EventDispatcher<RTCErrorEvent>();

  private readonly dataChannel: RTCDataChannel;
  private readonly textEncoder = new TextEncoder();
  private readonly textDecoder = new TextDecoder("utf-8");

  private receivedHeader?: MessageHeader;
  private receivedChunks?: ArrayBuffer[];
  private currentProgressCallback?: (progress: number) => void;

  constructor(dataChannel: RTCDataChannel) {
    this.dataChannel = dataChannel;
    this.dataChannel.binaryType = "arraybuffer";
    this.dataChannel.onmessage = event => {
      this.onData(event);
    };
    this.dataChannel.onclose = () => {
      this.onClose.dispatch();
    };
    this.dataChannel.onerror = event => {
      this.onError.dispatch(event);
    };
  }

  public async sendFile(file: File, onProgress: (progress: number) => void) {
    const payload = await file.arrayBuffer();
    const header = {
      type: MessageType.FILE,
      size: payload.byteLength,
      timeSent: new Date(),
      fileName: file.name,
      mimeType: file.type
    } as FileMessageHeader;

    this.sendHeader(header);
    this.sendFileChunks(file, onProgress);
  }

  public async sendFileChunks(
    file: File,
    onProgress: (progress: number) => void
  ) {
    const chunkSize = 16384;
    let bytesSent = 0;
    const fileReader = new FileReader();
    let offset = 0;
    const readSlice = o => {
      const slice = file.slice(offset, o + chunkSize);
      fileReader.readAsArrayBuffer(slice);
    };
    fileReader.onload = e => {
      const buffer = e.target?.result as ArrayBuffer;
      this.dataChannel.send(buffer);
      bytesSent += buffer.byteLength;
      offset += buffer.byteLength;
      onProgress(100 * (bytesSent / file.size));
      if (offset < file.size) {
        readSlice(offset);
      }
    };
    readSlice(0);
  }

  public async sendText(text: string) {
    const payload = this.textEncoder.encode(text).buffer;
    const header = {
      type: MessageType.TEXT,
      size: payload.byteLength,
      timeSent: new Date()
    } as MessageHeader;

    this.sendHeader(header);
    this.dataChannel.send(payload);
  }

  private sendHeader(header: MessageHeader) {
    this.dataChannel.send(JSON.stringify(header));
  }

  private waitForHeader(): boolean {
    return !this.receivedHeader;
  }

  private recievedByteLength(): number {
    if (this.receivedChunks) {
      return this.receivedChunks
        .map(buffer => buffer.byteLength)
        .reduce((a, b) => a + b, 0);
    }

    return 0;
  }

  private onData(event: MessageEvent) {
    if (this.waitForHeader()) {
      const header = JSON.parse(event.data as string);
      this.receivedHeader = header;
      this.receivedChunks = [];
    } else {
      this.receivedChunks?.push(event.data);
      if (this.receivedHeader?.size === this.recievedByteLength()) {
        this.onDataComplete();
      }
    }
  }

  private onDataComplete() {
    if (!this.receivedChunks) {
      throw "No recieved data available";
    }

    if (this.receivedHeader?.type === MessageType.TEXT) {
      const text = this.textDecoder.decode(this.receivedChunks[0]);
      this.onTextRecieved.dispatch(text);
    } else if (this.receivedHeader?.type === MessageType.FILE) {
      const fileName = (this.receivedHeader as FileMessageHeader).fileName;
      const file = new File(this.receivedChunks, fileName);
      this.onFileRecieved.dispatch(file);
    } else {
      throw `Unknown message type '${this.receivedHeader?.type}'`;
    }

    this.receivedHeader = undefined;
    this.receivedChunks = undefined;
  }
}
