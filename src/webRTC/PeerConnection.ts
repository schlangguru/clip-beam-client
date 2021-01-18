import { EventDispatcher } from "./EventDispatcher";
import { TextSender, FileSender } from "./Sender";
import { TextReciever, FileReciever } from "./Reciever";

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
