import { v4 as uuidv4 } from "uuid";
import { EventDispatcher } from "./EventDispatcher";
import { MessageType, Message } from "./Message";
import { TextSender, FileSender } from "./Sender";
import { Reciever, TextReciever, FileReciever } from "./Reciever";

type ProgressCallback = (progress: number) => void;
export class PeerConnection {
  private readonly rtcConnection: RTCPeerConnection;
  private readonly heartBeatChannel: RTCDataChannel;

  public readonly onRecievingMessage = new EventDispatcher<{
    id: string;
    msg: Message;
  }>();
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

  public async sendFile(file: File, onProgress?: ProgressCallback) {
    const sender = new FileSender(this.rtcConnection, file);
    if (onProgress) {
      sender.onProgress.addListener(onProgress);
    }
    sender.send();
  }

  public async sendText(text: string, onProgress?: ProgressCallback) {
    const sender = new TextSender(this.rtcConnection, text);
    if (onProgress) {
      sender.onProgress.addListener(onProgress);
    }
    sender.send();
  }

  private onDataChannel(event: RTCDataChannelEvent) {
    const dataChannel = event.channel || event.target;
    const label = dataChannel.label;
    let reciever: Reciever;
    if (label.startsWith(MessageType.FILE)) {
      reciever = new FileReciever(dataChannel);
    } else if (label.startsWith(MessageType.TEXT)) {
      reciever = new TextReciever(dataChannel);
    } else {
      throw `Unknown channel type ${label}`;
    }

    const id = uuidv4();
    reciever.onRecieveMessage.addListener(msg => {
      this.onRecievingMessage.dispatch({ id, msg });
    });
    reciever.recieve();
  }
}
