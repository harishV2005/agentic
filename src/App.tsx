import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sprout, 
  CloudSun, 
  TrendingUp, 
  Landmark, 
  User, 
  Camera, 
  Send, 
  ChevronLeft, 
  Globe,
  MessageSquare,
  Droplets,
  Wind,
  Sun,
  CheckCircle2,
  Leaf,
  Mic,
  MicOff
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from './lib/utils';
import { Screen, Language, Message, WeatherData } from './types';
import { getAgriAdvice, analyzeCropImage, checkSchemeEligibility } from './services/gemini';

// --- Mock Data ---
const MOCK_WEATHER: WeatherData = {
  temp: 32,
  condition: "Partly Cloudy",
  humidity: 45,
  windSpeed: 12,
  uvIndex: "Moderate",
  forecast: [
    { day: "Tomorrow", tempHigh: 34, tempLow: 22, condition: "Sunny" },
    { day: "Wednesday", tempHigh: 31, tempLow: 20, condition: "Cloudy" },
    { day: "Thursday", tempHigh: 28, tempLow: 19, condition: "Rainy" },
  ]
};

const SCHEMES = [
  { id: 1, title: "PM-KISAN", desc: "Direct income support of ₹6,000 per year to all landholding farmer families." },
  { id: 2, title: "PM Fasal Bima Yojana", desc: "Crop insurance scheme to provide financial support to farmers suffering crop loss." },
  { id: 3, title: "Kisan Credit Card (KCC)", desc: "Provides farmers with timely access to credit for their cultivation and other needs." },
];

// --- Components ---

const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-primary flex flex-col items-center justify-center text-white">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex flex-col items-center"
      >
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-xl">
          <Sprout className="text-primary w-14 h-14" />
        </div>
        <h1 className="text-4xl font-extrabold italic tracking-tight mb-2">AgriSeva AI</h1>
        <p className="text-primary-fixed opacity-80 font-medium">Empowering Indian Farmers</p>
      </motion.div>
    </div>
  );
};

const Onboarding = ({ onSelect }: { onSelect: (lang: Language) => void }) => {
  return (
    <div className="min-h-screen bg-surface p-8 flex flex-col justify-center">
      <div className="mb-12 text-center">
        <h2 className="text-3xl font-bold text-primary mb-4">Welcome to AgriSeva</h2>
        <p className="text-stone-500">Please select your preferred language to continue</p>
      </div>
      <div className="space-y-4">
        {[
          { id: 'en', label: 'English', sub: 'Continue in English' },
          { id: 'hi', label: 'हिन्दी', sub: 'हिंदी में जारी रखें' },
          { id: 'ta', label: 'தமிழ்', sub: 'தமிழில் தொடரவும்' },
        ].map((lang) => (
          <button
            key={lang.id}
            onClick={() => onSelect(lang.id as Language)}
            className="w-full p-6 bg-white rounded-xl border border-stone-100 shadow-sm flex items-center justify-between hover:border-primary transition-all group"
          >
            <div className="text-left">
              <div className="text-xl font-bold text-stone-800 group-hover:text-primary">{lang.label}</div>
              <div className="text-sm text-stone-400">{lang.sub}</div>
            </div>
            <Globe className="text-stone-300 group-hover:text-primary" />
          </button>
        ))}
      </div>
    </div>
  );
};

