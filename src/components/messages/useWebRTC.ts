import { useState, useEffect, useRef, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

export type CallType = 'Voice' | 'Video';

export interface UseWebRTCProps {
  peerId: string;
  onCallEnd?: () => void;
}

export function useWebRTC({ peerId, onCallEnd }: UseWebRTCProps) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isIncoming, setIsIncoming] = useState(false);
  const [callType, setCallType] = useState<CallType>('Voice');
  
  const peerConnection = useRef<RTCPeerConnection | null>(null);

  const ICE_SERVERS = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' }
    ]
  };

  const cleanup = useCallback(() => {
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    setRemoteStream(null);
    setIsCalling(false);
    setIsConnected(false);
    setIsIncoming(false);
    if (onCallEnd) onCallEnd();
  }, [localStream, onCallEnd]);

  useEffect(() => {
    const unlistenOffer = listen('pinc://call-offer', async (event: any) => {
      const { from, type, offer } = event.payload;
      if (from === peerId) {
        setIsIncoming(true);
        setCallType(type);
        // Store offer to be processed when user accepts
        localStorage.setItem(`call_offer_${peerId}`, offer);
      }
    });

    const unlistenAnswer = listen('pinc://call-answer', async (event: any) => {
      const { from, answer } = event.payload;
      if (from === peerId && peerConnection.current) {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: answer }));
        setIsConnected(true);
      }
    });

    const unlistenIce = listen('pinc://ice-candidate', async (event: any) => {
      const { from, candidate } = event.payload;
      if (from === peerId && peerConnection.current) {
        try {
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(JSON.parse(candidate)));
        } catch (e) {
          console.error("Failed to add ICE candidate", e);
        }
      }
    });

    const unlistenHangup = listen('pinc://call-hangup', (event: any) => {
      const { from } = event.payload;
      if (from === peerId) {
        cleanup();
      }
    });

    return () => {
      unlistenOffer.then(f => f());
      unlistenAnswer.then(f => f());
      unlistenIce.then(f => f());
      unlistenHangup.then(f => f());
    };
  }, [peerId, cleanup]);

  const setupPeerConnection = async (type: CallType, isInitiator: boolean) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: type === 'Video'
    });
    setLocalStream(stream);

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnection.current = pc;

    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
    });

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        invoke('cmd_websocket_broadcast', { 
          message: JSON.stringify({
            type: 'ice-candidate',
            to: peerId,
            candidate: JSON.stringify(event.candidate)
          })
        }).catch(console.error);
      }
    };

    return pc;
  };

  const initiateCall = async (type: CallType) => {
    setIsCalling(true);
    setCallType(type);
    
    try {
      const pc = await setupPeerConnection(type, true);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      await invoke('cmd_initiate_call', {
        peerId,
        callType: type.toLowerCase(),
        localOffer: offer.sdp
      });
    } catch (e) {
      console.error('Failed to initiate call:', e);
      cleanup();
    }
  };

  const answerCall = async () => {
    setIsIncoming(false);
    setIsCalling(true);
    
    try {
      const storedOffer = localStorage.getItem(`call_offer_${peerId}`);
      if (!storedOffer) throw new Error("No offer found");
      
      const pc = await setupPeerConnection(callType, false);
      await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: storedOffer }));
      
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      await invoke('cmd_answer_call', {
        peerId,
        offerSdp: storedOffer,
        remoteAnswer: answer.sdp
      });
      
      setIsConnected(true);
    } catch (e) {
      console.error('Failed to answer call:', e);
      cleanup();
    }
  };

  const declineCall = () => {
    setIsIncoming(false);
    localStorage.removeItem(`call_offer_${peerId}`);
    invoke('cmd_hang_up').catch(console.error);
  };

  const hangUp = async () => {
    cleanup();
    try {
      await invoke('cmd_hang_up');
    } catch (e) {
      console.error('Error during hangup:', e);
    }
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
    }
  };

  return {
    localStream,
    remoteStream,
    isCalling,
    isConnected,
    isIncoming,
    callType,
    initiateCall,
    answerCall,
    declineCall,
    hangUp,
    toggleMute,
    toggleVideo
  };
}
