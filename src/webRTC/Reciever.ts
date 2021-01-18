import { MessageHeader, Message } from "./Message";
import { EventDispatcher } from "./EventDispatcher";

export abstract class Reciever {
  protected readonly dataChannel: RTCDataChannel;
  private _header?: MessageHeader;
  public readonly onRecieveMessage = new EventDispatcher<Message>();

  constructor(dataChannel: RTCDataChannel) {
    this.dataChannel = dataChannel;
    this.dataChannel.binaryType = "arraybuffer";
  }

  public recieve() {
    this.dataChannel.onmessage = event => {
      this.onMessage(event);
    };
  }

  protected header(): MessageHeader {
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
      const header = JSON.parse(event.data as string) as MessageHeader;
      this._header = header;
      this.onRecieveMessage.dispatch({
        header: header,
        transferCompleted: false,
        transferProgress: 0
      });
    } else {
      this.onData(event);
    }
  }
}

export class TextReciever extends Reciever {
  protected onData(event: MessageEvent) {
    const text = event.data as string;
    this.closeChannel();
    this.onRecieveMessage.dispatch({
      header: this.header(),
      timestamp: new Date(),
      transferCompleted: true,
      transferProgress: 100,
      payload: text
    });
  }
}

export class FileReciever extends Reciever {
  private receivedChunks: ArrayBuffer[] = [];
  private bytesRecieved = 0;
  private lastProgress = 0;

  protected onData(event: MessageEvent) {
    const buffer = event.data as ArrayBuffer;
    this.receivedChunks.push(buffer);
    this.bytesRecieved += buffer.byteLength;

    const progress = 100 * (this.bytesRecieved / this.header().size);
    if (progress - this.lastProgress >= 1) {
      this.lastProgress = progress;
      this.onRecieveMessage.dispatch({
        header: this.header(),
        transferCompleted: false,
        transferProgress: progress
      });
    }

    if (this.header().size === this.recievedByteLength()) {
      const fileName = this.header().name || "Unknown File";
      const file = new File(this.receivedChunks, fileName);
      this.closeChannel();
      this.onRecieveMessage.dispatch({
        header: this.header(),
        timestamp: new Date(),
        transferCompleted: true,
        transferProgress: 100,
        payload: file
      });
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
