export type ZoyaState = "disconnected" | "connecting" | "listening" | "speaking" | "error";

export interface VoiceSettings {
  voiceName: string;
  sassLevel: number; // 1 = friendly, 3 = sassy, 5 = spicy tease
  language: string; // e.g. "Odia (ଓଡ଼ିଆ)", "Odia + English", "Hindi", "English (Default)"
  lockScreenMode: boolean; // Enable background / lock screen talking
  romanticMode: boolean; // Romantic partner mode (cute smile & romantic affection)
  rivalMode: boolean; // Free Fire MAX Rival Mode (playful gaming antagonist & taunts)
}

export interface FreeFireAlert {
  id: string;
  title: string;
  type: "zone" | "airdrop" | "rush" | "booyah" | "taunt";
  message: string;
  tauntOdia?: string;
  icon: string;
}

export interface CreativeAsset {
  id: string;
  title: string;
  type: "image" | "video";
  url: string;
  prompt: string;
  createdAt: number;
}

export interface Transcription {
  text: string;
  isUser: boolean;
  timestamp: number;
}

export interface ServerMessage {
  type: "state" | "audio" | "interrupted" | "transcription" | "toolCall" | "error";
  state?: ZoyaState;
  audio?: string; // base64
  transcription?: {
    text: string;
    isUser: boolean;
  };
  toolCall?: {
    id: string;
    name: string;
    args: {
      url: string;
      siteName: string;
    };
  };
  error?: string;
}
