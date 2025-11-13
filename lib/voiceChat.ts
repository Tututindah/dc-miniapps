// Voice Chat Manager - WebRTC-based voice communication for multiplayer

export class VoiceChatManager {
  private localStream: MediaStream | null = null;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private remoteAudioElements: Map<string, HTMLAudioElement> = new Map();
  private isMuted: boolean = true;
  private isDeafened: boolean = false;
  private volume: number = 1.0;
  private onStateChange?: (state: VoiceChatState) => void;
  
  // ICE servers for WebRTC connection
  private iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ]
  };

  constructor(onStateChange?: (state: VoiceChatState) => void) {
    this.onStateChange = onStateChange;
  }

  // Initialize local microphone stream
  async initializeMicrophone(): Promise<boolean> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
        },
        video: false
      });

      // Mute by default
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = false;
      });

      console.log('🎤 Microphone initialized');
      this.notifyStateChange();
      return true;
    } catch (error) {
      console.error('Failed to access microphone:', error);
      return false;
    }
  }

  // Toggle microphone mute
  toggleMute(): boolean {
    if (!this.localStream) {
      console.warn('No local stream available');
      return this.isMuted;
    }

    this.isMuted = !this.isMuted;
    this.localStream.getAudioTracks().forEach(track => {
      track.enabled = !this.isMuted;
    });

    console.log(this.isMuted ? '🔇 Microphone muted' : '🎤 Microphone unmuted');
    this.notifyStateChange();
    return this.isMuted;
  }

  // Toggle deafen (mute incoming audio)
  toggleDeafen(): boolean {
    this.isDeafened = !this.isDeafened;
    
    this.remoteAudioElements.forEach(audio => {
      audio.volume = this.isDeafened ? 0 : this.volume;
    });

    console.log(this.isDeafened ? '🔇 Deafened' : '🔊 Undeafened');
    this.notifyStateChange();
    return this.isDeafened;
  }

  // Set volume for all incoming audio
  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    
    if (!this.isDeafened) {
      this.remoteAudioElements.forEach(audio => {
        audio.volume = this.volume;
      });
    }
  }

  // Create WebRTC connection to a peer
  async createPeerConnection(
    peerId: string,
    isInitiator: boolean,
    signalCallback: (peerId: string, signal: any) => void
  ): Promise<RTCPeerConnection> {
    if (!this.localStream) {
      throw new Error('Local stream not initialized');
    }

    const pc = new RTCPeerConnection(this.iceServers);
    this.peerConnections.set(peerId, pc);

    // Add local stream to connection
    this.localStream.getTracks().forEach(track => {
      pc.addTrack(track, this.localStream!);
    });

    // Handle incoming remote stream
    pc.ontrack = (event) => {
      console.log(`📡 Received audio track from ${peerId}`);
      this.handleRemoteStream(peerId, event.streams[0]);
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        signalCallback(peerId, {
          type: 'ice-candidate',
          candidate: event.candidate
        });
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log(`Connection to ${peerId}: ${pc.connectionState}`);
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        this.removePeer(peerId);
      }
    };

    // Create offer if initiator
    if (isInitiator) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      signalCallback(peerId, {
        type: 'offer',
        sdp: offer
      });
    }

    return pc;
  }

  // Handle incoming WebRTC signals
  async handleSignal(peerId: string, signal: any) {
    let pc = this.peerConnections.get(peerId);

    if (signal.type === 'offer') {
      if (!pc) {
        pc = await this.createPeerConnection(peerId, false, () => {});
      }
      await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      return { type: 'answer', sdp: answer };
    } 
    else if (signal.type === 'answer') {
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
      }
    } 
    else if (signal.type === 'ice-candidate') {
      if (pc && signal.candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
      }
    }

    return null;
  }

  // Handle remote audio stream
  private handleRemoteStream(peerId: string, stream: MediaStream) {
    // Remove old audio element if exists
    const oldAudio = this.remoteAudioElements.get(peerId);
    if (oldAudio) {
      oldAudio.srcObject = null;
      oldAudio.remove();
    }

    // Create new audio element for remote stream
    const audio = new Audio();
    audio.srcObject = stream;
    audio.autoplay = true;
    audio.volume = this.isDeafened ? 0 : this.volume;
    
    // Add spatial audio effect based on position (optional)
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const panner = audioContext.createPanner();
    
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.refDistance = 1;
    panner.maxDistance = 50;
    panner.rolloffFactor = 1;
    
    source.connect(panner);
    panner.connect(audioContext.destination);

    this.remoteAudioElements.set(peerId, audio);
    
    console.log(`🔊 Playing audio from peer ${peerId}`);
    this.notifyStateChange();
  }

  // Update spatial audio position for a peer (3D positional audio)
  updatePeerPosition(peerId: string, x: number, y: number, z: number) {
    const audio = this.remoteAudioElements.get(peerId);
    if (!audio || !audio.srcObject) return;

    try {
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(audio.srcObject as MediaStream);
      const panner = audioContext.createPanner();
      
      panner.setPosition(x, y, z);
      source.connect(panner);
      panner.connect(audioContext.destination);
    } catch (error) {
      console.error('Failed to update spatial audio:', error);
    }
  }

  // Remove peer connection
  removePeer(peerId: string) {
    const pc = this.peerConnections.get(peerId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(peerId);
    }

    const audio = this.remoteAudioElements.get(peerId);
    if (audio) {
      audio.srcObject = null;
      audio.remove();
      this.remoteAudioElements.delete(peerId);
    }

    console.log(`🔌 Disconnected from peer ${peerId}`);
    this.notifyStateChange();
  }

  // Get current state
  getState(): VoiceChatState {
    return {
      isMuted: this.isMuted,
      isDeafened: this.isDeafened,
      volume: this.volume,
      hasLocalStream: !!this.localStream,
      activePeers: this.peerConnections.size,
      connectedPeers: Array.from(this.peerConnections.keys())
    };
  }

  // Notify state change
  private notifyStateChange() {
    if (this.onStateChange) {
      this.onStateChange(this.getState());
    }
  }

  // Cleanup
  destroy() {
    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Close all peer connections
    this.peerConnections.forEach(pc => pc.close());
    this.peerConnections.clear();

    // Remove all audio elements
    this.remoteAudioElements.forEach(audio => {
      audio.srcObject = null;
      audio.remove();
    });
    this.remoteAudioElements.clear();

    console.log('🔇 Voice chat destroyed');
  }

  // Get speaking status (detecting audio activity)
  isSpeaking(): boolean {
    if (!this.localStream || this.isMuted) return false;

    try {
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(this.localStream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(dataArray);

      // Calculate average volume
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      return average > 10; // Threshold for speaking detection
    } catch (error) {
      return false;
    }
  }

  // Get peer speaking status
  isPeerSpeaking(peerId: string): boolean {
    const audio = this.remoteAudioElements.get(peerId);
    if (!audio || !audio.srcObject) return false;

    try {
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(audio.srcObject as MediaStream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(dataArray);

      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      return average > 10;
    } catch (error) {
      return false;
    }
  }
}

export interface VoiceChatState {
  isMuted: boolean;
  isDeafened: boolean;
  volume: number;
  hasLocalStream: boolean;
  activePeers: number;
  connectedPeers: string[];
}

// Global voice chat instance (singleton)
let globalVoiceChat: VoiceChatManager | null = null;

export function getVoiceChat(onStateChange?: (state: VoiceChatState) => void): VoiceChatManager {
  if (!globalVoiceChat) {
    globalVoiceChat = new VoiceChatManager(onStateChange);
  }
  return globalVoiceChat;
}

export function destroyVoiceChat() {
  if (globalVoiceChat) {
    globalVoiceChat.destroy();
    globalVoiceChat = null;
  }
}
