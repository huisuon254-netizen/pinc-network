import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Video, VideoOff, Phone, PhoneOff, PhoneCall } from 'lucide-react';
import { useWebRTC, CallType } from './useWebRTC';

interface CallPageProps {
  peerId: string;
  onEnd: () => void;
  autoInitiate?: CallType;
}

export function CallPage({ peerId, onEnd, autoInitiate }: CallPageProps) {
  const {
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
  } = useWebRTC({ peerId, onCallEnd: onEnd });

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isConnected) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isConnected]);

  useEffect(() => {
    if (autoInitiate && !isCalling && !isConnected && !isIncoming) {
      initiateCall(autoInitiate);
    }
  }, []);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
    toggleMute();
  };

  const handleToggleVideo = () => {
    setIsVideoOff(!isVideoOff);
    toggleVideo();
  };

  return (
    <div className="absolute inset-0 z-50 bg-gray-900 flex flex-col items-center justify-center overflow-hidden">
      {/* Background/Remote Video */}
      {remoteStream && callType === 'Video' ? (
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <div className="w-32 h-32 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-4xl font-bold text-white">
            {peerId.substring(0, 2).toUpperCase()}
          </div>
        </div>
      )}

      {/* Local Video (PiP) */}
      {localStream && callType === 'Video' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-6 right-6 w-48 h-72 bg-black rounded-2xl overflow-hidden shadow-2xl border-2 border-gray-700 z-10"
        >
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        </motion.div>
      )}

      {/* Overlay UI */}
      <div className="absolute inset-0 bg-black/30 pointer-events-none flex flex-col justify-between p-8 z-20">
        <div className="text-center pointer-events-auto mt-10">
          <h2 className="text-3xl font-bold text-white mb-2">{peerId}</h2>
          <p className="text-gray-300 text-lg">
            {isConnected 
              ? formatDuration(callDuration) 
              : isIncoming 
                ? 'Incoming Call...' 
                : isCalling 
                  ? 'Calling...' 
                  : 'Ready'}
          </p>
        </div>

        {/* Controls Bar */}
        <div className="flex justify-center items-center space-x-6 pb-8 pointer-events-auto">
          {!isCalling && !isIncoming && !isConnected && (
            <>
              <button
                onClick={() => initiateCall('Voice')}
                className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center text-white hover:bg-green-600 transition-colors shadow-lg"
              >
                <Phone className="w-8 h-8" />
              </button>
              <button
                onClick={() => initiateCall('Video')}
                className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white hover:bg-blue-600 transition-colors shadow-lg"
              >
                <Video className="w-8 h-8" />
              </button>
            </>
          )}

          {isIncoming && !isConnected && (
            <>
              <button
                onClick={answerCall}
                className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center text-white hover:bg-green-600 transition-colors shadow-lg"
              >
                <PhoneCall className="w-8 h-8" />
              </button>
              <button
                onClick={declineCall}
                className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-white hover:bg-red-600 transition-colors shadow-lg"
              >
                <PhoneOff className="w-8 h-8" />
              </button>
            </>
          )}

          {(isConnected || (isCalling && !isIncoming)) && (
            <>
              <button
                onClick={handleToggleMute}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors shadow-lg backdrop-blur-md border ${
                  isMuted 
                    ? 'bg-red-500/80 border-red-400 text-white' 
                    : 'bg-gray-800/60 border-gray-600 text-white hover:bg-gray-700/80'
                }`}
              >
                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>
              
              {callType === 'Video' && (
                <button
                  onClick={handleToggleVideo}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors shadow-lg backdrop-blur-md border ${
                    isVideoOff 
                      ? 'bg-red-500/80 border-red-400 text-white' 
                      : 'bg-gray-800/60 border-gray-600 text-white hover:bg-gray-700/80'
                  }`}
                >
                  {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                </button>
              )}

              <button
                onClick={hangUp}
                className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-white hover:bg-red-600 transition-colors shadow-lg ml-4"
              >
                <PhoneOff className="w-8 h-8" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