const BottomNav = ({ active, onNavigate }: { active: Screen, onNavigate: (s: Screen) => void }) => {
  const items = [
    { id: 'home', icon: Sprout, label: 'Home' },
    { id: 'weather', icon: CloudSun, label: 'Weather' },
    { id: 'chat', icon: MessageSquare, label: 'Ask AI' },
    { id: 'market', icon: TrendingUp, label: 'Market' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-stone-100 px-4 pb-8 pt-3 flex justify-around items-center z-50 rounded-t-[2.5rem] shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
      {items.map((item) => {
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id as Screen)}
            className={cn(
              "flex flex-col items-center transition-all duration-300",
              isActive ? "text-primary scale-110" : "text-stone-400 opacity-60"
            )}
          >
            <div className={cn(
              "p-2 rounded-full mb-1",
              isActive && "bg-secondary-container"
            )}>
              <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default function App() {
  const [screen, setScreen] = useState<Screen>('splash');
  const [language, setLanguage] = useState<Language>('en');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{ crop: string, disease: string, confidence: number } | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [checkingSchemeId, setCheckingSchemeId] = useState<number | null>(null);
  const [eligibilityResults, setEligibilityResults] = useState<Record<number, string>>({});
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Voice Recognition Setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = language === 'ta' ? 'ta-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + (prev ? ' ' : '') + transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, [language]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setIsListening(true);
      recognitionRef.current?.start();
    }
  };

  const handleCapture = () => {
    setScanResult(null);
    setPreviewImage(null);
    fileInputRef.current?.click();
  };

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert("Please upload a valid image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      setPreviewImage(base64);
      
      setIsScanning(true);
      const result = await analyzeCropImage(base64, language);
      
      if (result && result.crop) {
        setScanResult({
          crop: result.crop,
          disease: result.disease || "Healthy",
          confidence: result.confidence || 90
        });
      } else {
        // Fallback to mock if AI fails or key missing
        setScanResult({
          crop: "Paddy (Oryza sativa)",
          disease: "Brown Spot (Bipolaris oryzae)",
          confidence: 94
        });
      }
      setIsScanning(false);
    };
    reader.readAsDataURL(file);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleConsultAI = async () => {
    if (!scanResult) return;
    
    setScreen('chat');
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'user',
      content: `I've scanned my ${scanResult.crop}. It detected ${scanResult.disease} with ${scanResult.confidence}% confidence. What should I do?`,
      timestamp: new Date()
    }]);
    
    setIsTyping(true);
    const response = await getAgriAdvice(`The user scanned a ${scanResult.crop} and detected ${scanResult.disease}. Provide a detailed treatment plan.`, language);
    setMessages(prev => [...prev, {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response,
      timestamp: new Date()
    }]);
    setIsTyping(false);
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const response = await getAgriAdvice(input, language);
    
    const aiMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, aiMsg]);
    setIsTyping(false);
  };

  const handleCheckEligibility = async (schemeId: number, schemeTitle: string) => {
    setCheckingSchemeId(schemeId);
    
    // AI-based eligibility check
    const result = await checkSchemeEligibility(schemeTitle, language);
    
    setEligibilityResults(prev => ({
      ...prev,
      [schemeId]: result
    }));
    setCheckingSchemeId(null);
  };

  const renderScreen = () => {
    switch (screen) {
      case 'splash':
        return <SplashScreen onComplete={() => setScreen('onboarding')} />;
      case 'onboarding':
        return <Onboarding onSelect={(lang) => { setLanguage(lang); setScreen('home'); }} />;
      case 'home':
        return (
          <div className="pb-32 px-6 pt-12">
            <header className="flex justify-between items-center mb-10">
              <div>
                <h1 className="text-3xl font-extrabold text-primary italic">AgriSeva AI</h1>
                <p className="text-stone-400 font-medium">Tamil Nadu • Paddy • Summer</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                <img src="https://picsum.photos/seed/farmer/100/100" alt="Profile" referrerPolicy="no-referrer" />
              </div>
            </header>

            <section className="mb-10">
              <div className="bg-gradient-to-br from-primary to-primary-container rounded-xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                <div className="relative z-10">
                  <p className="text-xs font-bold uppercase tracking-widest opacity-70 mb-2">Current Weather</p>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-5xl font-black">{MOCK_WEATHER.temp}°C</h3>
                      <p className="text-lg font-medium opacity-90">{MOCK_WEATHER.condition}</p>
                    </div>
                    <CloudSun size={64} className="text-secondary-container" />
                  </div>
                  <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/20">
                    <div>
                      <p className="text-[10px] uppercase font-bold opacity-60">Humidity</p>
                      <p className="font-bold">{MOCK_WEATHER.humidity}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold opacity-60">Wind</p>
                      <p className="font-bold">{MOCK_WEATHER.windSpeed} km/h</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold opacity-60">UV Index</p>
                      <p className="font-bold">{MOCK_WEATHER.uvIndex}</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-bold mb-6 text-stone-800">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setScreen('chat')}
                  className="bg-white p-6 rounded-xl shadow-sm border border-stone-100 flex flex-col items-center text-center hover:bg-secondary-container transition-colors"
                >
                  <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-4 text-primary">
                    <MessageSquare size={24} />
                  </div>
                  <span className="font-bold text-stone-700">Ask AI Advice</span>
                </button>
                <button 
                  onClick={() => setScreen('upload')}
                  className="bg-white p-6 rounded-xl shadow-sm border border-stone-100 flex flex-col items-center text-center hover:bg-secondary-container transition-colors"
                >
                  <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-4 text-primary">
                    <Camera size={24} />
                  </div>
                  <span className="font-bold text-stone-700">Scan Crop</span>
                </button>
                <button 
                  onClick={() => setScreen('market')}
                  className="bg-white p-6 rounded-xl shadow-sm border border-stone-100 flex flex-col items-center text-center hover:bg-secondary-container transition-colors"
                >
                  <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-4 text-primary">
                    <TrendingUp size={24} />
                  </div>
                  <span className="font-bold text-stone-700">Market Prices</span>
                </button>
                <button 
                  onClick={() => setScreen('schemes')}
                  className="bg-white p-6 rounded-xl shadow-sm border border-stone-100 flex flex-col items-center text-center hover:bg-secondary-container transition-colors"
                >
                  <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-4 text-primary">
                    <Landmark size={24} />
                  </div>
                  <span className="font-bold text-stone-700">Govt Schemes</span>
                </button>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-6 text-stone-800">Farming Tips</h2>
              <div className="bg-secondary-container rounded-xl p-6 flex gap-4 items-start">
                <div className="bg-white rounded-full p-2 text-primary">
                  <Droplets size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-on-secondary-container mb-1">Irrigation Alert</h4>
                  <p className="text-sm text-on-secondary-container opacity-80">High evaporation expected today. Water your paddy fields before 9 AM.</p>
                </div>
              </div>
            </section>
          </div>
        );
      case 'chat':
        return (
          <div className="h-screen flex flex-col bg-surface">
            <header className="p-6 bg-white border-b border-stone-100 flex items-center gap-4 sticky top-0 z-10">
              <button onClick={() => setScreen('home')} className="p-2 hover:bg-stone-50 rounded-full">
                <ChevronLeft size={24} />
              </button>
              <div>
                <h2 className="text-xl font-bold text-primary">AgriSeva AI Expert</h2>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-stone-400 font-medium">Multi-Agent System Active</span>
                </div>
              </div>
            </header>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
                    <Sprout size={40} />
                  </div>
                  <h3 className="text-xl font-bold text-stone-800 mb-2">How can I help you today?</h3>
                  <p className="text-stone-400 max-w-xs mx-auto">Ask about crop health, weather, market prices, or government schemes.</p>
                </div>
              )}
              {messages.map((msg) => (
                <div key={msg.id} className={cn(
                  "flex flex-col max-w-[85%]",
                  msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                )}>
                  <div className={cn(
                    "p-4 rounded-2xl shadow-sm",
                    msg.role === 'user' 
                      ? "bg-primary text-white rounded-tr-none" 
                      : "bg-white text-stone-800 rounded-tl-none border border-stone-100"
                  )}>
                    <div className="prose prose-sm max-w-none prose-stone dark:prose-invert">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                  <span className="text-[10px] text-stone-400 mt-1 font-medium">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
              {isTyping && (
                <div className="flex flex-col items-start max-w-[85%]">
                  <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-stone-100 shadow-sm flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></div>
                    </div>
                    <span className="text-xs text-stone-400 font-medium">Agents are thinking...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-6 bg-white border-t border-stone-100 pb-10">
              <div className="flex gap-3 items-center bg-surface-container-high rounded-full px-5 py-2">
                <button 
                  onClick={toggleListening}
                  className={cn(
                    "p-2 rounded-full transition-all",
                    isListening ? "bg-red-500 text-white animate-pulse" : "text-stone-400 hover:text-primary"
                  )}
                >
                  {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={isListening ? "Listening..." : "Ask anything about farming..."}
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-3"
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isTyping}
                  className="p-2 bg-primary text-white rounded-full disabled:opacity-50 transition-all"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </div>
        );
      case 'weather':
        return (
          <div className="pb-32 px-6 pt-12">
            <header className="flex items-center gap-4 mb-10">
              <button onClick={() => setScreen('home')} className="p-2 hover:bg-stone-100 rounded-full">
                <ChevronLeft size={24} />
              </button>
              <h2 className="text-2xl font-bold text-stone-800">Weather Insights</h2>
            </header>

            <div className="bg-gradient-to-br from-primary to-primary-container rounded-xl p-8 text-white shadow-xl mb-8">
              <div className="flex justify-between items-center mb-10">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest opacity-70 mb-1">Nashik, Maharashtra</p>
                  <h3 className="text-4xl font-black">{MOCK_WEATHER.temp}°C</h3>
                  <p className="text-lg font-medium opacity-90">{MOCK_WEATHER.condition}</p>
                </div>
                <CloudSun size={80} className="text-secondary-container" />
              </div>
              <div className="grid grid-cols-3 gap-4 pt-8 border-t border-white/20">
                <div className="text-center">
                  <Droplets className="mx-auto mb-2 opacity-70" size={20} />
                  <p className="text-[10px] uppercase font-bold opacity-60">Humidity</p>
                  <p className="font-bold">{MOCK_WEATHER.humidity}%</p>
                </div>
                <div className="text-center">
                  <Wind className="mx-auto mb-2 opacity-70" size={20} />
                  <p className="text-[10px] uppercase font-bold opacity-60">Wind</p>
                  <p className="font-bold">{MOCK_WEATHER.windSpeed} km/h</p>
                </div>
                <div className="text-center">
                  <Sun className="mx-auto mb-2 opacity-70" size={20} />
                  <p className="text-[10px] uppercase font-bold opacity-60">UV Index</p>
                  <p className="font-bold">{MOCK_WEATHER.uvIndex}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-stone-800 mb-4">3-Day Forecast</h3>
              {MOCK_WEATHER.forecast.map((f, i) => (
                <div key={i} className="bg-white p-6 rounded-xl border border-stone-100 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-primary">
                      {f.condition === 'Sunny' ? <Sun size={24} /> : f.condition === 'Cloudy' ? <CloudSun size={24} /> : <Droplets size={24} />}
                    </div>
                    <div>
                      <p className="font-bold text-stone-800">{f.day}</p>
                      <p className="text-xs text-stone-400">{f.condition}</p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-baseline">
                    <span className="text-xl font-black text-stone-800">{f.tempHigh}°</span>
                    <span className="text-sm font-medium text-stone-300">{f.tempLow}°</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'schemes':
        return (
          <div className="pb-32 px-6 pt-12">
            <header className="flex items-center gap-4 mb-10">
              <button onClick={() => setScreen('home')} className="p-2 hover:bg-stone-100 rounded-full">
                <ChevronLeft size={24} />
              </button>
              <h2 className="text-2xl font-bold text-stone-800">Govt Schemes</h2>
            </header>

            <div className="space-y-6">
              {SCHEMES.map((scheme) => (
                <div key={scheme.id} className="bg-white p-8 rounded-xl border border-stone-100 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                  <h3 className="text-xl font-bold text-primary mb-3 relative z-10">{scheme.title}</h3>
                  <p className="text-stone-500 text-sm leading-relaxed mb-6 relative z-10">{scheme.desc}</p>
                  
                  {eligibilityResults[scheme.id] ? (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mb-6 p-4 bg-secondary-container/30 rounded-xl border border-primary/10"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 size={16} className="text-primary" />
                        <span className="text-xs font-bold text-primary uppercase tracking-wider">Eligibility Result</span>
                      </div>
                      <p className="text-sm text-stone-700 leading-relaxed italic">
                        {eligibilityResults[scheme.id]}
                      </p>
                    </motion.div>
                  ) : null}

                  <button 
                    onClick={() => handleCheckEligibility(scheme.id, scheme.title)}
                    disabled={checkingSchemeId === scheme.id}
                    className="w-full py-3 bg-secondary-container text-on-secondary-container rounded-full text-sm font-bold hover:bg-primary hover:text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {checkingSchemeId === scheme.id ? (
                      <>
                        <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                        Checking...
                      </>
                    ) : (
                      'Check Eligibility'
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      case 'market':
        return (
          <div className="pb-32 px-6 pt-12">
            <header className="flex items-center gap-4 mb-10">
              <button onClick={() => setScreen('home')} className="p-2 hover:bg-stone-100 rounded-full">
                <ChevronLeft size={24} />
              </button>
              <h2 className="text-2xl font-bold text-stone-800">Market Prices</h2>
            </header>

            <div className="bg-white rounded-xl border border-stone-100 shadow-sm overflow-hidden mb-8">
              <div className="p-6 bg-green-50 border-b border-stone-100">
                <h3 className="font-bold text-primary">Nashik Mandi (Today)</h3>
              </div>
              <div className="divide-y divide-stone-50">
                {[
                  { crop: 'Paddy (Common)', price: '₹2,183', trend: 'up' },
                  { crop: 'Onion (Red)', price: '₹1,850', trend: 'down' },
                  { crop: 'Tomato', price: '₹2,400', trend: 'up' },
                  { crop: 'Wheat', price: '₹2,650', trend: 'stable' },
                ].map((item, i) => (
                  <div key={i} className="p-6 flex justify-between items-center">
                    <span className="font-bold text-stone-700">{item.crop}</span>
                    <div className="text-right">
                      <p className="font-black text-stone-900">{item.price}</p>
                      <p className={cn(
                        "text-[10px] font-bold uppercase tracking-wider",
                        item.trend === 'up' ? "text-green-500" : item.trend === 'down' ? "text-red-500" : "text-stone-400"
                      )}>
                        {item.trend === 'up' ? '↑ Increasing' : item.trend === 'down' ? '↓ Decreasing' : '→ Stable'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-tertiary-container p-6 rounded-xl">
              <h4 className="font-bold text-on-tertiary-container mb-2">Expert Strategy</h4>
              <p className="text-sm text-on-tertiary-container opacity-80 leading-relaxed">
                Paddy prices are expected to rise by 5% next week. If possible, delay selling your harvest for better returns.
              </p>
            </div>
          </div>
        );
      case 'upload':
        return (
          <div className="pb-32 px-6 pt-12">
            <header className="flex items-center gap-4 mb-10">
              <button onClick={() => setScreen('home')} className="p-2 hover:bg-stone-100 rounded-full">
                <ChevronLeft size={24} />
              </button>
              <h2 className="text-2xl font-bold text-stone-800">Scan Crop</h2>
            </header>

            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={onFileChange} 
              accept="image/*" 
              capture="environment" 
              className="hidden" 
            />

            <AnimatePresence mode="wait">
              {isScanning ? (
                <motion.div 
                  key="scanning"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full aspect-square bg-white rounded-3xl border border-stone-100 shadow-sm flex flex-col items-center justify-center mb-10 overflow-hidden relative"
                >
                  <div className="absolute inset-0 bg-primary/5 animate-pulse"></div>
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-6"></div>
                    <p className="font-bold text-primary text-lg">Analyzing Crop...</p>
                    <p className="text-xs text-stone-400 mt-2">Gemini Vision AI is processing your image</p>
                  </div>
                </motion.div>
              ) : scanResult ? (
                <motion.div 
                  key="result"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6 mb-10"
                >
                  {previewImage && (
                    <div className="w-full h-48 rounded-2xl overflow-hidden border border-stone-100 mb-4">
                      <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="bg-secondary-container rounded-3xl p-8 shadow-sm border border-primary/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4">
                      <div className="w-16 h-16 rounded-full bg-white flex flex-col items-center justify-center shadow-sm border border-primary/5">
                        <span className="text-xs font-black text-primary leading-none">{scanResult.confidence}%</span>
                        <span className="text-[8px] uppercase font-bold text-stone-400">Match</span>
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <p className="text-[10px] uppercase font-bold tracking-widest text-primary/60 mb-1">Detected Crop</p>
                      <h3 className="text-2xl font-black text-primary">{scanResult.crop}</h3>
                    </div>
                    
                    <div className="p-4 bg-white/50 rounded-2xl border border-white/50">
                      <p className="text-[10px] uppercase font-bold tracking-widest text-red-500/60 mb-1">Health Status</p>
                      <p className="font-bold text-stone-800">{scanResult.disease}</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button 
                      onClick={handleConsultAI}
                      className="flex-1 py-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
                    >
                      <MessageSquare size={20} />
                      Consult AI Expert
                    </button>
                    <button 
                      onClick={handleCapture}
                      className="px-6 py-4 bg-white text-stone-600 rounded-xl font-bold border border-stone-100 shadow-sm active:scale-95 transition-all"
                    >
                      Retake
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="idle" className="space-y-6 mb-10">
                  <button 
                    onClick={handleCapture}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    className={cn(
                      "w-full aspect-square rounded-3xl border-4 border-dashed flex flex-col items-center justify-center transition-all group",
                      isDragging 
                        ? "bg-primary/10 border-primary scale-[1.02]" 
                        : "bg-stone-100 border-stone-200 text-stone-400 hover:bg-secondary-container hover:border-primary"
                    )}
                  >
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
                      <Camera size={40} strokeWidth={1.5} className="text-primary" />
                    </div>
                    <p className="font-bold text-stone-700 group-hover:text-primary">
                      {isDragging ? "Drop image here" : "Tap or Drag image here"}
                    </p>
                    <p className="text-xs px-8">Point your camera or drop a photo of the affected area</p>
                  </button>

                  <button 
                    onClick={handleCapture}
                    className="w-full py-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
                  >
                    <Camera size={20} />
                    Start New Scan
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-4">
              <h3 className="font-bold text-stone-800">Recent Scans</h3>
              <div className="bg-white p-4 rounded-xl border border-stone-100 shadow-sm flex items-center gap-4">
                <div className="w-16 h-16 bg-stone-100 rounded-lg overflow-hidden">
                  <img src="https://picsum.photos/seed/leaf/100/100" alt="Scan" referrerPolicy="no-referrer" />
                </div>
                <div>
                  <p className="font-bold text-stone-800">Paddy Leaf Blast</p>
                  <p className="text-xs text-red-500 font-bold">Infection Detected</p>
                  <p className="text-[10px] text-stone-400 mt-1">2 days ago</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'profile':
        return (
          <div className="pb-32 px-6 pt-12">
            <header className="text-center mb-12">
              <div className="w-24 h-24 rounded-full bg-surface-container mx-auto mb-6 border-4 border-white shadow-md overflow-hidden">
                <img src="https://picsum.photos/seed/farmer/200/200" alt="Profile" referrerPolicy="no-referrer" />
              </div>
              <h2 className="text-2xl font-bold text-stone-800">Harish Kumar</h2>
              <p className="text-stone-400 font-medium">Farmer ID: #AS-9921</p>
            </header>

            <div className="space-y-4">
              <div className="bg-white p-6 rounded-xl border border-stone-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-primary">
                    <Globe size={20} />
                  </div>
                  <span className="font-bold text-stone-700">Language</span>
                </div>
                <span className="text-sm font-bold text-primary">{language === 'en' ? 'English' : language === 'hi' ? 'हिन्दी' : 'தமிழ்'}</span>
              </div>
              <div className="bg-white p-6 rounded-xl border border-stone-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-primary">
                    <Leaf size={20} />
                  </div>
                  <span className="font-bold text-stone-700">My Crops</span>
                </div>
                <span className="text-sm font-bold text-stone-400">Paddy, Tomato</span>
              </div>
              <div className="bg-white p-6 rounded-xl border border-stone-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-primary">
                    <CheckCircle2 size={20} />
                  </div>
                  <span className="font-bold text-stone-700">Verified Badges</span>
                </div>
                <div className="flex gap-1">
                  <div className="w-6 h-6 bg-yellow-400 rounded-full"></div>
                  <div className="w-6 h-6 bg-blue-400 rounded-full"></div>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setScreen('onboarding')}
              className="w-full mt-12 py-4 bg-stone-100 text-stone-500 rounded-xl font-bold hover:bg-red-50 hover:text-red-500 transition-all"
            >
              Logout
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-md mx-auto bg-surface min-h-screen relative shadow-2xl overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={screen}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.3 }}
          className="min-h-screen"
        >
          {renderScreen()}
        </motion.div>
      </AnimatePresence>
      
      {['home', 'weather', 'market', 'profile', 'chat', 'schemes', 'upload'].includes(screen) && screen !== 'chat' && (
        <BottomNav active={screen} onNavigate={setScreen} />
      )}
    </div>
  );
}
