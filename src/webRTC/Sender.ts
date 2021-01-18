import { v4 as uuidv4 } from "uuid";
import { MessageType, MessageHeader } from "./Message";

abstract class Sender {
  protected readonly dataChannel: RTCDataChannel;

  constructor(rtcConnection: RTCPeerConnection) {
    const label = `${this.type()}:${uuidv4()}`;
    this.dataChannel = rtcConnection.createDataChannel(label, {
      ordered: true
    });
    this.dataChannel.binaryType = "arraybuffer";
  }

  protected abstract sendData(): void;

  public abstract type(): string;

  public async send() {
    this.dataChannel.onopen = () => {
      this.sendData();
    };
  }
}

export class FileSender extends Sender {
  private static readonly CHUNK_SIZE = 16384;
  private readonly file: File;

  constructor(rtcConnection: RTCPeerConnection, file: File) {
    super(rtcConnection);
    this.file = file;
  }

  public type() {
    return MessageType.FILE;
  }

  protected async sendData() {
    const payload = await this.file.arrayBuffer();
    const header = {
      type: MessageType.FILE,
      size: payload.byteLength,
      timeSent: new Date(),
      fileName: this.file.name,
      mimeType: this.file.type
    } as MessageHeader;

    this.dataChannel.send(JSON.stringify(header));
    this.sendFileChunks();
  }

  private async sendFileChunks() {
    // let bytesSent = 0;
    const fileReader = new FileReader();
    let offset = 0;
    const readSlice = o => {
      const slice = this.file.slice(offset, o + FileSender.CHUNK_SIZE);
      fileReader.readAsArrayBuffer(slice);
    };
    fileReader.onload = e => {
      const buffer = e.target?.result as ArrayBuffer;
      this.dataChannel.send(buffer);
      // bytesSent += buffer.byteLength;
      offset += buffer.byteLength;
      // onProgress(100 * (bytesSent / this.file.size));
      if (offset < this.file.size) {
        readSlice(offset);
      }
    };
    readSlice(0);
  }
}

export class TextSender extends Sender {
  private readonly text: string;

  constructor(rtcConnection: RTCPeerConnection, text: string) {
    super(rtcConnection);
    this.text = text;
  }

  public type() {
    return MessageType.FILE;
  }

  protected async sendData() {
    const header = {
      type: MessageType.TEXT,
      size: this.text.length,
      timeSent: new Date()
    } as MessageHeader;

    this.dataChannel.send(JSON.stringify(header));
    this.dataChannel.send(this.text);
  }
}
