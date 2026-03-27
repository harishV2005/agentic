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
  MicOff,
  Search,
  Edit2,
  Save,
  X,
  History,
  Maximize,
  MapPin
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { cn } from './lib/utils';
import { Screen, Language, Message, WeatherData } from './types';
import { getAgriAdvice, analyzeCropImage, checkSchemeEligibility, getWeatherAdvice, findNearbyAgriOffices } from './services/gemini';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  doc, 
  setDoc, 
  onSnapshot, 
  serverTimestamp,
  User as FirebaseUser
} from './firebase';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- Mock Data ---
const LOCATION_DATA: Record<string, string[]> = {
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Trichy','Tirunelveli', 'Karur', 'Salem', 'Tanjore'],
  'Karnataka': ['Bangalore', 'Mysore', 'Mangalore'],
  'Kerala': ['Kochi', 'Thiruvananthapuram', 'Kozhikode'],
  'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur'],
  'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik'],
  'Delhi': ['New Delhi', 'North Delhi', 'South Delhi']
};

const VALID_CROPS = [
  'Paddy', 'Wheat', 'Sugarcane', 'Cotton', 'Maize', 'Millet', 
  'Tomato', 'Chilly', 'Onion', 'Potato', 'Soybean', 'Groundnut', 
  'Mustard', 'Jute', 'Coffee', 'Tea', 'Coconut', 'Banana', 'Mango'
];

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
  ],
  hourly: [
    { time: "Now", temp: 32, condition: "Sunny" },
    { time: "1 PM", temp: 33, condition: "Sunny" },
    { time: "2 PM", temp: 34, condition: "Sunny" },
    { time: "3 PM", temp: 34, condition: "Sunny" },
    { time: "4 PM", temp: 33, condition: "Cloudy" },
    { time: "5 PM", temp: 31, condition: "Cloudy" },
    { time: "6 PM", temp: 29, condition: "Partly Cloudy" },
    { time: "7 PM", temp: 27, condition: "Clear" },
    { time: "8 PM", temp: 26, condition: "Clear" },
  ]
};

const MARKET_TRENDS = [
  { month: 'Jan', price: 2100 },
  { month: 'Feb', price: 2150 },
  { month: 'Mar', price: 2183 },
  { month: 'Apr', price: 2250 },
  { month: 'May', price: 2300 },
  { month: 'Jun', price: 2450 },
];

const SCHEMES = [
  { id: 1, title: "PM-KISAN", desc: "Direct income support of ₹6,000 per year to all landholding farmer families." },
  { id: 2, title: "PM Fasal Bima Yojana", desc: "Crop insurance scheme to provide financial support to farmers suffering crop loss." },
  { id: 3, title: "Kisan Credit Card (KCC)", desc: "Provides farmers with timely access to credit for their cultivation and other needs." },
];

// --- Components ---

