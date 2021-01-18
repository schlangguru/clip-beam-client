import { MessageHeader, FileMessageHeader } from "./Message";
import { EventDispatcher } from "./EventDispatcher";

abstract class Reciever<T extends MessageHeader> {
  protected readonly dataChannel: RTCDataChannel;
  private _header?: T;

  constructor(dataChannel: RTCDataChannel) {
    this.dataChannel = dataChannel;
    this.dataChannel.binaryType = "arraybuffer";
  }

  public recieve() {
    this.dataChannel.onmessage = event => {
      this.onMessage(event);
    };
  }

  protected header(): T {
    if (!this._header) {
      throw "Header not yet recieved.";
    }
    return this._header;
  }

  protected closeChannel() {
    this.dataChannel.close();
  }

  protected abstract onData(payload: MessageEvent);

  private onMessage(event: MessageEvent) {
    if (!this._header) {
      const header = JSON.parse(event.data as string) as T;
      this._header = header;
    } else {
      this.onData(event);
    }
  }
}

export class TextReciever extends Reciever<MessageHeader> {
  public readonly onText = new EventDispatcher<string>();

  protected onData(event: MessageEvent) {
    const text = event.data as string;
    this.closeChannel();
    this.onText.dispatch(text);
  }
}

export class FileReciever extends Reciever<FileMessageHeader> {
  public readonly onFile = new EventDispatcher<File>();
  private receivedChunks: ArrayBuffer[] = [];

  protected onData(event: MessageEvent) {
    this.receivedChunks.push(event.data as ArrayBuffer);
    if (this.header().size === this.recievedByteLength()) {
      const fileName = this.header().fileName;
      const file = new File(this.receivedChunks, fileName);
      this.closeChannel();
      this.onFile.dispatch(file);
    }
  }

  private recievedByteLength(): number {
    if (this.receivedChunks) {
      return this.receivedChunks
        .map(buffer => buffer.byteLength)
        .reduce((a, b) => a + b, 0);
    }

    return 0;
  }
}
