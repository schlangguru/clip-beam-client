import { v4 as uuidv4 } from "uuid";
import { MessageType, MessageHeader, FileMessageHeader } from "./Message";
import { EventDispatcher } from "./EventDispatcher";

class FileSender {
  private readonly CHUNK_SIZE = 16384;

  private readonly dataChannel: RTCDataChannel;
  private readonly file: File;

  constructor(rtcConnection: RTCPeerConnection, file: File) {
    this.file = file;
    const label = `file:${uuidv4()}`;
    this.dataChannel = rtcConnection.createDataChannel(label, {
      ordered: true
    });
    this.dataChannel.binaryType = "arraybuffer";
  }

  public send() {
    this.dataChannel.onopen = () => {
      this.sendFile();
    };
  }

  private async sendFile() {
    const payload = await this.file.arrayBuffer();
    const header = {
      type: MessageType.FILE,
      size: payload.byteLength,
      timeSent: new Date(),
      fileName: this.file.name,
      mimeType: this.file.type
    } as FileMessageHeader;

    this.dataChannel.send(JSON.stringify(header));
    this.sendFileChunks();
  }

  private async sendFileChunks() {
    // let bytesSent = 0;
    const fileReader = new FileReader();
    let offset = 0;
    const readSlice = o => {
      const slice = this.file.slice(offset, o + this.CHUNK_SIZE);
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

class TextSender {
  private readonly dataChannel: RTCDataChannel;
  private readonly text: string;

  constructor(rtcConnection: RTCPeerConnection, text: string) {
    this.text = text;
    const label = `text:${uuidv4()}`;
    this.dataChannel = rtcConnection.createDataChannel(label, {
      ordered: true
    });
  }

  public async send() {
    this.dataChannel.onopen = () => {
      this.sendText();
    };
  }

  private async sendText() {
    const header = {
      type: MessageType.TEXT,
      size: this.text.length,
      timeSent: new Date()
    } as MessageHeader;

    this.dataChannel.send(JSON.stringify(header));
    this.dataChannel.send(this.text);
  }
}

class TextReciever {
  public readonly onText = new EventDispatcher<string>();
  private readonly dataChannel: RTCDataChannel;
  private header?: MessageHeader;

  constructor(dataChannel: RTCDataChannel) {
    this.dataChannel = dataChannel;
  }

  public recieve() {
    this.dataChannel.onmessage = event => {
      this.onData(event.data as string);
    };
  }

  private onData(data: string) {
    if (!this.header) {
      this.onHeader(data);
    } else {
      this.onText.dispatch(data);
    }
  }

  private onHeader(header: string) {
    this.header = JSON.parse(header) as MessageHeader;
  }
}

class FileReciever {
  public readonly onFile = new EventDispatcher<File>();
  private readonly dataChannel: RTCDataChannel;
  private header?: FileMessageHeader;
  private receivedChunks: ArrayBuffer[] = [];

  constructor(dataChannel: RTCDataChannel) {
    this.dataChannel = dataChannel;
    this.dataChannel.binaryType = "arraybuffer";
  }

  public recieve() {
    this.dataChannel.onmessage = event => {
      this.onData(event);
    };
  }

  private onData(event: MessageEvent) {
    if (!this.header) {
      this.onHeader(event.data as string);
    } else {
      this.receivedChunks.push(event.data as ArrayBuffer);
      if (this.header.size === this.recievedByteLength()) {
        const fileName = this.header.fileName;
        const file = new File(this.receivedChunks, fileName);
        this.onFile.dispatch(file);
      }
    }
  }

  private onHeader(header: string) {
    this.header = JSON.parse(header) as FileMessageHeader;
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

export class PeerConnection {
  private readonly rtcConnection: RTCPeerConnection;
  private readonly heartBeatChannel: RTCDataChannel;

  public readonly onClose = new EventDispatcher<void>();

  constructor(
    rtcConnection: RTCPeerConnection,
    heartBeatChannel: RTCDataChannel
  ) {
    this.heartBeatChannel = heartBeatChannel;
    this.heartBeatChannel.onclose = () => {
      this.onClose.dispatch();
    };

    this.rtcConnection = rtcConnection;
    this.rtcConnection.ondatachannel = event => {
      this.onDataChannel(event);
    };
  }

  public async sendFile(file: File) {
    new FileSender(this.rtcConnection, file).send();
  }

  public async sendText(text: string) {
    new TextSender(this.rtcConnection, text).send();
  }

  private onDataChannel(event: RTCDataChannelEvent) {
    const dataChannel = event.channel || event.target;
    const label = dataChannel.label;
    if (label.startsWith("file")) {
      const reciever = new FileReciever(dataChannel);
      reciever.onFile.addListener(file => console.log("Got File: ", file));
      reciever.recieve();
    } else if (label.startsWith("text")) {
      const reciever = new TextReciever(dataChannel);
      reciever.onText.addListener(text => console.log("Got Text", text));
      reciever.recieve();
    } else {
      throw `Unknown channel type ${label}`;
    }
  }
}