const SplashScreen = ({ onComplete, isReady }: { onComplete: () => void, isReady: boolean }) => {
  const [timerDone, setTimerDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setTimerDone(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (timerDone && isReady) {
      onComplete();
    }
  }, [timerDone, isReady, onComplete]);

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

const Onboarding = ({ onComplete }: { onComplete: (data: { lang: Language, location: string, crop: string }) => void }) => {
  const [step, setStep] = useState(1);
  const [selectedLang, setSelectedLang] = useState<Language>('en');
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('');

  const handleNext = () => {
    if (step === 1) setStep(2);
    else if (step === 2) {
      if (selectedState && selectedDistrict) setStep(3);
    } else {
      if (selectedCrop) {
        onComplete({
          lang: selectedLang,
          location: `${selectedDistrict}, ${selectedState}`,
          crop: selectedCrop
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-surface p-8 flex flex-col justify-center">
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Globe className="text-primary w-8 h-8" />
              </div>
              <h2 className="text-3xl font-bold text-stone-800 mb-3">Select Language</h2>
              <p className="text-stone-500">Choose your preferred language for communication</p>
            </div>
            <div className="space-y-3">
              {[
                { id: 'en', label: 'English', sub: 'Continue in English' },
                { id: 'hi', label: 'हिन्दी', sub: 'हिंदी में जारी रखें' },
                { id: 'ta', label: 'தமிழ்', sub: 'தமிழில் தொடரவும்' },
              ].map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => {
                    setSelectedLang(lang.id as Language);
                    setStep(2);
                  }}
                  className={cn(
                    "w-full p-5 rounded-xl border flex items-center justify-between transition-all group",
                    selectedLang === lang.id ? "bg-primary/5 border-primary shadow-sm" : "bg-white border-stone-100"
                  )}
                >
                  <div className="text-left">
                    <div className="font-bold text-stone-800">{lang.label}</div>
                    <div className="text-xs text-stone-400">{lang.sub}</div>
                  </div>
                  {selectedLang === lang.id && <CheckCircle2 className="text-primary w-5 h-5" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <MapPin className="text-primary w-8 h-8" />
              </div>
              <h2 className="text-3xl font-bold text-stone-800 mb-3">Your Location</h2>
              <p className="text-stone-500">Help us tailor advice to your local weather and soil</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">State</label>
                <select 
                  value={selectedState}
                  onChange={(e) => {
                    setSelectedState(e.target.value);
                    setSelectedDistrict('');
                  }}
                  className="w-full p-4 bg-white rounded-xl border border-stone-100 focus:ring-2 focus:ring-primary/20 outline-none font-medium"
                >
                  <option value="">Select State</option>
                  {Object.keys(LOCATION_DATA).map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">District</label>
                <select 
                  value={selectedDistrict}
                  disabled={!selectedState}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="w-full p-4 bg-white rounded-xl border border-stone-100 focus:ring-2 focus:ring-primary/20 outline-none font-medium disabled:opacity-50"
                >
                  <option value="">Select District</option>
                  {selectedState && LOCATION_DATA[selectedState].map(dist => (
                    <option key={dist} value={dist}>{dist}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleNext}
                disabled={!selectedState || !selectedDistrict}
                className="w-full py-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 disabled:opacity-50 transition-all active:scale-95"
              >
                Continue
              </button>
              <button onClick={() => setStep(1)} className="w-full text-stone-400 text-sm font-medium">Back</button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Leaf className="text-primary w-8 h-8" />
              </div>
              <h2 className="text-3xl font-bold text-stone-800 mb-3">Primary Crop</h2>
              <p className="text-stone-500">What is the main crop you are growing right now?</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {VALID_CROPS.slice(0, 10).map((crop) => (
                <button
                  key={crop}
                  onClick={() => setSelectedCrop(crop)}
                  className={cn(
                    "p-4 rounded-xl border text-sm font-bold transition-all",
                    selectedCrop === crop ? "bg-primary text-white border-primary shadow-md" : "bg-white text-stone-600 border-stone-100"
                  )}
                >
                  {crop}
                </button>
              ))}
            </div>
            <div className="space-y-4">
              <button
                onClick={handleNext}
                disabled={!selectedCrop}
                className="w-full py-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 disabled:opacity-50 transition-all active:scale-95"
              >
                Finish Setup
              </button>
              <button onClick={() => setStep(2)} className="w-full text-stone-400 text-sm font-medium">Back</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const LoginScreen = ({ onLoginSuccess }: { onLoginSuccess: () => void }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      onLoginSuccess();
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfdfb] p-8 flex flex-col items-center justify-between py-24">
      <div className="flex flex-col items-center text-center">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center mb-8 shadow-sm border border-stone-100"
        >
          <Sprout className="text-primary w-12 h-12" />
        </motion.div>
        <h2 className="text-4xl font-serif italic text-stone-900 mb-4">AgriSeva AI</h2>
        <p className="text-stone-500 max-w-[280px] leading-relaxed font-medium">
          Your intelligent companion for modern farming. Join our community of successful farmers.
        </p>
      </div>

      <div className="w-full max-w-xs space-y-6">
        <button
          onClick={handleLogin}
          disabled={isLoading}
          className="w-full p-5 bg-stone-900 text-white rounded-2xl shadow-xl flex items-center justify-center gap-4 hover:bg-stone-800 transition-all active:scale-[0.98] disabled:opacity-50 font-bold"
        >
          {isLoading ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <div className="bg-white p-1 rounded-full">
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
              </div>
              Continue with Google
            </>
          )}
        </button>
        
        <div className="space-y-2">
          <p className="text-[11px] text-stone-400 text-center px-6 leading-tight">
            By continuing, you agree to our <span className="underline">Terms</span> and <span className="underline">Privacy Policy</span>.
          </p>
          <div className="h-px bg-stone-100 w-12 mx-auto" />
          <p className="text-[10px] text-stone-300 text-center uppercase tracking-widest font-bold">
            Secure & Private
          </p>
        </div>
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
  const [schemeSearchQuery, setSchemeSearchQuery] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [weatherAdvice, setWeatherAdvice] = useState<string>('');
  const [isLoadingWeatherAdvice, setIsLoadingWeatherAdvice] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [isFindingOffices, setIsFindingOffices] = useState(false);
  const [nearbyOffices, setNearbyOffices] = useState<string | null>(null);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [profileData, setProfileData] = useState({
    name: 'Harish Kumar',
    location: 'Chennai, Tamil Nadu',
    crops: 'Paddy',
    farmSize: '5',
    farmUnit: 'Acres'
  });

  const [selectedState, setSelectedState] = useState('Tamil Nadu');
  const [selectedDistrict, setSelectedDistrict] = useState('Chennai');
  const [selectedCrop, setSelectedCrop] = useState('Paddy');
  const [selectedName, setSelectedName] = useState('Harish Kumar');
  const [selectedFarmSize, setSelectedFarmSize] = useState('5');
  const [selectedFarmUnit, setSelectedFarmUnit] = useState('Acres');
  const [cropError, setCropError] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const profileDataRef = useRef(profileData);

  useEffect(() => {
    profileDataRef.current = profileData;
  }, [profileData]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
      if (currentUser) {
        if (screen === 'splash' || screen === 'onboarding') {
          // Keep it as is or move to home if already onboarded
        }
      } else {
        // Only redirect to splash if trying to access protected screens while not logged in
        if (!['splash', 'onboarding', 'login'].includes(screen)) {
          setScreen('splash');
        }
      }
    });
    return () => unsubscribe();
  }, [screen]);

  // Firestore Sync
  useEffect(() => {
    if (!user || !isAuthReady) return;

    const path = `users/${user.uid}`;
    const unsubscribe = onSnapshot(doc(db, path), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setProfileData({
          name: data.name || 'Harish Kumar',
          location: data.location || 'Chennai, Tamil Nadu',
          crops: data.crops || 'Paddy',
          farmSize: data.farmSize || '5',
          farmUnit: data.farmUnit || 'Acres'
        });
        
        // Also update selection states if not editing
        if (!isEditingProfile) {
          setSelectedName(data.name || 'Harish Kumar');
          setSelectedCrop(data.crops || 'Paddy');
          setSelectedFarmSize(data.farmSize || '5');
          setSelectedFarmUnit(data.farmUnit || 'Acres');
          
          const locParts = (data.location || 'Chennai, Tamil Nadu').split(',');
          if (locParts.length === 2) {
            setSelectedDistrict(locParts[0].trim());
            setSelectedState(locParts[1].trim());
          }
        }
      } else {
        // If profile doesn't exist, save the current local profile data (which might have been set during onboarding)
        const initialProfile = {
          uid: user.uid,
          name: user.displayName || 'Farmer',
          location: profileDataRef.current.location,
          crops: profileDataRef.current.crops,
          farmSize: profileDataRef.current.farmSize,
          farmUnit: profileDataRef.current.farmUnit,
          updatedAt: serverTimestamp()
        };
        setDoc(doc(db, path), initialProfile).catch(err => handleFirestoreError(err, OperationType.WRITE, path));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });

    return () => unsubscribe();
  }, [user, isAuthReady, isEditingProfile]);

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

  const fetchWeather = async (location: string) => {
    const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
    if (!apiKey) {
      console.warn("OpenWeatherMap API Key is missing. Using mock data.");
      setWeatherData(MOCK_WEATHER);
      return MOCK_WEATHER;
    }

    setIsWeatherLoading(true);
    setWeatherError(null);

    try {
      // Use the district/city part of the location string
      const city = location.split(',')[0].trim();
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`
      );

      if (!response.ok) {
        throw new Error(response.status === 404 ? "Invalid location. Please select a valid city." : "Failed to fetch weather data.");
      }

      const data = await response.json();
      
      const newWeatherData: WeatherData = {
        temp: Math.round(data.main.temp),
        condition: data.weather[0].main,
        humidity: data.main.humidity,
        windSpeed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
        uvIndex: "Moderate", // Current weather API doesn't provide UV index
        forecast: MOCK_WEATHER.forecast, // Mock forecast as free API only gives current
        hourly: MOCK_WEATHER.hourly // Mock hourly as free API only gives current
      };

      setWeatherData(newWeatherData);
      return newWeatherData;
    } catch (err: any) {
      setWeatherError(err.message);
      setWeatherData(null);
      return null;
    } finally {
      setIsWeatherLoading(false);
    }
  };

  // Fetch weather and advice when location or language changes
  useEffect(() => {
    const updateWeatherAndAdvice = async () => {
      if (screen === 'weather' || screen === 'home') {
        const currentWeather = await fetchWeather(profileData.location);
        
        setIsLoadingWeatherAdvice(true);
        const advice = await getWeatherAdvice(
          profileData.location, 
          language, 
          profileData.crops,
          currentWeather ? { 
            temp: currentWeather.temp, 
            humidity: currentWeather.humidity, 
            condition: currentWeather.condition 
          } : undefined
        );
        setWeatherAdvice(advice);
        setIsLoadingWeatherAdvice(false);
      }
    };
    updateWeatherAndAdvice();
  }, [profileData.location, language, screen]);

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

  const handleFindOffices = async () => {
    setIsFindingOffices(true);
    setNearbyOffices(null);
    try {
      const result = await findNearbyAgriOffices(profileData.location, language);
      setNearbyOffices(result);
    } catch (error) {
      console.error("Error finding offices:", error);
      setNearbyOffices("Unable to find nearby offices at this time.");
    } finally {
      setIsFindingOffices(false);
    }
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
    const response = await getAgriAdvice(
      `The user scanned a ${scanResult.crop} and detected ${scanResult.disease}. Provide a detailed treatment plan.`, 
      language,
      profileData.location,
      profileData.crops
    );
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

    const response = await getAgriAdvice(input, language, profileData.location, profileData.crops);
    
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
    const result = await checkSchemeEligibility(schemeTitle, language, profileData.location, profileData.crops);
    
    setEligibilityResults(prev => ({
      ...prev,
      [schemeId]: result
    }));
    setCheckingSchemeId(null);
  };

  const renderScreen = () => {
    switch (screen) {
      case 'splash':
        return <SplashScreen 
          isReady={isAuthReady}
          onComplete={() => {
            if (user) setScreen('home');
            else setScreen('onboarding');
          }} 
        />;
      case 'onboarding':
        return <Onboarding onComplete={(data) => { 
          setLanguage(data.lang);
          setProfileData(prev => ({
            ...prev,
            location: data.location,
            crops: data.crop
          }));
          // Pre-populate selection states for profile edit screen
          const locParts = data.location.split(',');
          if (locParts.length === 2) {
            setSelectedDistrict(locParts[0].trim());
            setSelectedState(locParts[1].trim());
          }
          setSelectedCrop(data.crop);

          if (user) setScreen('home');
          else setScreen('login');
        }} />;
      case 'login':
        return <LoginScreen onLoginSuccess={() => setScreen('home')} />;
      case 'home':
        return (
          <div className="pb-32 px-6 pt-12">
            <header className="flex justify-between items-center mb-10">
              <div>
                <h1 className="text-3xl font-extrabold text-primary italic">AgriSeva AI</h1>
                <p className="text-stone-400 font-medium">{profileData.location} • {profileData.crops} • Summer</p>
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
                  {isWeatherLoading ? (
                    <div className="py-10 flex flex-col items-center justify-center">
                      <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4"></div>
                      <p className="text-sm font-bold">Fetching weather...</p>
                    </div>
                  ) : weatherError ? (
                    <div className="py-10 text-center">
                      <p className="text-sm font-bold text-red-100">❌ {weatherError}</p>
                    </div>
                  ) : weatherData ? (
                    <>
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-5xl font-black">{weatherData.temp}°C</h3>
                          <p className="text-lg font-medium opacity-90">{weatherData.condition}</p>
                        </div>
                        <CloudSun size={64} className="text-secondary-container" />
                      </div>
                      <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/20">
                        <div>
                          <p className="text-[10px] uppercase font-bold opacity-60">Humidity</p>
                          <p className="font-bold">{weatherData.humidity}%</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold opacity-60">Wind</p>
                          <p className="font-bold">{weatherData.windSpeed} km/h</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold opacity-60">UV Index</p>
                          <p className="font-bold">{weatherData.uvIndex}</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="py-10 text-center">
                      <p className="text-sm font-bold opacity-70">No weather data available</p>
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-bold mb-6 text-stone-800">Weather Advice</h2>
              <div className="bg-secondary-container rounded-xl p-6 flex gap-4 items-start shadow-sm">
                <div className="bg-white rounded-full p-2 text-primary shrink-0">
                  <CloudSun size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-on-secondary-container mb-1">AI Weather Expert</h4>
                  {isLoadingWeatherAdvice ? (
                    <div className="flex gap-1 py-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></div>
                    </div>
                  ) : (
                    <p className="text-sm text-on-secondary-container opacity-90 leading-relaxed">
                      {weatherAdvice || "Select a location to get personalized weather advice."}
                    </p>
                  )}
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

            <div className="mb-8">
              <label className="block text-sm font-bold text-stone-500 mb-2 uppercase tracking-wider">Select State</label>
              <select 
                value={selectedState}
                onChange={(e) => {
                  const state = e.target.value;
                  setSelectedState(state);
                  setSelectedDistrict(''); // Reset district when state changes
                  setProfileData(prev => ({ ...prev, location: `${state}` }));
                  setLocationError("Please select a valid district");
                }}
                className="w-full p-4 bg-white rounded-xl border border-stone-100 shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-stone-800 font-medium mb-4"
              >
                <option value="">Select State</option>
                {Object.keys(LOCATION_DATA).map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>

              <label className="block text-sm font-bold text-stone-500 mb-2 uppercase tracking-wider">Select District</label>
              <select 
                value={selectedDistrict}
                disabled={!selectedState}
                onChange={(e) => {
                  const district = e.target.value;
                  setSelectedDistrict(district);
                  if (district) {
                    setProfileData(prev => ({ ...prev, location: `${district}, ${selectedState}` }));
                    setLocationError(null);
                  } else {
                    setLocationError("Please select a valid location");
                  }
                }}
                className="w-full p-4 bg-white rounded-xl border border-stone-100 shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-stone-800 font-medium disabled:opacity-50"
              >
                <option value="">Select District</option>
                {selectedState && LOCATION_DATA[selectedState].map(dist => (
                  <option key={dist} value={dist}>{dist}</option>
                ))}
              </select>
              {locationError && <p className="text-red-500 text-xs mt-2 font-medium">{locationError}</p>}
            </div>

            <div className="bg-gradient-to-br from-primary to-primary-container rounded-xl p-8 text-white shadow-xl mb-8">
              {isWeatherLoading ? (
                <div className="py-16 flex flex-col items-center justify-center">
                  <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4"></div>
                  <p className="text-lg font-bold">Fetching weather...</p>
                </div>
              ) : weatherError ? (
                <div className="py-16 text-center">
                  <p className="text-lg font-bold text-red-100">❌ {weatherError}</p>
                  <p className="text-sm opacity-70 mt-2">Please check your location settings.</p>
                </div>
              ) : weatherData ? (
                <>
                  <div className="flex justify-between items-center mb-10">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest opacity-70 mb-1">{profileData.location}</p>
                      <h3 className="text-4xl font-black">{weatherData.temp}°C</h3>
                      <p className="text-lg font-medium opacity-90">{weatherData.condition}</p>
                    </div>
                    <CloudSun size={80} className="text-secondary-container" />
                  </div>
                  <div className="grid grid-cols-3 gap-4 pt-8 border-t border-white/20">
                    <div className="text-center">
                      <Droplets className="mx-auto mb-2 opacity-70" size={20} />
                      <p className="text-[10px] uppercase font-bold opacity-60">Humidity</p>
                      <p className="font-bold">{weatherData.humidity}%</p>
                    </div>
                    <div className="text-center">
                      <Wind className="mx-auto mb-2 opacity-70" size={20} />
                      <p className="text-[10px] uppercase font-bold opacity-60">Wind</p>
                      <p className="font-bold">{weatherData.windSpeed} km/h</p>
                    </div>
                    <div className="text-center">
                      <Sun className="mx-auto mb-2 opacity-70" size={20} />
                      <p className="text-[10px] uppercase font-bold opacity-60">UV Index</p>
                      <p className="font-bold">{weatherData.uvIndex}</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-16 text-center">
                  <p className="text-lg font-bold opacity-70">No weather data available</p>
                </div>
              )}
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-bold text-stone-800 mb-4">Hourly Forecast</h3>
              <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                {(weatherData?.hourly || MOCK_WEATHER.hourly).map((h, i) => (
                  <div key={i} className="flex-shrink-0 bg-white p-4 rounded-xl border border-stone-100 shadow-sm flex flex-col items-center min-w-[80px]">
                    <span className="text-xs font-bold text-stone-400 mb-2">{h.time}</span>
                    <div className="text-primary mb-2">
                      {h.condition === 'Sunny' ? <Sun size={20} /> : h.condition === 'Clear' ? <Sun size={20} /> : <CloudSun size={20} />}
                    </div>
                    <span className="font-black text-stone-800">{h.temp}°</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-stone-800 mb-4">3-Day Forecast</h3>
              {(weatherData?.forecast || MOCK_WEATHER.forecast).map((f, i) => (
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
        const filteredSchemes = SCHEMES.filter(s => 
          s.title.toLowerCase().includes(schemeSearchQuery.toLowerCase()) || 
          s.desc.toLowerCase().includes(schemeSearchQuery.toLowerCase())
        );
        return (
          <div className="pb-32 px-6 pt-12">
            <header className="flex items-center gap-4 mb-10">
              <button onClick={() => setScreen('home')} className="p-2 hover:bg-stone-100 rounded-full">
                <ChevronLeft size={24} />
              </button>
              <h2 className="text-2xl font-bold text-stone-800">Govt Schemes</h2>
            </header>

            <div className="mb-8 relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search size={20} className="text-stone-400" />
              </div>
              <input 
                type="text" 
                value={schemeSearchQuery}
                onChange={(e) => setSchemeSearchQuery(e.target.value)}
                placeholder="Search schemes..."
                className="w-full pl-12 pr-6 py-4 bg-white rounded-xl border border-stone-100 shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
              />
            </div>

            <div className="space-y-6">
              {filteredSchemes.map((scheme) => (
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

            <div className="bg-white p-6 rounded-xl border border-stone-100 shadow-sm mb-8">
              <div className="flex items-center gap-2 mb-6">
                <History size={20} className="text-primary" />
                <h3 className="font-bold text-stone-800">Price Trends (Paddy)</h3>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={MARKET_TRENDS}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#9ca3af' }} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#9ca3af' }}
                      domain={['dataMin - 100', 'dataMax + 100']}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      cursor={{ fill: '#f9fafb' }}
                    />
                    <Bar dataKey="price" radius={[4, 4, 0, 0]}>
                      {MARKET_TRENDS.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === MARKET_TRENDS.length - 1 ? '#166534' : '#86efac'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

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
            <header className="text-center mb-12 relative">
              <button 
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className="absolute top-0 right-0 p-2 bg-white rounded-full shadow-sm border border-stone-100 text-primary hover:bg-primary hover:text-white transition-all"
              >
                {isEditingProfile ? <X size={20} /> : <Edit2 size={20} />}
              </button>
              <div className="w-24 h-24 rounded-full bg-surface-container mx-auto mb-6 border-4 border-white shadow-md overflow-hidden">
                <img src="https://picsum.photos/seed/farmer/200/200" alt="Profile" referrerPolicy="no-referrer" />
              </div>
              {isEditingProfile ? (
                <div className="max-w-[200px] mx-auto mb-2">
                  <input 
                    type="text" 
                    value={selectedName}
                    onChange={(e) => setSelectedName(e.target.value)}
                    className="w-full p-2 bg-white rounded-lg border border-stone-100 text-center font-bold text-xl focus:ring-2 focus:ring-primary/20 outline-none"
                    placeholder="Enter your name"
                  />
                </div>
              ) : (
                <h2 className="text-2xl font-bold text-stone-800">{profileData.name}</h2>
              )}
              <p className="text-stone-400 font-medium">Farmer ID: #AS-9921</p>
            </header>

            <div className="space-y-4">
              <div className="bg-white p-6 rounded-xl border border-stone-100 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-primary">
                      <Globe size={20} />
                    </div>
                    <span className="font-bold text-stone-700">Location</span>
                  </div>
                  {!isEditingProfile && <span className="text-sm font-bold text-primary">{profileData.location}</span>}
                </div>
                {isEditingProfile && (
                  <div className="space-y-3 mt-4">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-stone-400 mb-1 block">State</label>
                      <select 
                        value={selectedState}
                        onChange={(e) => {
                          setSelectedState(e.target.value);
                          setSelectedDistrict('');
                          setLocationError("Please select a valid location");
                        }}
                        className="w-full p-3 bg-stone-50 rounded-lg border border-stone-100 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                      >
                        <option value="">Select State</option>
                        {Object.keys(LOCATION_DATA).map(state => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-stone-400 mb-1 block">District</label>
                      <select 
                        value={selectedDistrict}
                        disabled={!selectedState}
                        onChange={(e) => {
                          setSelectedDistrict(e.target.value);
                          if (e.target.value) setLocationError(null);
                        }}
                        className="w-full p-3 bg-stone-50 rounded-lg border border-stone-100 text-sm focus:ring-2 focus:ring-primary/20 outline-none disabled:opacity-50"
                      >
                        <option value="">Select District</option>
                        {selectedState && LOCATION_DATA[selectedState].map(dist => (
                          <option key={dist} value={dist}>{dist}</option>
                        ))}
                      </select>
                    </div>
                    {locationError && <p className="text-red-500 text-[10px] font-medium">{locationError}</p>}
                  </div>
                )}
              </div>

              <div className="bg-white p-6 rounded-xl border border-stone-100 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-primary">
                      <Leaf size={20} />
                    </div>
                    <span className="font-bold text-stone-700">Primary Crop</span>
                  </div>
                  {!isEditingProfile && <span className="text-sm font-bold text-stone-400">{profileData.crops}</span>}
                </div>
                {isEditingProfile && (
                  <div className="mt-4">
                    <label className="text-[10px] uppercase font-bold text-stone-400 mb-1 block">Crop</label>
                    <select 
                      value={selectedCrop}
                      onChange={(e) => {
                        setSelectedCrop(e.target.value);
                        if (e.target.value) setCropError(null);
                        else setCropError("Please select a valid crop");
                      }}
                      className="w-full p-3 bg-stone-50 rounded-lg border border-stone-100 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    >
                      <option value="">Select Crop</option>
                      {VALID_CROPS.map(crop => (
                        <option key={crop} value={crop}>{crop}</option>
                      ))}
                    </select>
                    {cropError && <p className="text-red-500 text-[10px] font-medium mt-1">{cropError}</p>}
                  </div>
                )}
              </div>

              <div className="bg-white p-6 rounded-xl border border-stone-100 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-primary">
                      <Maximize size={20} />
                    </div>
                    <span className="font-bold text-stone-700">Farm Size</span>
                  </div>
                  {!isEditingProfile && <span className="text-sm font-bold text-stone-400">{profileData.farmSize} {profileData.farmUnit}</span>}
                </div>
                {isEditingProfile && (
                  <div className="mt-4 flex gap-3">
                    <div className="flex-1">
                      <label className="text-[10px] uppercase font-bold text-stone-400 mb-1 block">Size</label>
                      <input 
                        type="number" 
                        value={selectedFarmSize}
                        onChange={(e) => setSelectedFarmSize(e.target.value)}
                        className="w-full p-3 bg-stone-50 rounded-lg border border-stone-100 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                        placeholder="Enter size"
                      />
                    </div>
                    <div className="w-1/3">
                      <label className="text-[10px] uppercase font-bold text-stone-400 mb-1 block">Unit</label>
                      <select 
                        value={selectedFarmUnit}
                        onChange={(e) => setSelectedFarmUnit(e.target.value)}
                        className="w-full p-3 bg-stone-50 rounded-lg border border-stone-100 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                      >
                        <option value="Acres">Acres</option>
                        <option value="Hectares">Hectares</option>
                        <option value="Bigha">Bigha</option>
                        <option value="Gunta">Gunta</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {!isEditingProfile && (
                <div className="bg-white p-6 rounded-xl border border-stone-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                        <MapPin size={20} />
                      </div>
                      <span className="font-bold text-stone-700">Agri Offices</span>
                    </div>
                    <button 
                      onClick={handleFindOffices}
                      disabled={isFindingOffices}
                      className="text-xs font-bold text-primary hover:underline disabled:opacity-50"
                    >
                      {isFindingOffices ? 'Searching...' : 'Find Nearby'}
                    </button>
                  </div>
                  
                  {isFindingOffices && (
                    <div className="flex flex-col items-center py-4">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2" />
                      <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Locating Offices...</p>
                    </div>
                  )}

                  {nearbyOffices && (
                    <div className="mt-2 p-4 bg-stone-50 rounded-xl border border-stone-100">
                      <div className="prose prose-sm prose-stone max-w-none">
                        <ReactMarkdown>{nearbyOffices}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {isEditingProfile && (
                <button 
                  onClick={async () => {
                    if (!selectedState || !selectedDistrict) {
                      setLocationError("Please select a valid location");
                      return;
                    }
                    if (!selectedCrop) {
                      setCropError("Please select a valid crop");
                      return;
                    }
                    if (!selectedName.trim()) {
                      alert("Please enter a valid name");
                      return;
                    }

                    const newProfile = {
                      uid: user?.uid,
                      name: selectedName,
                      location: `${selectedDistrict}, ${selectedState}`,
                      crops: selectedCrop,
                      farmSize: selectedFarmSize,
                      farmUnit: selectedFarmUnit,
                      updatedAt: serverTimestamp()
                    };

                    const path = `users/${user?.uid}`;
                    try {
                      if (user) {
                        await setDoc(doc(db, path), newProfile);
                      }
                      setProfileData({
                        name: selectedName,
                        location: `${selectedDistrict}, ${selectedState}`,
                        crops: selectedCrop,
                        farmSize: selectedFarmSize,
                        farmUnit: selectedFarmUnit
                      });
                      setIsEditingProfile(false);
                    } catch (error) {
                      handleFirestoreError(error, OperationType.WRITE, path);
                    }
                  }}
                  disabled={!!locationError || !!cropError || !selectedState || !selectedDistrict || !selectedCrop || !selectedFarmSize || !selectedName.trim()}
                  className="w-full py-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                >
                  <Save size={20} />
                  Save Changes
                </button>
              )}
            </div>

            <button 
              onClick={async () => {
                await signOut(auth);
                setScreen('onboarding');
              }}
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
      
      {['home', 'weather', 'market', 'profile', 'schemes', 'upload'].includes(screen) && (
        <BottomNav active={screen} onNavigate={setScreen} />
      )}
    </div>
  );
}
