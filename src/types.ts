export type Language = 'en' | 'hi' | 'ta';

export type Screen = 
  | 'splash' 
  | 'onboarding' 
  | 'login'
  | 'home' 
  | 'chat' 
  | 'weather' 
  | 'market' 
  | 'schemes' 
  | 'profile' 
  | 'upload'
  | 'calendar'
  | 'rotation'
  | 'alerts'
  | 'notifications';

export interface PriceAlert {
  id: string;
  uid: string;
  crop: string;
  targetPrice: number;
  condition: 'above' | 'below';
  active: boolean;
  createdAt: any;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'price' | 'weather' | 'system';
  timestamp: any;
  read: boolean;
}

export interface MarketPrice {
  crop: string;
  price: number;
  unit: string;
  mandi: string;
  trend: 'up' | 'down' | 'stable';
  date: string;
}

export interface MarketData {
  location: string;
  lastUpdated: string;
  prices: MarketPrice[];
}

export interface RotationSuggestion {
  crop: string;
  benefits: string[];
  risks: string[];
  reasoning: string;
}

export interface CropRotationData {
  currentCrop: string;
  location: string;
  soilType: string;
  suggestions: RotationSuggestion[];
}

export interface CalendarEvent {
  month: string;
  activity: string;
  type: 'planting' | 'cultivation' | 'harvesting';
  description: string;
}

export interface CropCalendar {
  crop: string;
  location: string;
  events: CalendarEvent[];
}

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

export interface CropHistory {
  id: string;
  uid: string;
  cropName: string;
  season: string;
  year: number;
  yieldValue: string;
  notes?: string;
  createdAt: any;
}

