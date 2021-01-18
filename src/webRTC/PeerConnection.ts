import { EventDispatcher } from "./EventDispatcher";
import { MessageType, Message } from "./Message";
import { TextSender, FileSender } from "./Sender";
import { TextReciever, FileReciever } from "./Reciever";

type ProgressCallback = (progress: number) => void;
export class PeerConnection {
  private readonly rtcConnection: RTCPeerConnection;
  private readonly heartBeatChannel: RTCDataChannel;

  public readonly onMessage = new EventDispatcher<Message>();
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
    if (label.startsWith(MessageType.FILE)) {
      const reciever = new FileReciever(dataChannel);
      reciever.onFile.addListener(file => {
        this.onMessage.dispatch({
          type: MessageType.FILE,
          timestamp: new Date(),
          payload: file
        });
      });
      reciever.recieve();
    } else if (label.startsWith(MessageType.TEXT)) {
      const reciever = new TextReciever(dataChannel);
      reciever.onText.addListener(text => {
        this.onMessage.dispatch({
          type: MessageType.TEXT,
          timestamp: new Date(),
          payload: text
        });
      });
      reciever.recieve();
    } else {
      throw `Unknown channel type ${label}`;
    }
  }
}
