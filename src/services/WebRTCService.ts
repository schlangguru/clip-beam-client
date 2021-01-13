import {
  SignalingType,
  SignalingMsg,
  OfferPayload,
  AnswerPayload,
  ICECandidatePayload
} from "./SignalingMessage";
import { EventDispatcher } from "./EventDispatcher";

const SIGNALING_SERVER = "ws://localhost:9090";
const RTC_CONNECTION_CONFIG = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302"
    }
  ]
};
const DATA_CHANNEL_NAME = "data-channel";

class WebRTCService {
  private readonly signalingSocket: WebSocket;
  private readonly rtcPeerConnection: RTCPeerConnection;
  private dataChannel?: RTCDataChannel;

  public readonly onConnected = new EventDispatcher<void>();
  public readonly onData = new EventDispatcher<string>();

  constructor() {
    this.signalingSocket = new WebSocket(SIGNALING_SERVER);
    this.signalingSocket.addEventListener("message", event =>
      this.onSignalingMessage(JSON.parse(event.data) as SignalingMsg)
    );

    this.rtcPeerConnection = new RTCPeerConnection(RTC_CONNECTION_CONFIG);
  }

  public registerClient(uuid: string) {
    this.signalingSocket.addEventListener("open", () => {
      this.sendSignal({
        type: "REGISTER",
        payload: uuid
      });
    });
  }

  public async connectToDevice(peerUuid: string) {
    this.rtcPeerConnection.onicecandidate = event => {
      if (event.candidate) {
        this.sendSignal({
          type: "ICE_CANDIDATE",
          payload: {
            candidate: event.candidate,
            peerUuid: peerUuid
          }
        });
      }
    };

    this.initDataChannel();

    const offer = await this.rtcPeerConnection.createOffer();
    this.rtcPeerConnection.setLocalDescription(offer);
    this.sendSignal({
      type: "OFFER",
      payload: {
        offer: offer,
        peerUuid: peerUuid
      }
    });
  }

  public sendMessage(msg: string) {
    if (this.dataChannel) {
      this.dataChannel.send(msg);
    } else {
      throw "No data channel established.";
    }
  }

  private onSignalingMessage(message: SignalingMsg) {
    if (message.type == SignalingType.ERROR) {
      console.error(message.payload);
    } else if (message.type === SignalingType.OFFER) {
      const payload = message.payload as OfferPayload;
      this.onOffer(payload.peerUuid, payload.offer);
    } else if (message.type === SignalingType.ANSWER) {
      const payload = message.payload as AnswerPayload;
      this.onAnswer(payload.answer);
    } else if (message.type === SignalingType.ICE_CANDIDATE) {
      const payload = message.payload as ICECandidatePayload;
      this.onIceCandidate(payload.candidate);
    }
  }

  private async onOffer(peerUuid: string, offer: RTCSessionDescriptionInit) {
    this.rtcPeerConnection.setRemoteDescription(
      new RTCSessionDescription(offer)
    );
    this.rtcPeerConnection.ondatachannel = event =>
      this.onDataChannelOpened(event);
    const answer = await this.rtcPeerConnection.createAnswer();
    this.rtcPeerConnection.setLocalDescription(answer);
    this.sendSignal({
      type: SignalingType.ANSWER,
      payload: {
        answer: answer,
        peerUuid: peerUuid
      }
    });
  }

  private async onAnswer(answer: RTCSessionDescriptionInit) {
    this.rtcPeerConnection.setRemoteDescription(answer);
  }

  private async onIceCandidate(candidate: RTCIceCandidateInit) {
    this.rtcPeerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  }

  private sendSignal(signal: object) {
    this.signalingSocket.send(JSON.stringify(signal));
  }

  private initDataChannel() {
    const options = { ordered: true };
    const dataChannel = this.rtcPeerConnection.createDataChannel(
      DATA_CHANNEL_NAME,
      options
    );
    dataChannel.onopen = event =>
      this.onDataChannelOpened(event as RTCDataChannelEvent);
  }

  private onDataChannelOpened(event: RTCDataChannelEvent) {
    this.dataChannel = event.channel || event.target;
    this.dataChannel.onmessage = event => {
      this.onData.dispatch(event.data);
    };

    this.onConnected.dispatch();
  }
}

// Export Singleton
const service = new WebRTCService();
export default service;
