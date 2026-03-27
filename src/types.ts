export type Language = 'en' | 'hi' | 'ta';

export type Screen = 
  | 'splash' 
  | 'onboarding' 
  | 'home' 
  | 'chat' 
  | 'weather' 
  | 'market' 
  | 'schemes' 
  | 'profile' 
  | 'upload';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface WeatherData {
  temp: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  uvIndex: string;
  forecast: {
    day: string;
    tempHigh: number;
    tempLow: number;
    condition: string;
  }[];
  hourly: {
    time: string;
    temp: number;
    condition: string;
  }[];
}
