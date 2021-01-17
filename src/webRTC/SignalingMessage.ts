export enum SignalingType {
  REGISTER = "REGISTER",
  OFFER = "OFFER",
  ERROR = "ERROR",
  ANSWER = "ANSWER",
  ICE_CANDIDATE = "ICE_CANDIDATE"
}

export interface OfferPayload {
  offer: RTCSessionDescriptionInit;
  peerUuid: string;
}

export interface AnswerPayload {
  answer: RTCSessionDescriptionInit;
  peerUuid: string;
}

export interface ICECandidatePayload {
  candidate: RTCIceCandidateInit;
  peerUuid: string;
}

export interface SignalingMsg {
  type: SignalingType;
  payload: string | OfferPayload | AnswerPayload | ICECandidatePayload;
}
