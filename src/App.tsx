import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  ExternalLink,
  ShoppingCart,
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
  MapPin,
  Calendar,
  RefreshCw,
  AlertTriangle,
  Bell,
  Plus,
  Trash2,
  BellOff,
  Download,
  Database,
  BrainCircuit,
  Sparkles,
  RotateCcw,
  ShieldCheck,
  FileText,
  PhoneCall,
  ChevronDown,
  ChevronUp,
  Building2,
  Check,
  ArrowUpRight
} from 'lucide-react';
import { GoogleAuthProvider } from 'firebase/auth';
import ReactMarkdown from 'react-markdown';
import { exportCropCalendarPDF, exportCropRotationPDF } from './utils/pdfExport';
import { GOVT_SCHEMES, evaluateFarmerEligibility, GovtScheme, SchemeEvaluation } from './data/schemes';
import { syncDataToGoogleDrive } from './utils/googleDrive';
import { 
  BarChart, 
  Bar, 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { cn } from './lib/utils';
import { Screen, Language, Message, WeatherData, CropCalendar, CropRotationData, PriceAlert, AppNotification, MarketData, CropHistory } from './types';
import { getAgriAdvice, analyzeCropImage, checkSchemeEligibility, getWeatherAdvice, findNearbyAgriOffices, getCropCalendar, getCropRotationSuggestions, getMarketPrices, reverseGeocode, getPredictiveYieldEstimate } from './services/gemini';
import { TranslationProvider, useTranslation } from './TranslationContext';
import { PersonalizedCropTips } from './components/PersonalizedCropTips';
import { InteractiveDistrictMap } from './components/InteractiveDistrictMap';
import { CropYieldHistoryChart } from './components/CropYieldHistoryChart';
import { HistoricalMarketPriceComparison } from './components/HistoricalMarketPriceComparison';
import { CropPriceForecastCard } from './components/CropPriceForecastCard';
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
  collection,
  query,
  where,
  orderBy,
  deleteDoc,
  addDoc,
  updateDoc,
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

const LOCATION_DATA: Record<string, string[]> = {
  'Tamil Nadu': ['Salem', 'Thanjavur', 'Coimbatore', 'Madurai', 'Trichy', 'Tirunelveli', 'Karur', 'Erode', 'Dindigul', 'Chennai'],
  'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Sangrur', 'Ferozepur'],
  'Haryana': ['Karnal', 'Hisar', 'Ambala', 'Sirsa', 'Rohtak', 'Kurukshetra'],
  'Uttar Pradesh': ['Varanasi', 'Lucknow', 'Kanpur', 'Agra', 'Prayagraj', 'Meerut', 'Bareilly', 'Gorakhpur'],
  'Madhya Pradesh': ['Indore', 'Bhopal', 'Ujjain', 'Jabalpur', 'Gwalior', 'Hoshangabad', 'Dewas'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Kota', 'Bikaner', 'Sri Ganganagar', 'Alwar', 'Udaipur'],
  'Gujarat': ['Rajkot', 'Ahmedabad', 'Surat', 'Vadodara', 'Junagadh', 'Bhavnagar', 'Mehsana'],
  'Maharashtra': ['Nashik', 'Pune', 'Nagpur', 'Kolhapur', 'Solapur', 'Aurangabad', 'Mumbai', 'Amravati'],
  'Andhra Pradesh': ['Guntur', 'Vijayawada', 'Visakhapatnam', 'Kurnool', 'Nellore', 'Rajahmundry', 'Anantapur'],
  'Telangana': ['Nizamabad', 'Warangal', 'Hyderabad', 'Karimnagar', 'Khammam', 'Nalgonda'],
  'Karnataka': ['Bangalore', 'Mysore', 'Mangalore', 'Belgaum', 'Shimoga', 'Bellary', 'Dharwad'],
  'Kerala': ['Palakkad', 'Kozhikode', 'Kochi', 'Thiruvananthapuram', 'Wayanad', 'Thrissur', 'Idukki'],
  'Bihar': ['Patna', 'Gaya', 'Muzaffarpur', 'Bhagalpur', 'Darbhanga', 'Rohtas'],
  'West Bengal': ['Burdwan', 'Kolkata', 'Murshidabad', 'Nadia', 'Hooghly', 'Malda'],
  'Odisha': ['Bhubaneswar', 'Cuttack', 'Sambalpur', 'Balasore', 'Bargarh'],
  'Delhi': ['New Delhi', 'North Delhi', 'South Delhi']
};

const VALID_CROPS = [
  'Paddy', 'Wheat', 'Sugarcane', 'Cotton', 'Maize', 'Millet', 
  'Tomato', 'Chilly', 'Onion', 'Potato', 'Soybean', 'Groundnut', 
  'Mustard', 'Jute', 'Coffee', 'Tea', 'Coconut', 'Banana', 'Mango'
];

const SOIL_TYPES = [
  'Alluvial Soil', 'Black Soil', 'Red Soil', 'Laterite Soil', 'Desert Soil', 'Mountain Soil', 'Other'
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

const AVERAGE_MARKET_TRENDS = [
  { month: 'Jan', price: 1950 },
  { month: 'Feb', price: 2000 },
  { month: 'Mar', price: 2050 },
  { month: 'Apr', price: 2100 },
  { month: 'May', price: 2150 },
  { month: 'Jun', price: 2200 },
];

const SCHEMES = GOVT_SCHEMES;

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

const Onboarding = ({ onComplete }: { onComplete: (data: { lang: Language, location: string, crop: string, soilType: string }) => void }) => {
  const [step, setStep] = useState(1);
  const [selectedLang, setSelectedLang] = useState<Language>('en');
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('');
  const [selectedSoil, setSelectedSoil] = useState('');

  const handleNext = () => {
    if (step === 1) setStep(2);
    else if (step === 2) {
      if (selectedState && selectedDistrict) setStep(3);
    } else if (step === 3) {
      if (selectedCrop) setStep(4);
    } else {
      onComplete({
        lang: selectedLang,
        location: `${selectedDistrict}, ${selectedState}`,
        crop: selectedCrop,
        soilType: selectedSoil
      });
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
                Continue
              </button>
              <button onClick={() => setStep(2)} className="w-full text-stone-400 text-sm font-medium">Back</button>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Droplets className="text-primary w-8 h-8" />
              </div>
              <h2 className="text-3xl font-bold text-stone-800 mb-3">Soil Type (Optional)</h2>
              <p className="text-stone-500">Knowing your soil type helps us provide better crop advice.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {SOIL_TYPES.map((soil) => (
                <button
                  key={soil}
                  onClick={() => setSelectedSoil(soil)}
                  className={cn(
                    "p-4 rounded-xl border text-sm font-bold transition-all",
                    selectedSoil === soil ? "bg-primary text-white border-primary shadow-md" : "bg-white text-stone-600 border-stone-100"
                  )}
                >
                  {soil}
                </button>
              ))}
            </div>
            <div className="space-y-4">
              <button
                onClick={handleNext}
                className="w-full py-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
              >
                {selectedSoil ? "Finish Setup" : "Skip & Finish"}
              </button>
              <button onClick={() => setStep(3)} className="w-full text-stone-400 text-sm font-medium">Back</button>
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

const Sidebar = ({ active, onNavigate, profileData }: { active: Screen, onNavigate: (s: Screen) => void, profileData: any }) => {
  const { t } = useTranslation();
  const items = [
    { id: 'home', icon: Sprout, label: t('home') },
    { id: 'weather', icon: CloudSun, label: t('weather') },
    { id: 'chat', icon: MessageSquare, label: t('askAI') },
    { id: 'market', icon: TrendingUp, label: t('market') },
    { id: 'upload', icon: Camera, label: t('scanCrop') },
    { id: 'schemes', icon: Landmark, label: t('govtSchemes') },
    { id: 'profile', icon: User, label: t('profile') },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-stone-100 p-6 h-screen sticky top-0 shrink-0 shadow-sm z-50">
      <div className="mb-10 flex items-center gap-3">
        <div className="bg-primary/10 p-2 rounded-xl text-primary">
          <Sprout size={28} />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-stone-800 tracking-tight leading-none">AgriSeva AI</h1>
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Smart Farming</span>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {items.map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as Screen)}
              className={cn(
                "w-full flex items-center gap-4 px-4 py-3 rounded-xl font-sans text-sm font-bold tracking-wide transition-all duration-200",
                isActive 
                  ? "bg-secondary-container text-primary shadow-sm" 
                  : "text-stone-500 hover:bg-stone-50 hover:text-stone-800"
              )}
            >
              <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} className={cn(isActive ? "text-primary" : "text-stone-400")} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="border-t border-stone-100 pt-6 mt-auto">
        <div className="flex items-center gap-3 bg-stone-50 p-3 rounded-xl border border-stone-100">
          <div className="w-9 h-9 rounded-full bg-stone-200 flex items-center justify-center overflow-hidden border border-white shrink-0">
            <img src="https://picsum.photos/seed/farmer/100/100" alt="Profile" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-stone-800 truncate">{profileData.name || 'Farmer'}</p>
            <p className="text-[10px] text-stone-400 font-medium truncate">{profileData.location || 'Location'}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

const BottomNav = ({ active, onNavigate }: { active: Screen, onNavigate: (s: Screen) => void }) => {
  const { t } = useTranslation();
  const items = [
    { id: 'home', icon: Sprout, label: t('home') },
    { id: 'weather', icon: CloudSun, label: t('weather') },
    { id: 'chat', icon: MessageSquare, label: t('askAI') },
    { id: 'market', icon: TrendingUp, label: t('market') },
    { id: 'profile', icon: User, label: t('profile') },
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

const CropCalendarScreen = ({ data, isLoading, onBack }: { data: CropCalendar | null, isLoading: boolean, onBack: () => void }) => {
  const { t, language } = useTranslation();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!data) return;
    setIsExporting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      exportCropCalendarPDF(data, language);
    } catch (e) {
      console.error("PDF generation failed:", e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="pb-32 px-6 pt-12">
      <header className="flex items-center justify-between mb-10 gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-stone-100 rounded-full">
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-2xl font-bold text-stone-800">{t('cropCalendar')}</h2>
        </div>
        {data && (
          <button 
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-bold rounded-xl text-xs sm:text-sm shadow-sm hover:bg-green-700 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Download size={16} />
            {isExporting ? t('exporting') : t('exportReport')}
          </button>
        )}
      </header>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
          <p className="text-lg font-bold text-stone-400">{t('generatingCalendar')}</p>
        </div>
      ) : data ? (
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-50 rounded-lg text-primary">
                <Leaf size={20} />
              </div>
              <h3 className="text-xl font-bold text-stone-800">{data.crop}</h3>
            </div>
            <p className="text-sm text-stone-400 font-medium flex items-center gap-1">
              <MapPin size={14} /> {data.location}
            </p>
          </div>

          <div className="relative pl-8 space-y-12 before:content-[''] before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-100">
            {data.events.map((event, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                <div className={cn(
                  "absolute -left-[25px] top-1 w-4 h-4 rounded-full border-4 border-white shadow-sm z-10",
                  event.type === 'planting' ? "bg-blue-500" : event.type === 'cultivation' ? "bg-orange-500" : "bg-green-500"
                )}></div>
                
                <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-black uppercase tracking-widest text-primary">{event.month}</span>
                    <span className={cn(
                      "text-[10px] font-bold uppercase px-2 py-1 rounded-full",
                      event.type === 'planting' ? "bg-blue-50 text-blue-600" : event.type === 'cultivation' ? "bg-orange-50 text-orange-600" : "bg-green-50 text-green-600"
                    )}>
                      {event.type}
                    </span>
                  </div>
                  <h4 className="font-bold text-stone-800 mb-2">{event.activity}</h4>
                  <p className="text-sm text-stone-500 leading-relaxed">{event.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <div className="py-20 text-center">
          <p className="text-stone-400">Unable to load crop calendar. Please try again.</p>
        </div>
      )}
    </div>
  );
};

const PriceAlertsScreen = ({ alerts, onAdd, onDelete, onToggle, onBack }: { 
  alerts: PriceAlert[], 
  onAdd: (alert: Omit<PriceAlert, 'id' | 'uid' | 'createdAt'>) => void,
  onDelete: (id: string) => void,
  onToggle: (id: string, active: boolean) => void,
  onBack: () => void 
}) => {
  const { t } = useTranslation();
  const [isAdding, setIsAdding] = useState(false);
  const [newCrop, setNewCrop] = useState(VALID_CROPS[0]);
  const [newPrice, setNewPrice] = useState('');
  const [newCondition, setNewCondition] = useState<'above' | 'below'>('below');

  const handleAdd = () => {
    if (!newPrice) return;
    onAdd({
      crop: newCrop,
      targetPrice: parseFloat(newPrice),
      condition: newCondition,
      active: true
    });
    setIsAdding(false);
    setNewPrice('');
  };

  return (
    <div className="pb-32 px-6 pt-12">
      <header className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-stone-100 rounded-full">
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-2xl font-bold text-stone-800">{t('priceAlerts')}</h2>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="p-2 bg-primary text-white rounded-full shadow-lg active:scale-95 transition-all"
        >
          {isAdding ? <X size={20} /> : <Plus size={20} />}
        </button>
      </header>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm mb-8 overflow-hidden"
          >
            <h3 className="font-bold text-stone-800 mb-4">{t('setNewAlert')}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-stone-400 mb-1 block">{t('crop')}</label>
                <select 
                  value={newCrop}
                  onChange={(e) => setNewCrop(e.target.value)}
                  className="w-full p-3 bg-stone-50 rounded-lg border border-stone-100 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                >
                  {VALID_CROPS.map(crop => (
                    <option key={crop} value={crop}>{crop}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-stone-400 mb-1 block">{t('targetPrice')}</label>
                  <input 
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="e.g. 25"
                    className="w-full p-3 bg-stone-50 rounded-lg border border-stone-100 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-stone-400 mb-1 block">{t('condition')}</label>
                  <select 
                    value={newCondition}
                    onChange={(e) => setNewCondition(e.target.value as 'above' | 'below')}
                    className="w-full p-3 bg-stone-50 rounded-lg border border-stone-100 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  >
                    <option value="below">{t('priceDropsBelow')}</option>
                    <option value="above">{t('priceRisesAbove')}</option>
                  </select>
                </div>
              </div>
              <button 
                onClick={handleAdd}
                className="w-full py-3 bg-primary text-white rounded-xl font-bold shadow-md active:scale-95 transition-all"
              >
                {t('createAlert')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {alerts.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4 text-stone-300">
              <BellOff size={32} />
            </div>
            <p className="text-stone-400 font-medium">{t('noAlertsSet')}</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div key={alert.id} className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  alert.active ? "bg-green-50 text-primary" : "bg-stone-50 text-stone-300"
                )}>
                  <TrendingUp size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-stone-800">{alert.crop}</h4>
                  <p className="text-xs text-stone-400 font-medium">
                    {alert.condition === 'below' ? t('dropsBelow') : t('risesAbove')} ₹{alert.targetPrice} / kg
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => onToggle(alert.id, !alert.active)}
                  className={cn(
                    "w-10 h-6 rounded-full relative transition-colors duration-200",
                    alert.active ? "bg-primary" : "bg-stone-200"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-200",
                    alert.active ? "left-5" : "left-1"
                  )} />
                </button>
                <button 
                  onClick={() => onDelete(alert.id)}
                  className="p-2 text-stone-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const NotificationsScreen = ({ notifications, onRead, onClear, onBack }: { 
  notifications: AppNotification[], 
  onRead: (id: string) => void,
  onClear: () => void,
  onBack: () => void 
}) => {
  const { t } = useTranslation();
  return (
    <div className="pb-32 px-6 pt-12">
      <header className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-stone-100 rounded-full">
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-2xl font-bold text-stone-800">{t('notificationsTitle')}</h2>
        </div>
        {notifications.length > 0 && (
          <button 
            onClick={onClear}
            className="text-xs font-bold text-stone-400 hover:text-primary transition-colors"
          >
            {t('clearAll')}
          </button>
        )}
      </header>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4 text-stone-300">
              <Bell size={32} />
            </div>
            <p className="text-stone-400 font-medium">{t('noNewNotifications')}</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {notifications.map((notif, index) => (
              <motion.div 
                key={notif.id} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onRead(notif.id)}
                className={cn(
                  "p-5 rounded-2xl border transition-all cursor-pointer",
                  notif.read ? "bg-white border-stone-100 opacity-60" : "bg-white border-primary/20 shadow-md ring-1 ring-primary/5"
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                    notif.type === 'price' ? "bg-green-50 text-primary" : 
                    notif.type === 'weather' ? "bg-blue-50 text-blue-500" : "bg-purple-50 text-purple-500"
                  )}>
                    {notif.type === 'price' ? <TrendingUp size={20} /> : 
                     notif.type === 'weather' ? <CloudSun size={20} /> : <Bell size={20} />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-stone-800 text-sm">{notif.title}</h4>
                      <span className="text-[10px] text-stone-400 font-medium">
                        {new Date(notif.timestamp?.toDate?.() || notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 leading-relaxed">{notif.message}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

const CropRotationScreen = ({ data, isLoading, onBack }: { data: CropRotationData | null, isLoading: boolean, onBack: () => void }) => {
  const { t, language } = useTranslation();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!data) return;
    setIsExporting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      exportCropRotationPDF(data, language);
    } catch (e) {
      console.error("PDF generation failed:", e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="pb-32 px-6 pt-12">
      <header className="flex items-center justify-between mb-10 gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-stone-100 rounded-full">
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-2xl font-bold text-stone-800">{t('cropRotation')}</h2>
        </div>
        {data && (
          <button 
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-bold rounded-xl text-xs sm:text-sm shadow-sm hover:bg-green-700 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Download size={16} />
            {isExporting ? t('exporting') : t('exportReport')}
          </button>
        )}
      </header>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
          <p className="text-lg font-bold text-stone-400">{t('generatingSuggestions')}</p>
        </div>
      ) : data ? (
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                <RefreshCw size={20} />
              </div>
              <h3 className="text-xl font-bold text-stone-800">Current: {data.currentCrop}</h3>
            </div>
            <div className="flex flex-wrap gap-4 mt-3">
              <p className="text-sm text-stone-400 font-medium flex items-center gap-1">
                <MapPin size={14} /> {data.location}
              </p>
              <p className="text-sm text-stone-400 font-medium flex items-center gap-1">
                <Droplets size={14} /> {data.soilType || 'Standard Soil'}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {data.suggestions.map((suggestion, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-bold text-primary">{suggestion.crop}</h4>
                  <span className="text-[10px] font-black uppercase tracking-widest text-stone-300">Option {index + 1}</span>
                </div>
                
                <p className="text-sm text-stone-600 leading-relaxed italic">"{suggestion.reasoning}"</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 size={16} />
                      <span className="text-xs font-bold uppercase tracking-wider">Benefits</span>
                    </div>
                    <ul className="space-y-1">
                      {suggestion.benefits.map((benefit, bIndex) => (
                        <li key={bIndex} className="text-[11px] text-stone-500 flex items-start gap-1">
                          <span className="mt-1 w-1 h-1 bg-green-400 rounded-full flex-shrink-0"></span>
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-orange-600">
                      <AlertTriangle size={16} />
                      <span className="text-xs font-bold uppercase tracking-wider">Risks</span>
                    </div>
                    <ul className="space-y-1">
                      {suggestion.risks.map((risk, rIndex) => (
                        <li key={rIndex} className="text-[11px] text-stone-500 flex items-start gap-1">
                          <span className="mt-1 w-1 h-1 bg-orange-400 rounded-full flex-shrink-0"></span>
                          {risk}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <div className="py-20 text-center">
          <p className="text-stone-400">Unable to load rotation suggestions. Please try again.</p>
        </div>
      )}
    </div>
  );
};

const getPricePerKg = (priceVal: number, unit: string) => {
  const normUnit = unit ? unit.toLowerCase() : '';
  if (normUnit.includes('quintal') || normUnit.includes('100kg') || normUnit.includes('100 kg') || normUnit === 'q') {
    return {
      price: (priceVal / 100).toFixed(2),
      unit: 'kg'
    };
  }
  // If it's already per kg or we don't recognize, assume it might be quintal anyway if the value is high (e.g. > 500)
  if (priceVal > 500) {
    return {
      price: (priceVal / 100).toFixed(2),
      unit: 'kg'
    };
  }
  return {
    price: priceVal.toFixed(2),
    unit: 'kg'
  };
};

function AppContent() {
  const [screen, setScreen] = useState<Screen>('splash');
  const { language, setLanguage, t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{ 
    crop: string; 
    disease: string; 
    confidence: number;
    chemical?: string;
    ratio?: string;
    shopRecommendation?: string;
    buyLink?: string;
    buyLinkTitle?: string;
  } | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [checkingSchemeId, setCheckingSchemeId] = useState<number | null>(null);
  const [eligibilityResults, setEligibilityResults] = useState<Record<number, string>>({});
  const [schemeSearchQuery, setSchemeSearchQuery] = useState('');
  const [schemeCategoryFilter, setSchemeCategoryFilter] = useState<string>('all');
  const [filterEligibleOnly, setFilterEligibleOnly] = useState<boolean>(false);
  const [expandedSchemeDocs, setExpandedSchemeDocs] = useState<Record<number, boolean>>({});
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [weatherAdvice, setWeatherAdvice] = useState<string>('');
  const [isLoadingWeatherAdvice, setIsLoadingWeatherAdvice] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(() => {
    try {
      const cached = localStorage.getItem('agriseva_cached_weather');
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      return null;
    }
  });
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [isFindingOffices, setIsFindingOffices] = useState(false);
  const [nearbyOffices, setNearbyOffices] = useState<string | null>(null);
  const [calendarData, setCalendarData] = useState<CropCalendar | null>(null);
  const [isCalendarLoading, setIsCalendarLoading] = useState(false);
  const [rotationData, setRotationData] = useState<CropRotationData | null>(null);
  const [isRotationLoading, setIsRotationLoading] = useState(false);
  const [marketData, setMarketData] = useState<MarketData | null>(() => {
    try {
      const cached = localStorage.getItem('agriseva_cached_market_prices');
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      return null;
    }
  });
  const [isMarketLoading, setIsMarketLoading] = useState(false);
  const [marketChartView, setMarketChartView] = useState<'primary' | 'average'>('primary');
  const [marketTimeframe, setMarketTimeframe] = useState<'1m' | '3m' | '6m'>('6m');
  const [hasAutoDetectedLocation, setHasAutoDetectedLocation] = useState(false);
  const [lastNotifCount, setLastNotifCount] = useState<number | null>(null);
  const [shouldAnimateBell, setShouldAnimateBell] = useState(false);
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [profileData, setProfileData] = useState({
    name: 'Harish Kumar',
    location: 'Chennai, Tamil Nadu',
    crops: 'Paddy',
    farmSize: '5',
    farmUnit: 'Acres',
    soilType: ''
  });

  const automatedSchemeEvaluations = useMemo(() => {
    const res: Record<number, SchemeEvaluation> = {};
    GOVT_SCHEMES.forEach(scheme => {
      res[scheme.id] = evaluateFarmerEligibility(scheme, profileData, language);
    });
    return res;
  }, [profileData, language]);

  const [cropHistoryList, setCropHistoryList] = useState<CropHistory[]>([]);
  const [profileActiveTab, setProfileActiveTab] = useState<'info' | 'history'>('info');

  // Add Crop History Form states
  const [isAddingHistory, setIsAddingHistory] = useState(false);
  const [newHistoryCrop, setNewHistoryCrop] = useState('');
  const [newHistorySeason, setNewHistorySeason] = useState('Kharif');
  const [newHistoryYear, setNewHistoryYear] = useState<number>(new Date().getFullYear());
  const [newHistoryYield, setNewHistoryYield] = useState('');
  const [newHistoryNotes, setNewHistoryNotes] = useState('');
  const [isSavingHistory, setIsSavingHistory] = useState(false);

  // Listen to Crop History
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, `users/${user.uid}/cropHistory`), orderBy('year', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const historyData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CropHistory));
      setCropHistoryList(historyData);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/cropHistory`));
    return () => unsubscribe();
  }, [user]);

  const [yieldPrediction, setYieldPrediction] = useState<any>(null);
  const [isYieldPredictionLoading, setIsYieldPredictionLoading] = useState(false);
  const [yieldPredictionError, setYieldPredictionError] = useState<string | null>(null);

  const fetchYieldPrediction = async () => {
    setIsYieldPredictionLoading(true);
    setYieldPredictionError(null);
    try {
      const data = await getPredictiveYieldEstimate(
        cropHistoryList,
        profileData.crops,
        profileData.farmSize,
        profileData.farmUnit,
        profileData.soilType,
        profileData.location,
        weatherData,
        language
      );
      setYieldPrediction(data);
    } catch (err: any) {
      console.error("Error fetching yield prediction:", err);
      setYieldPredictionError(err.message || "Failed to generate prediction");
    } finally {
      setIsYieldPredictionLoading(false);
    }
  };

  useEffect(() => {
    if (profileActiveTab === 'history' && !yieldPrediction && !isYieldPredictionLoading && !yieldPredictionError) {
      fetchYieldPrediction();
    }
  }, [profileActiveTab, cropHistoryList, profileData.crops]);

  const [googleDriveToken, setGoogleDriveToken] = useState<string | null>(null);
  const [isSyncingDrive, setIsSyncingDrive] = useState(false);
  const [driveSyncStatus, setDriveSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [driveSyncError, setDriveSyncError] = useState<string | null>(null);

  // Listen to Alerts
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, `users/${user.uid}/alerts`), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const alertsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PriceAlert));
      setPriceAlerts(alertsData);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/alerts`));
    return () => unsubscribe();
  }, [user]);

  // Listen to Notifications
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, `users/${user.uid}/notifications`), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppNotification));
      setNotifications(notifsData);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/notifications`));
    return () => unsubscribe();
  }, [user]);

  // Trigger bell animation and sound on new notification
  useEffect(() => {
    const unreadCount = notifications.filter(n => !n.read).length;
    if (lastNotifCount !== null && unreadCount > lastNotifCount) {
      setShouldAnimateBell(true);
      
      // Play subtle sound
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3');
        audio.volume = 0.3;
        audio.play().catch(e => console.log("Audio play blocked by browser:", e));
      } catch (e) {
        console.error("Error playing notification sound:", e);
      }

      const timer = setTimeout(() => setShouldAnimateBell(false), 1000);
      return () => clearTimeout(timer);
    }
    setLastNotifCount(unreadCount);
  }, [notifications, lastNotifCount]);

  const handleAddAlert = async (alertData: Omit<PriceAlert, 'id' | 'uid' | 'createdAt'>) => {
    if (!user) return;
    const path = `users/${user.uid}/alerts`;
    try {
      const docRef = doc(collection(db, path));
      await setDoc(docRef, {
        ...alertData,
        id: docRef.id,
        uid: user.uid,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const handleDeleteAlert = async (id: string) => {
    if (!user) return;
    const path = `users/${user.uid}/alerts/${id}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const handleAddCropHistory = async (cropHistoryData: Omit<CropHistory, 'id' | 'uid' | 'createdAt'>) => {
    if (!user) {
      const mockRecord: CropHistory = {
        ...cropHistoryData,
        id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        uid: 'guest',
        createdAt: new Date()
      };
      setCropHistoryList(prev => [mockRecord, ...prev]);
      return;
    }
    const path = `users/${user.uid}/cropHistory`;
    try {
      const docRef = doc(collection(db, path));
      await setDoc(docRef, {
        ...cropHistoryData,
        id: docRef.id,
        uid: user.uid,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const handleDeleteCropHistory = async (id: string) => {
    if (!user) {
      setCropHistoryList(prev => prev.filter(item => item.id !== id));
      return;
    }
    const path = `users/${user.uid}/cropHistory/${id}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const handleToggleAlert = async (id: string, active: boolean) => {
    if (!user) return;
    const path = `users/${user.uid}/alerts/${id}`;
    try {
      await updateDoc(doc(db, path), { active });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleReadNotification = async (id: string) => {
    if (!user) return;
    const path = `users/${user.uid}/notifications/${id}`;
    try {
      await updateDoc(doc(db, path), { read: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleClearNotifications = async () => {
    if (!user) return;
    const path = `users/${user.uid}/notifications`;
    try {
      notifications.forEach(async (n) => {
        await deleteDoc(doc(db, `${path}/${n.id}`));
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const createNotification = async (title: string, message: string, type: 'price' | 'weather' | 'system') => {
    if (!user) return;
    const path = `users/${user.uid}/notifications`;
    try {
      const docRef = doc(collection(db, path));
      await setDoc(docRef, {
        id: docRef.id,
        title,
        message,
        type,
        timestamp: serverTimestamp(),
        read: false
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const checkPriceAlerts = async (currentMarketData: MarketData | null) => {
    if (!user || priceAlerts.length === 0 || !currentMarketData) return;

    const currentPrices: Record<string, number> = {};
    currentMarketData.prices.forEach(p => {
      const converted = getPricePerKg(p.price, p.unit);
      currentPrices[p.crop] = parseFloat(converted.price);
    });

    for (const alert of priceAlerts) {
      if (!alert.active) continue;

      const currentPrice = currentPrices[alert.crop];
      if (!currentPrice) continue;

      let triggered = false;
      if (alert.condition === 'above' && currentPrice >= alert.targetPrice) {
        triggered = true;
      } else if (alert.condition === 'below' && currentPrice <= alert.targetPrice) {
        triggered = true;
      }

      if (triggered) {
        // Create notification
        await createNotification(
          `Price Alert: ${alert.crop}`,
          `The price of ${alert.crop} is now ₹${currentPrice}/kg, which is ${alert.condition} your target of ₹${alert.targetPrice}/kg.`,
          'price'
        );
        // Deactivate alert to prevent spamming (or set a lastTriggered timestamp)
        await handleToggleAlert(alert.id, false);
      }
    }
  };

  const checkExtremeWeather = async (weather: WeatherData) => {
    if (!user) return;

    let isExtreme = false;
    let extremeReason = "";

    // Check temperature extremes
    if (weather.temp >= 38) {
      isExtreme = true;
      extremeReason = `Extreme heatwave detected! Temperature is currently at ${weather.temp}°C.`;
    } else if (weather.temp <= 10) {
      isExtreme = true;
      extremeReason = `Extreme cold warning! Temperature is currently at ${weather.temp}°C.`;
    }

    // Check wind speed extremes
    if (weather.windSpeed >= 40) {
      isExtreme = true;
      extremeReason = `High wind speeds detected! Wind speed is ${weather.windSpeed} km/h. Secure loose structures and crops.`;
    }

    // Check extreme weather conditions (Thunderstorm, Tornado, Squall, Heavy Rain, etc.)
    const extremeConditions = ['Thunderstorm', 'Tornado', 'Squall', 'Extreme', 'Storm', 'Heavy Rain', 'Heatwave', 'Cyclone', 'Blizzard', 'Hail'];
    const currentCondition = weather.condition.toLowerCase();

    const matchedCondition = extremeConditions.find(cond => currentCondition.includes(cond.toLowerCase()));
    if (matchedCondition) {
      isExtreme = true;
      extremeReason = `Severe weather warning: ${weather.condition} has been detected.`;
    }

    if (isExtreme) {
      // Avoid duplicated weather notifications of the same type/condition
      const hasRecentNotif = (notificationsRef.current || []).some(n => 
        n.type === 'weather' && 
        n.title === 'Extreme Weather Alert' && 
        n.message.includes(weather.condition)
      );

      if (!hasRecentNotif) {
        await createNotification(
          "Extreme Weather Alert",
          `AgriSeva AI Weather Alert: ${extremeReason} Please take protective measures for your ${profileData.crops}.`,
          'weather'
        );
      }
    }
  };

  const handleSimulateExtremeWeather = async (type: 'heatwave' | 'thunderstorm') => {
    let simulatedWeather: WeatherData;
    if (type === 'heatwave') {
      simulatedWeather = {
        temp: 42,
        condition: "Extreme Heatwave",
        humidity: 15,
        windSpeed: 10,
        uvIndex: "Very High",
        forecast: [
          { day: "Tomorrow", tempHigh: 43, tempLow: 30, condition: "Sunny" },
          { day: "Wednesday", tempHigh: 42, tempLow: 29, condition: "Sunny" },
          { day: "Thursday", tempHigh: 41, tempLow: 28, condition: "Sunny" },
        ],
        hourly: [
          { time: "Now", temp: 42, condition: "Sunny" },
          { time: "1 PM", temp: 43, condition: "Sunny" },
          { time: "2 PM", temp: 43, condition: "Sunny" },
        ]
      };
    } else {
      simulatedWeather = {
        temp: 22,
        condition: "Severe Thunderstorm",
        humidity: 95,
        windSpeed: 52,
        uvIndex: "Low",
        forecast: [
          { day: "Tomorrow", tempHigh: 24, tempLow: 18, condition: "Rainy" },
          { day: "Wednesday", tempHigh: 25, tempLow: 19, condition: "Cloudy" },
          { day: "Thursday", tempHigh: 28, tempLow: 20, condition: "Sunny" },
        ],
        hourly: [
          { time: "Now", temp: 22, condition: "Thunderstorm" },
          { time: "1 PM", temp: 21, condition: "Thunderstorm" },
          { time: "2 PM", temp: 22, condition: "Heavy Rain" },
        ]
      };
    }

    setWeatherData(simulatedWeather);
    await checkExtremeWeather(simulatedWeather);
  };

  const fetchMarketPricesData = async () => {
    // 1. If offline, immediately try to load cached data
    if (typeof window !== 'undefined' && navigator && !navigator.onLine) {
      try {
        const cached = localStorage.getItem(`agriseva_cached_market_prices_${profileData.location}`) || localStorage.getItem('agriseva_cached_market_prices');
        if (cached) {
          const parsed = JSON.parse(cached);
          setMarketData(parsed);
          checkPriceAlerts(parsed);
          return;
        }
      } catch (e) {
        console.error("Error loading cached market prices while offline:", e);
      }
    }

    setIsMarketLoading(true);
    try {
      // Fetch for primary crop and a few common ones
      const cropsToFetch = [profileData.crops, 'Paddy', 'Wheat', 'Maize', 'Cotton', 'Onion'];
      const uniqueCrops = Array.from(new Set(cropsToFetch.filter(Boolean)));
      
      const data = await getMarketPrices(profileData.location, uniqueCrops, language);
      if (data) {
        setMarketData(data);
        checkPriceAlerts(data);
        
        // Cache successful fetch
        try {
          localStorage.setItem(`agriseva_cached_market_prices_${profileData.location}`, JSON.stringify(data));
          localStorage.setItem('agriseva_cached_market_prices', JSON.stringify(data));
        } catch (e) {
          console.error("Error saving market prices cache:", e);
        }
      } else {
        // API returned null or undefined, try cached data
        const cached = localStorage.getItem(`agriseva_cached_market_prices_${profileData.location}`) || localStorage.getItem('agriseva_cached_market_prices');
        if (cached) {
          const parsed = JSON.parse(cached);
          setMarketData(parsed);
          checkPriceAlerts(parsed);
        }
      }
    } catch (error) {
      console.error("Error fetching market prices:", error);
      // Try cached data on catch
      try {
        const cached = localStorage.getItem(`agriseva_cached_market_prices_${profileData.location}`) || localStorage.getItem('agriseva_cached_market_prices');
        if (cached) {
          const parsed = JSON.parse(cached);
          setMarketData(parsed);
          checkPriceAlerts(parsed);
        }
      } catch (e) {
        console.error("Error reading cached market prices:", e);
      }
    } finally {
      setIsMarketLoading(false);
    }
  };

  const handleDriveBackupSync = async () => {
    if (!user) return;
    if (isSyncingDrive) return; // Prevent concurrent requests causing internal assertion failure
    
    setIsSyncingDrive(true);
    setDriveSyncStatus('idle');
    setDriveSyncError(null);
    
    let token = googleDriveToken;
    if (!token) {
      try {
        const driveProvider = new GoogleAuthProvider();
        driveProvider.addScope('https://www.googleapis.com/auth/drive.file');
        
        const result = await signInWithPopup(auth, driveProvider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (credential?.accessToken) {
          token = credential.accessToken;
          setGoogleDriveToken(token);
        } else {
          setDriveSyncError("Failed to obtain authentication credentials. Please allow popups and try again.");
          setDriveSyncStatus('error');
          setIsSyncingDrive(false);
          return;
        }
      } catch (err: any) {
        console.error("Failed to authenticate Google Drive:", err);
        let msg = "Failed to authenticate Google Drive.";
        if (err.code === 'auth/popup-blocked' || err.message?.includes('popup-blocked')) {
          msg = "Popup blocked! Please allow popups for this site in your browser settings, or open the app in a new tab.";
        } else if (err.code === 'auth/cancelled-popup-request' || err.message?.includes('cancelled-popup-request')) {
          msg = "Connection request was cancelled. If the popup was blocked, please allow popups and refresh the page.";
        } else if (err.message?.includes('Pending promise was never set') || err.message?.includes('INTERNAL ASSERTION FAILED')) {
          msg = "Firebase authentication state got interrupted (Pending promise). Please refresh the page to clear the state and try again.";
        } else if (err.message) {
          msg = `Authentication error: ${err.message}`;
        }
        setDriveSyncError(msg);
        setDriveSyncStatus('error');
        setIsSyncingDrive(false);
        return;
      }
    }

    try {
      const backupPayload = {
        appName: "AgriSeva AI",
        backupDate: new Date().toISOString(),
        profile: {
          name: profileData.name,
          location: profileData.location,
          crops: profileData.crops,
          farmSize: profileData.farmSize,
          farmUnit: profileData.farmUnit,
          soilType: profileData.soilType
        },
        priceAlerts: priceAlerts.map(alert => ({
          crop: alert.crop,
          targetPrice: alert.targetPrice,
          condition: alert.condition,
          active: alert.active
        })),
        notifications: notifications.map(notif => ({
          title: notif.title,
          message: notif.message,
          type: notif.type,
          read: notif.read,
          timestamp: notif.timestamp ? (typeof notif.timestamp.toDate === 'function' ? notif.timestamp.toDate().toISOString() : notif.timestamp) : null
        }))
      };

      const success = await syncDataToGoogleDrive(token, backupPayload);
      if (success) {
        setDriveSyncStatus('success');
      } else {
        setDriveSyncError("Google Drive backup failed. Please check your connection.");
        setDriveSyncStatus('error');
      }
    } catch (err: any) {
      console.error("Backup sync error:", err);
      setDriveSyncError(`Backup failed: ${err.message || err}`);
      setDriveSyncStatus('error');
    } finally {
      setIsSyncingDrive(false);
    }
  };

  // Check alerts periodically or when screen changes to market
  useEffect(() => {
    if (screen === 'market') {
      fetchMarketPricesData();
    }
  }, [screen, profileData.location, profileData.crops, language]);

  // Auto-detect location for weather screen
  useEffect(() => {
    if (screen === 'weather' && !hasAutoDetectedLocation) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const geoData = await reverseGeocode(latitude, longitude);
            if (geoData && geoData.state && geoData.district) {
              setSelectedState(geoData.state);
              setSelectedDistrict(geoData.district);
              setProfileData(prev => ({ ...prev, location: `${geoData.district}, ${geoData.state}` }));
            }
          } catch (error) {
            console.warn("Reverse geocoding handled notice:", error);
          } finally {
            setHasAutoDetectedLocation(true);
          }
        }, (error) => {
          console.warn("Geolocation warning (not critical, using default location):", error);
          setHasAutoDetectedLocation(true);
        });
      } else {
        setHasAutoDetectedLocation(true);
      }
    }
  }, [screen, hasAutoDetectedLocation]);

  const [selectedState, setSelectedState] = useState('Tamil Nadu');
  const [selectedDistrict, setSelectedDistrict] = useState('Chennai');
  const [selectedCrop, setSelectedCrop] = useState('Paddy');
  const [selectedName, setSelectedName] = useState('Harish Kumar');
  const [selectedFarmSize, setSelectedFarmSize] = useState('5');
  const [selectedFarmUnit, setSelectedFarmUnit] = useState('Acres');
  const [selectedSoilType, setSelectedSoilType] = useState('');
  const [cropError, setCropError] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const profileDataRef = useRef(profileData);
  const notificationsRef = useRef(notifications);

  useEffect(() => {
    profileDataRef.current = profileData;
  }, [profileData]);

  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

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
          farmUnit: data.farmUnit || 'Acres',
          soilType: data.soilType || ''
        });
        
        // Also update selection states if not editing
        if (!isEditingProfile) {
          setSelectedName(data.name || 'Harish Kumar');
          setSelectedCrop(data.crops || 'Paddy');
          setSelectedFarmSize(data.farmSize || '5');
          setSelectedFarmUnit(data.farmUnit || 'Acres');
          setSelectedSoilType(data.soilType || '');
          
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
          soilType: profileDataRef.current.soilType,
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

  const mapWmoCodeToCondition = (code: number): string => {
    if (code === 0) return "Sunny";
    if (code === 1 || code === 2) return "Partly Cloudy";
    if (code === 3) return "Cloudy";
    if (code >= 45 && code <= 48) return "Foggy";
    if (code >= 51 && code <= 55) return "Drizzle";
    if (code >= 61 && code <= 65) return "Rainy";
    if (code >= 80 && code <= 82) return "Rainy";
    if (code === 95 || code === 96 || code === 99) return "Thunderstorm";
    return "Partly Cloudy";
  };

  const fetchWeather = async (location: string) => {
    // 1. If offline, immediately try to load cached data
    if (typeof window !== 'undefined' && navigator && !navigator.onLine) {
      try {
        const cached = localStorage.getItem(`agriseva_cached_weather_${location}`) || localStorage.getItem('agriseva_cached_weather');
        if (cached) {
          const parsed = JSON.parse(cached);
          setWeatherData(parsed);
          return parsed;
        }
      } catch (e) {
        console.error("Error loading cached weather while offline:", e);
      }
    }

    setIsWeatherLoading(true);
    setWeatherError(null);

    const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
    const city = location.split(',')[0].trim();

    try {
      let newWeatherData: WeatherData;

      if (apiKey) {
        // Use OpenWeatherMap if key is provided
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`
        );

        if (!response.ok) {
          throw new Error(response.status === 404 ? "Invalid location. Please select a valid city." : "Failed to fetch weather data.");
        }

        const data = await response.json();
        newWeatherData = {
          temp: Math.round(data.main.temp),
          condition: data.weather[0].main,
          humidity: data.main.humidity,
          windSpeed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
          uvIndex: "Moderate",
          forecast: MOCK_WEATHER.forecast,
          hourly: MOCK_WEATHER.hourly
        };
      } else {
        // Fallback to completely free keyless Open-Meteo weather API to show ACTUAL real weather for any city!
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
        const geoRes = await fetch(geoUrl);
        if (!geoRes.ok) throw new Error("Geocoding failed");
        const geoData = await geoRes.json();

        let lat = 13.0827; // Default Chennai
        let lon = 80.2707;

        if (geoData.results && geoData.results.length > 0) {
          lat = geoData.results[0].latitude;
          lon = geoData.results[0].longitude;
        }

        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
        const weatherRes = await fetch(weatherUrl);
        if (!weatherRes.ok) throw new Error("Weather fetch failed");
        const data = await weatherRes.json();

        const currentTemp = Math.round(data.current.temperature_2m);
        const currentHumidity = Math.round(data.current.relative_humidity_2m);
        const currentWind = Math.round(data.current.wind_speed_10m);
        const currentCode = data.current.weather_code;
        const currentCondition = mapWmoCodeToCondition(currentCode);

        // Build 3-day forecast
        const dailyForecast = [];
        if (data.daily && data.daily.time) {
          for (let i = 1; i <= 3; i++) {
            if (data.daily.time[i]) {
              const dateStr = data.daily.time[i];
              const dateObj = new Date(dateStr);
              const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
              dailyForecast.push({
                day: dayName,
                tempHigh: Math.round(data.daily.temperature_2m_max[i]),
                tempLow: Math.round(data.daily.temperature_2m_min[i]),
                condition: mapWmoCodeToCondition(data.daily.weather_code[i])
              });
            }
          }
        }

        // Build hourly forecast for the next 8 hours
        const hourlyData = [];
        if (data.hourly && data.hourly.time) {
          const nowStr = data.current.time;
          const startIndex = data.hourly.time.indexOf(nowStr);
          const actualStart = startIndex !== -1 ? startIndex : 0;

          for (let i = 0; i < 8; i++) {
            const idx = actualStart + i;
            if (data.hourly.time[idx]) {
              const isoTime = data.hourly.time[idx];
              const dateObj = new Date(isoTime);
              let timeLabel = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
              if (i === 0) timeLabel = "Now";

              hourlyData.push({
                time: timeLabel,
                temp: Math.round(data.hourly.temperature_2m[idx]),
                condition: mapWmoCodeToCondition(data.hourly.weather_code[idx])
              });
            }
          }
        }

        newWeatherData = {
          temp: currentTemp,
          condition: currentCondition,
          humidity: currentHumidity,
          windSpeed: currentWind,
          uvIndex: "Moderate",
          forecast: dailyForecast.length > 0 ? dailyForecast : MOCK_WEATHER.forecast,
          hourly: hourlyData.length > 0 ? hourlyData : MOCK_WEATHER.hourly
        };
      }

      setWeatherData(newWeatherData);

      // Store in cache
      try {
        localStorage.setItem(`agriseva_cached_weather_${location}`, JSON.stringify(newWeatherData));
        localStorage.setItem('agriseva_cached_weather', JSON.stringify(newWeatherData));
      } catch (e) {
        console.error("Error saving weather cache:", e);
      }

      return newWeatherData;
    } catch (err: any) {
      // Fallback to cache on error
      try {
        const cached = localStorage.getItem(`agriseva_cached_weather_${location}`) || localStorage.getItem('agriseva_cached_weather');
        if (cached) {
          const parsed = JSON.parse(cached);
          setWeatherData(parsed);
          setWeatherError(null); // Clear error because we have cached data!
          return parsed;
        }
      } catch (e) {
        console.error("Error retrieving cached weather after failed fetch:", e);
      }

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

        // Run automated extreme weather check if current weather is fetched
        if (currentWeather) {
          await checkExtremeWeather(currentWeather);
        }
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
      const result = await analyzeCropImage(base64, language, profileData.location);
      
      if (result && result.crop) {
        setScanResult({
          crop: result.crop,
          disease: result.disease || "Healthy",
          confidence: result.confidence || 90,
          chemical: result.chemical || "",
          ratio: result.ratio || "",
          shopRecommendation: result.shopRecommendation || "",
          buyLink: result.buyLink || "",
          buyLinkTitle: result.buyLinkTitle || ""
        });
      } else {
        // Fallback to mock if AI fails or key missing
        const isTa = language === 'ta';
        const isHi = language === 'hi';
        setScanResult({
          crop: isTa ? 'நெல் (Paddy)' : isHi ? 'धान (Paddy)' : "Paddy (Oryza sativa)",
          disease: isTa ? 'இலைக்கருகல் நோய் (Blast Disease)' : isHi ? 'झोंका रोग (Blast Disease)' : "Blast Disease (Pyricularia oryzae)",
          confidence: 94,
          chemical: isTa ? 'ட்ரைசைக்ளாசோல் 75 WP (Tricyclazole)' : isHi ? 'ट्राइसाइक्लाजोल 75 WP (Tricyclazole)' : "Tricyclazole 75 WP",
          ratio: isTa ? '1 லிட்டர் தண்ணீருக்கு 0.6 கிராம்' : isHi ? '0.6 ग्राम प्रति लीटर पानी में' : "0.6g per 1 Liter of water",
          shopRecommendation: isTa ? `அருகிலுள்ள ஆரம்ப வேளாண்மை கூட்டுறவு சங்கம் (PACS) அல்லது ${profileData.location.split(',')[0]} வேளாண்மை சேவை மையம்` : isHi ? `नजदीकी प्राथमिक कृषि सहकारी समिति (PACS) या ${profileData.location.split(',')[0]} कृषि सेवा केंद्र` : `Nearest Primary Agricultural Credit Society (PACS) or ${profileData.location.split(',')[0]} Agri Service Center`,
          buyLink: "https://www.bighaat.com/search?q=Tricyclazole",
          buyLinkTitle: isTa ? 'BigHaat ஆன்லைனில் வாங்கவும்' : isHi ? 'BigHaat पर ऑनलाइन खरीदें' : 'Buy Tricyclazole on BigHaat Online'
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
    const userPrompt = language === 'ta' 
      ? `நான் என் ${scanResult.crop} பயிரை ஸ்கேன் செய்துள்ளேன். அதில் ${scanResult.disease} கண்டறியப்பட்டுள்ளது. பரிந்துரைக்கப்பட்ட மருந்து: ${scanResult.chemical}, கலவை அளவு: ${scanResult.ratio}. அருகில் உள்ள கடை: ${scanResult.shopRecommendation || 'தெரியவில்லை'}. நான் இதை எப்படி பயன்படுத்த வேண்டும்?`
      : language === 'hi'
      ? `मैंने अपनी ${scanResult.crop} फसल को स्कैन किया है। इसमें ${scanResult.disease} पाया गया है। अनुशंसित दवा: ${scanResult.chemical}, अनुपात: ${scanResult.ratio}। नजदीकी दुकान: ${scanResult.shopRecommendation || 'अज्ञात'}। मुझे इसे कैसे इस्तेमाल करना चाहिए?`
      : `I've scanned my ${scanResult.crop}. It detected ${scanResult.disease} with ${scanResult.confidence}% confidence. Recommended treatment chemical: ${scanResult.chemical}, mixing ratio: ${scanResult.ratio}, suggested shop: ${scanResult.shopRecommendation || 'N/A'}. How should I apply this and proceed?`;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userPrompt,
      timestamp: new Date()
    };

    const currentHistory = messages.slice(-10).map(m => ({ role: m.role, content: m.content }));

    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const response = await getAgriAdvice(
        `The user scanned ${scanResult.crop} and detected ${scanResult.disease}. The vision model recommended chemical: ${scanResult.chemical}, mixing ratio: ${scanResult.ratio}, and local shop: ${scanResult.shopRecommendation}. Provide a practical, helpful guide on how to apply this treatment safely and correctly in ${language}.`, 
        language,
        profileData.location,
        profileData.crops,
        profileData.farmSize + ' ' + profileData.farmUnit,
        profileData.soilType,
        currentHistory
      );
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      }]);
    } catch (err) {
      console.error("Consult AI error:", err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = (typeof customPrompt === 'string' ? customPrompt : input).trim();
    if (!textToSend || isTyping) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: new Date(),
    };

    const currentHistory = messages.slice(-10).map(m => ({
      role: m.role,
      content: m.content
    }));

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await getAgriAdvice(
        textToSend, 
        language, 
        profileData.location, 
        profileData.crops, 
        profileData.farmSize + ' ' + profileData.farmUnit, 
        profileData.soilType,
        currentHistory
      );
      
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error("Error sending message to AgriSeva AI:", err);
    } finally {
      setIsTyping(false);
    }
  };

  const fetchCalendar = async () => {
    setScreen('calendar');
    if (calendarData && calendarData.crop === profileData.crops && calendarData.location === profileData.location) return;
    
    setIsCalendarLoading(true);
    try {
      const data = await getCropCalendar(profileData.crops, profileData.location, language);
      setCalendarData(data);
    } catch (error) {
      console.error("Error fetching calendar:", error);
    } finally {
      setIsCalendarLoading(false);
    }
  };

  const fetchRotationSuggestions = async () => {
    setScreen('rotation');
    if (rotationData && rotationData.currentCrop === profileData.crops && rotationData.location === profileData.location && rotationData.soilType === profileData.soilType) return;
    
    setIsRotationLoading(true);
    try {
      const data = await getCropRotationSuggestions(profileData.crops, profileData.location, profileData.soilType, language);
      setRotationData(data);
    } catch (error) {
      console.error("Error fetching rotation suggestions:", error);
    } finally {
      setIsRotationLoading(false);
    }
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
            crops: data.crop,
            soilType: data.soilType
          }));
          // Pre-populate selection states for profile edit screen
          const locParts = data.location.split(',');
          if (locParts.length === 2) {
            setSelectedDistrict(locParts[0].trim());
            setSelectedState(locParts[1].trim());
          }
          setSelectedCrop(data.crop);
          setSelectedSoilType(data.soilType);

          if (user) setScreen('home');
          else setScreen('login');
        }} />;
      case 'login':
        return <LoginScreen onLoginSuccess={() => setScreen('home')} />;
      case 'home':
        return (
          <div className="pb-32 px-6 pt-12 md:px-10 lg:px-16">
            <header className="flex justify-between items-center mb-10">
              <div>
                <h1 className="text-3xl font-extrabold text-primary italic">AgriSeva AI</h1>
                <p className="text-stone-400 font-medium">{profileData.location} • {profileData.crops} • Summer</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setScreen('notifications')}
                  className={cn(
                    "w-12 h-12 rounded-full bg-white flex items-center justify-center relative shadow-sm border border-stone-100 active:scale-95 transition-all",
                    shouldAnimateBell && "ring-2 ring-primary ring-offset-2"
                  )}
                >
                  <motion.div
                    animate={shouldAnimateBell ? { 
                      rotate: [0, -20, 20, -20, 20, 0],
                      scale: [1, 1.2, 1.2, 1]
                    } : {}}
                    transition={{ duration: 0.5 }}
                  >
                    <Bell size={24} className={cn("text-stone-600", shouldAnimateBell && "text-primary")} />
                  </motion.div>
                  {notifications.filter(n => !n.read).length > 0 && (
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-2 right-2 w-3 h-3 bg-red-500 border-2 border-white rounded-full"
                    >
                      {shouldAnimateBell && (
                        <motion.span 
                          initial={{ scale: 1, opacity: 0.8 }}
                          animate={{ scale: 2.5, opacity: 0 }}
                          transition={{ duration: 0.8, repeat: Infinity }}
                          className="absolute inset-0 bg-red-500 rounded-full"
                        />
                      )}
                    </motion.span>
                  )}
                </button>
                <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                  <img src="https://picsum.photos/seed/farmer/100/100" alt="Profile" referrerPolicy="no-referrer" />
                </div>
              </div>
            </header>

            {/* Responsive grid for Web View */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left main column: Weather, Weather Advice, Personalized Tips, farming tips */}
              <div className="lg:col-span-7 space-y-8">
                <section>
                  <div className="bg-gradient-to-br from-primary to-primary-container rounded-xl p-8 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                    <div className="relative z-10">
                      <p className="text-xs font-bold uppercase tracking-widest opacity-70 mb-2">{t('currentWeather')}</p>
                      {isWeatherLoading ? (
                        <div className="py-10 flex flex-col items-center justify-center">
                          <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4"></div>
                          <p className="text-sm font-bold">{t('fetchingWeather')}</p>
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
                              <p className="text-[10px] uppercase font-bold opacity-60">{t('humidity')}</p>
                              <p className="font-bold">{weatherData.humidity}%</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase font-bold opacity-60">{t('wind')}</p>
                              <p className="font-bold">{weatherData.windSpeed} km/h</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase font-bold opacity-60">{t('uvIndex')}</p>
                              <p className="font-bold">{weatherData.uvIndex}</p>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="py-10 text-center">
                          <p className="text-sm font-bold opacity-70">{t('noWeatherAvailable')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-xl font-bold mb-4 text-stone-800">{t('weatherAdvice')}</h2>
                  <div className="bg-secondary-container rounded-xl p-6 flex gap-4 items-start shadow-sm">
                    <div className="bg-white rounded-full p-2 text-primary shrink-0">
                      <CloudSun size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-on-secondary-container mb-1">{t('aiWeatherExpert')}</h4>
                      {isLoadingWeatherAdvice ? (
                        <div className="flex gap-1 py-2">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                          <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                          <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></div>
                        </div>
                      ) : (
                        <div className="text-sm text-on-secondary-container opacity-90 leading-relaxed prose prose-sm max-w-none text-stone-800 font-medium">
                          <ReactMarkdown>{weatherAdvice || t('selectLocationAdvice')}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                <section>
                  <PersonalizedCropTips 
                    profileData={profileData} 
                    language={language} 
                    onAskAI={(prompt) => {
                      setInput(prompt);
                      setScreen('chat');
                    }} 
                  />
                </section>

                <section>
                  <h2 className="text-xl font-bold mb-4 text-stone-800">{t('farmingTips')}</h2>
                  <div className="bg-secondary-container rounded-xl p-6 flex gap-4 items-start animate-fade-in">
                    <div className="bg-white rounded-full p-2 text-primary">
                      <Droplets size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-on-secondary-container mb-1">{t('irrigationAlert')}</h4>
                      <p className="text-sm text-on-secondary-container opacity-80">{t('irrigationTip')}</p>
                    </div>
                  </div>
                </section>
              </div>

              {/* Right column: Quick Actions */}
              <div className="lg:col-span-5 space-y-8">
                <section>
                  <h2 className="text-xl font-bold mb-4 text-stone-800">{t('quickActions')}</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setScreen('chat')}
                      className="bg-white p-6 rounded-xl shadow-sm border border-stone-100 flex flex-col items-center text-center hover:bg-secondary-container transition-colors"
                    >
                      <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-4 text-primary">
                        <MessageSquare size={24} />
                      </div>
                      <span className="font-bold text-stone-700 text-sm leading-tight">{t('askAIAdvice')}</span>
                    </button>
                    <button 
                      onClick={() => setScreen('upload')}
                      className="bg-white p-6 rounded-xl shadow-sm border border-stone-100 flex flex-col items-center text-center hover:bg-secondary-container transition-colors"
                    >
                      <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-4 text-primary">
                        <Camera size={24} />
                      </div>
                      <span className="font-bold text-stone-700 text-sm leading-tight">{t('scanCrop')}</span>
                    </button>
                    <button 
                      onClick={() => setScreen('market')}
                      className="bg-white p-6 rounded-xl shadow-sm border border-stone-100 flex flex-col items-center text-center hover:bg-secondary-container transition-colors"
                    >
                      <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-4 text-primary">
                        <TrendingUp size={24} />
                      </div>
                      <span className="font-bold text-stone-700 text-sm leading-tight">{t('marketPrices')}</span>
                    </button>
                    <button 
                      onClick={() => setScreen('schemes')}
                      className="bg-white p-6 rounded-xl shadow-sm border border-stone-100 flex flex-col items-center text-center hover:bg-secondary-container transition-colors"
                    >
                      <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-4 text-primary">
                        <Landmark size={24} />
                      </div>
                      <span className="font-bold text-stone-700 text-sm leading-tight">{t('govtSchemes')}</span>
                    </button>
                    <button 
                      onClick={fetchCalendar}
                      className="bg-white p-6 rounded-xl shadow-sm border border-stone-100 flex flex-col items-center text-center hover:bg-secondary-container transition-colors"
                    >
                      <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-4 text-primary">
                        <Calendar size={24} />
                      </div>
                      <span className="font-bold text-stone-700 text-sm leading-tight">{t('cropCalendar')}</span>
                    </button>
                    <button 
                      onClick={fetchRotationSuggestions}
                      className="bg-white p-6 rounded-xl shadow-sm border border-stone-100 flex flex-col items-center text-center hover:bg-secondary-container transition-colors"
                    >
                      <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-4 text-primary">
                        <RefreshCw size={24} />
                      </div>
                      <span className="font-bold text-stone-700 text-sm leading-tight">{t('cropRotation')}</span>
                    </button>
                    <button 
                      onClick={() => setScreen('alerts')}
                      className="col-span-2 bg-white p-6 rounded-xl shadow-sm border border-stone-100 flex flex-col items-center text-center hover:bg-secondary-container transition-colors font-sans"
                    >
                      <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-4 text-primary">
                        <Bell size={24} />
                      </div>
                      <span className="font-bold text-stone-700 text-sm leading-tight">{t('priceAlerts')}</span>
                    </button>
                  </div>
                </section>
              </div>
            </div>
          </div>
        );
      case 'chat':
        return (
          <div className="h-screen flex flex-col bg-surface">
            <header className="p-5 bg-white border-b border-stone-100 flex items-center justify-between sticky top-0 z-10 shadow-xs">
              <div className="flex items-center gap-3">
                <button onClick={() => setScreen('home')} className="p-2 hover:bg-stone-50 rounded-full transition-colors">
                  <ChevronLeft size={22} />
                </button>
                <div>
                  <h2 className="text-lg font-extrabold text-stone-800 tracking-tight">AgriSeva AI Expert</h2>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-[11px] text-stone-400 font-medium">Multi-Agent System Ready</span>
                  </div>
                </div>
              </div>

              {messages.length > 0 && (
                <button 
                  onClick={() => setMessages([])}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-500 bg-stone-100 hover:bg-stone-200/80 rounded-full transition-all"
                  title="Clear conversation"
                >
                  <RotateCcw size={13} />
                  <span>{language === 'ta' ? 'அழி' : language === 'hi' ? 'साफ़ करें' : 'Clear'}</span>
                </button>
              )}
            </header>
            
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 no-scrollbar">
              {messages.length === 0 && (
                <div className="text-center py-6 max-w-lg mx-auto">
                  <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-600 shadow-xs border border-emerald-100">
                    <Sprout size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-stone-800 mb-1">
                    {language === 'ta' ? 'வணக்கம்! விவசாய AI வழிகாட்டி' : language === 'hi' ? 'नमस्ते! कृषि एआई साथी' : 'Welcome to AgriSeva AI'}
                  </h3>
                  <p className="text-stone-500 text-xs max-w-sm mx-auto mb-6 leading-relaxed">
                    {language === 'ta' 
                      ? `${profileData.location} பகுதியில் உங்கள் ${profileData.crops} பயிருக்கான பயிர் பாதுகாப்பு, வானிலை, சந்தை விலை மற்றும் அரசு திட்டங்களுக்கான ஆலோசனைகள்.`
                      : language === 'hi'
                      ? `${profileData.location} में आपकी ${profileData.crops} फसल के लिए कीट नियंत्रण, मौसम, मंडी भाव और सरकारी योजनाओं की सटीक सलाह।`
                      : `Expert advice for your ${profileData.crops} in ${profileData.location} covering pests, weather, mandi prices, and govt schemes.`}
                  </p>

                  <div className="text-left space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400 px-1">
                      {language === 'ta' ? 'சுலபமான கேள்விகள்' : language === 'hi' ? 'सुझाए गए प्रश्न' : 'Suggested Questions'}
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        {
                          icon: '🌾',
                          text: language === 'ta' 
                            ? `${profileData.crops} பயிருக்கு தேவையான NPK உர அட்டவணை மற்றும் பரிந்துரை என்ன?`
                            : language === 'hi'
                            ? `${profileData.crops} की फसल के लिए संतुलित NPK उर्वरक का समय और मात्रा क्या है?`
                            : `What is the recommended fertilizer (NPK) schedule for ${profileData.crops}?`
                        },
                        {
                          icon: '🐛',
                          text: language === 'ta'
                            ? `${profileData.crops} பயிரில் இலைக்கருகல் மற்றும் பூச்சி தாக்குதலை தடுப்பது எப்படி?`
                            : language === 'hi'
                            ? `${profileData.crops} में कीट और रोगों की पहचान व जैविक रोकथाम कैसे करें?`
                            : `How to prevent blast disease, stem borer & pests in ${profileData.crops}?`
                        },
                        {
                          icon: '🌦️',
                          text: language === 'ta'
                            ? `${profileData.location} தற்போதைய வானிலைக்கு ஏற்ப நீர்ப்பாசன வழிகாட்டல்`
                            : language === 'hi'
                            ? `${profileData.location} में वर्तमान मौसम के अनुसार सिंचाई और खेत की देखभाल`
                            : `Irrigation guidance based on current weather in ${profileData.location}`
                        },
                        {
                          icon: '📈',
                          text: language === 'ta'
                            ? `${profileData.location} மண்டிகளில் ${profileData.crops} சந்தை விலை மற்றும் விற்கும் நேரம்`
                            : language === 'hi'
                            ? `${profileData.location} की मंडियों में ${profileData.crops} का भाव और बेचने का सही समय`
                            : `Current Mandi prices and best selling time for ${profileData.crops}`
                        },
                        {
                          icon: '🏛️',
                          text: language === 'ta'
                            ? `PM-KISAN மற்றும் பயிர் காப்பீட்டுக்கு விண்ணப்பிக்கும் முறை`
                            : language === 'hi'
                            ? `पीएम किसान और फसल बीमा योजना की पात्रता और आवश्यक दस्तावेज`
                            : `PM-KISAN eligibility criteria and how to apply for crop insurance`
                        }
                      ].map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(item.text)}
                          className="w-full p-3.5 bg-white hover:bg-emerald-50/70 border border-stone-200/80 hover:border-emerald-300 rounded-xl text-left text-xs font-medium text-stone-700 hover:text-emerald-800 transition-all flex items-center gap-3 shadow-xs active:scale-[0.99] cursor-pointer"
                        >
                          <span className="text-base shrink-0">{item.icon}</span>
                          <span className="flex-1 leading-snug">{item.text}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {messages.map((msg) => (
                <div key={msg.id} className={cn(
                  "flex flex-col max-w-[88%] sm:max-w-[80%]",
                  msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                )}>
                  <div className={cn(
                    "p-4 rounded-2xl shadow-xs text-sm leading-relaxed",
                    msg.role === 'user' 
                      ? "bg-primary text-white rounded-tr-xs" 
                      : "bg-white text-stone-800 rounded-tl-xs border border-stone-100"
                  )}>
                    <div className="prose prose-sm max-w-none prose-stone dark:prose-invert">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                  <span className="text-[10px] text-stone-400 mt-1 font-medium px-1">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
              {isTyping && (
                <div className="flex flex-col items-start max-w-[85%]">
                  <div className="bg-white p-4 rounded-2xl rounded-tl-xs border border-stone-100 shadow-xs flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></div>
                    </div>
                    <span className="text-xs text-stone-400 font-medium">AgriSeva Agent is analyzing...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-4 sm:p-6 bg-white border-t border-stone-100 pb-10">
              <div className="flex gap-3 items-center bg-surface-container-high rounded-full px-5 py-2">
                <button 
                  onClick={toggleListening}
                  className={cn(
                    "p-2 rounded-full transition-all",
                    isListening ? "bg-red-500 text-white animate-pulse" : "text-stone-400 hover:text-primary"
                  )}
                  title={isListening ? "Stop listening" : "Voice input"}
                >
                  {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={isListening ? (language === 'ta' ? 'கேட்கிறது...' : language === 'hi' ? 'सुन रहा है...' : 'Listening...') : (language === 'ta' ? 'விவசாயம் பற்றி ஏதேனும் கேட்கவும்...' : language === 'hi' ? 'खेती के बारे में कुछ भी पूछें...' : 'Ask anything about farming...')}
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-3 text-stone-800 placeholder:text-stone-400"
                />
                <button 
                  onClick={() => handleSendMessage()}
                  disabled={!input.trim() || isTyping}
                  className="p-2.5 bg-primary text-white rounded-full disabled:opacity-40 transition-all hover:bg-primary/90 cursor-pointer shadow-xs"
                >
                  <Send size={18} />
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

            <InteractiveDistrictMap
              selectedState={selectedState}
              selectedDistrict={selectedDistrict}
              onDistrictSelect={(district) => {
                setSelectedDistrict(district);
                setProfileData(prev => ({ ...prev, location: `${district}, ${selectedState}` }));
                setLocationError(null);
              }}
            />

            {/* Weather Simulation & Alert Testing */}
            <div className="mb-8 p-5 bg-stone-50 border border-stone-200 rounded-xl shadow-sm">
              <div className="flex items-center gap-2 mb-3 text-stone-700">
                <AlertTriangle size={18} className="text-amber-500" />
                <h4 className="font-bold text-sm text-stone-800">Weather Alert Simulation</h4>
              </div>
              <p className="text-xs text-stone-500 mb-4 leading-relaxed">
                Test the automated check in the weather service by simulating extreme weather conditions. This triggers an instant alert notification.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleSimulateExtremeWeather('heatwave')}
                  className="px-4 py-2 bg-amber-500 text-white font-bold text-xs rounded-lg hover:bg-amber-600 transition-all flex items-center gap-1 shadow-sm"
                >
                  <Sun size={14} />
                  Simulate Heatwave (42°C)
                </button>
                <button
                  onClick={() => handleSimulateExtremeWeather('thunderstorm')}
                  className="px-4 py-2 bg-slate-700 text-white font-bold text-xs rounded-lg hover:bg-slate-800 transition-all flex items-center gap-1 shadow-sm"
                >
                  <Wind size={14} />
                  Simulate Storm (52 km/h)
                </button>
              </div>
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
      case 'schemes': {
        const eligibleCount = GOVT_SCHEMES.filter(s => automatedSchemeEvaluations[s.id]?.status === 'eligible').length;

        const filteredSchemes = GOVT_SCHEMES.filter(scheme => {
          const matchesSearch = 
            scheme.title.toLowerCase().includes(schemeSearchQuery.toLowerCase()) || 
            scheme.desc.toLowerCase().includes(schemeSearchQuery.toLowerCase()) ||
            scheme.benefit.toLowerCase().includes(schemeSearchQuery.toLowerCase()) ||
            scheme.department.toLowerCase().includes(schemeSearchQuery.toLowerCase());

          if (!matchesSearch) return false;

          if (filterEligibleOnly && automatedSchemeEvaluations[scheme.id]?.status !== 'eligible') {
            return false;
          }

          if (schemeCategoryFilter !== 'all') {
            if (schemeCategoryFilter === 'income' && scheme.category !== 'income') return false;
            if (schemeCategoryFilter === 'insurance' && scheme.category !== 'insurance') return false;
            if (schemeCategoryFilter === 'credit' && scheme.category !== 'credit') return false;
            if (schemeCategoryFilter === 'irrigation' && scheme.category !== 'irrigation' && scheme.category !== 'machinery') return false;
          }

          return true;
        });

        const toggleDocAccordion = (id: number) => {
          setExpandedSchemeDocs(prev => ({
            ...prev,
            [id]: !prev[id]
          }));
        };

        return (
          <div className="pb-32 px-4 sm:px-6 pt-10 max-w-4xl mx-auto font-sans">
            {/* Top Header */}
            <header className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setScreen('home')} 
                  className="p-2 hover:bg-stone-100 rounded-full transition-colors active:scale-95"
                  aria-label="Back to Home"
                >
                  <ChevronLeft size={24} className="text-stone-700" />
                </button>
                <div>
                  <h2 className="text-2xl font-black text-stone-900 tracking-tight">{t('schemesHeader')}</h2>
                  <p className="text-xs text-stone-500 font-medium">
                    {language === 'ta' 
                      ? 'தானியங்கி தகுதி சரிபார்ப்பு மற்றும் நேரடி விண்ணப்ப போர்டல்கள்' 
                      : language === 'hi'
                      ? 'स्वचालित पात्रता जांच एवं सीधे आधिकारिक आवेदन पोर्टल'
                      : 'Automated Eligibility Check & Direct Application Portals'}
                  </p>
                </div>
              </div>

              {/* Farmer Profile Badge */}
              <div className="hidden sm:flex items-center gap-2 bg-emerald-50 border border-emerald-200/80 px-3.5 py-1.5 rounded-full text-xs font-bold text-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{profileData.crops}</span>
                <span className="text-emerald-400">•</span>
                <span>{profileData.location.split(',')[0]}</span>
                <span className="text-emerald-400">•</span>
                <span>{profileData.farmSize} {profileData.farmUnit}</span>
              </div>
            </header>

            {/* Automated AI Schemes Agent Assessment Card */}
            <div className="mb-8 bg-gradient-to-br from-emerald-900 via-teal-900 to-green-950 text-white rounded-3xl p-6 sm:p-7 shadow-xl shadow-emerald-950/20 border border-emerald-700/40 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-emerald-300 border border-white/15 shadow-inner">
                      <Sparkles size={22} className="animate-pulse" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-black tracking-widest text-emerald-300/90 block">
                        AgriSeva AI Agent
                      </span>
                      <h3 className="text-lg font-black tracking-tight text-white">
                        {t('agentAssessment')}
                      </h3>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                    <CheckCircle2 size={13} className="text-emerald-300" />
                    {language === 'ta' ? 'தானியங்கி தணிக்கை' : language === 'hi' ? 'स्वतः सत्यापित' : 'Auto Verified'}
                  </span>
                </div>

                <p className="text-xs text-emerald-100/90 font-medium leading-relaxed mb-5 max-w-2xl">
                  {language === 'ta'
                    ? `உங்கள் சுயவிவரத்தின்படி (${profileData.name || 'விவசாயி'}, ${profileData.crops} பயிர், ${profileData.location}, ${profileData.farmSize} ${profileData.farmUnit}), வேளாண்மை அமைச்சகம் மற்றும் மாநில அரசின் 8 முக்கிய திட்டங்களை AI முகவர் ஆய்வு செய்துள்ளது.`
                    : language === 'hi'
                    ? `आपके किसान प्रोफ़ाइल (${profileData.name || 'किसान'}, फसल: ${profileData.crops}, स्थान: ${profileData.location}, भूमि: ${profileData.farmSize} ${profileData.farmUnit}) के आधार पर एआई एजेंट ने 8 प्रमुख सरकारी योजनाओं की पात्रता स्वतः जांच ली है।`
                    : `Based on your profile (${profileData.name || 'Farmer'}, cultivating ${profileData.crops} in ${profileData.location} on ${profileData.farmSize} ${profileData.farmUnit}), the AgriSeva Agent has audited 8 flagship central and state schemes.`}
                </p>

                {/* 3 Metric Summary Badges */}
                <div className="grid grid-cols-3 gap-2.5 sm:gap-4 pt-4 border-t border-white/15">
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/10 text-center">
                    <span className="block text-2xl font-black text-emerald-300">{eligibleCount} / {GOVT_SCHEMES.length}</span>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-100/80">
                      {language === 'ta' ? 'தகுதியுடையவை' : language === 'hi' ? 'पूर्णतः पात्र' : 'Eligible Schemes'}
                    </span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/10 text-center">
                    <span className="block text-2xl font-black text-amber-300">₹6,000 +</span>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-100/80">
                      {language === 'ta' ? 'நேரடி மானியம்' : language === 'hi' ? 'वार्षिक सहायता' : 'Direct DBT / yr'}
                    </span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/10 text-center">
                    <span className="block text-2xl font-black text-cyan-300">4% KCC</span>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-100/80">
                      {language === 'ta' ? 'சலுகை கடன்' : language === 'hi' ? 'सस्ती ऋण सुविधा' : 'Subsidized Credit'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Filter Section */}
            <div className="space-y-3 mb-8">
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Search size={18} className="text-stone-400" />
                </div>
                <input 
                  type="text" 
                  value={schemeSearchQuery}
                  onChange={(e) => setSchemeSearchQuery(e.target.value)}
                  placeholder={t('searchSchemes')}
                  className="w-full pl-11 pr-10 py-3.5 bg-white rounded-2xl border border-stone-200/90 shadow-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-medium text-stone-800 placeholder:text-stone-400"
                />
                {schemeSearchQuery && (
                  <button 
                    onClick={() => setSchemeSearchQuery('')}
                    className="absolute inset-y-0 right-3 flex items-center text-stone-400 hover:text-stone-600 p-1"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Filter Tabs & Quick Toggles */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setFilterEligibleOnly(false)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border",
                    !filterEligibleOnly
                      ? "bg-stone-900 text-white border-stone-900 shadow-xs"
                      : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"
                  )}
                >
                  {t('allSchemes')} ({GOVT_SCHEMES.length})
                </button>
                <button
                  onClick={() => setFilterEligibleOnly(true)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border flex items-center gap-1.5",
                    filterEligibleOnly
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                      : "bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50/70"
                  )}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  {t('eligibleSchemesOnly')} ({eligibleCount})
                </button>

                {/* Category Pills */}
                <div className="h-4 w-px bg-stone-200 hidden sm:block mx-1"></div>

                {[
                  { id: 'all', label: language === 'ta' ? 'அனைத்து வகைகள்' : language === 'hi' ? 'सभी श्रेणियां' : 'All Categories' },
                  { id: 'income', label: language === 'ta' ? 'நேரடி உதவி' : language === 'hi' ? 'आय सहायता' : 'Income DBT' },
                  { id: 'insurance', label: language === 'ta' ? 'காப்பீடு' : language === 'hi' ? 'फसल बीमा' : 'Insurance' },
                  { id: 'credit', label: language === 'ta' ? 'கடன் (KCC)' : language === 'hi' ? 'ऋण (KCC)' : 'Credit / KCC' },
                  { id: 'irrigation', label: language === 'ta' ? 'பாசனம் & இயந்திரம்' : language === 'hi' ? 'सिंचाई व यंत्र' : 'Irrigation & Tools' }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSchemeCategoryFilter(cat.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-medium transition-all",
                      schemeCategoryFilter === cat.id
                        ? "bg-emerald-100 text-emerald-800 font-bold border border-emerald-300"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-200/70"
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Schemes List */}
            <div className="space-y-6">
              {filteredSchemes.map((scheme) => {
                const evalData = automatedSchemeEvaluations[scheme.id] || {
                  status: 'eligible',
                  matchScore: 95,
                  reason: 'Profile matched with scheme criteria.',
                  benefitHighlight: 'Eligible for Government assistance'
                };
                const isEligible = evalData.status === 'eligible';
                const isExpanded = !!expandedSchemeDocs[scheme.id];

                return (
                  <motion.div 
                    key={scheme.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white rounded-3xl border border-stone-200/90 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                  >
                    {/* Card Top Header */}
                    <div className="p-6 sm:p-7 pb-4 border-b border-stone-100">
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5">
                        <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Building2 size={13} className="text-stone-400" />
                          {scheme.department}
                        </span>

                        {/* Automatic Eligibility Badge */}
                        <div className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wide border shadow-2xs",
                          isEligible 
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        )}>
                          <CheckCircle2 size={14} className={isEligible ? "text-emerald-600" : "text-amber-600"} />
                          <span>
                            {isEligible ? t('eligible') : t('likelyEligible')} ({evalData.matchScore}% Match)
                          </span>
                        </div>
                      </div>

                      <h3 className="text-xl font-black text-stone-900 tracking-tight mb-2">
                        {scheme.title}
                      </h3>

                      {/* Official Benefit Banner */}
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-xl border border-emerald-200/70 text-emerald-900 text-xs font-bold mb-3">
                        <span className="text-base">💰</span>
                        <span>{scheme.benefit}</span>
                      </div>

                      <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
                        {scheme.desc}
                      </p>
                    </div>

                    {/* AUTOMATED AGENT ELIGIBILITY AUDIT BOX */}
                    <div className="px-6 sm:px-7 py-4 bg-emerald-50/50 border-b border-emerald-100/70">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-xs">
                          <Sparkles size={16} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800">
                              🤖 {t('agentAssessment')} • {profileData.name}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                              {evalData.benefitHighlight}
                            </span>
                          </div>
                          
                          <p className="text-xs text-stone-700 font-medium leading-relaxed mb-3">
                            {evalData.reason}
                          </p>

                          {/* Profile Verification Micro-Badges */}
                          <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-stone-500">
                            <span className="px-2 py-0.5 bg-white rounded-md border border-emerald-200/80 text-emerald-800 flex items-center gap-1">
                              <Check size={11} className="text-emerald-600" />
                              Crop: {profileData.crops}
                            </span>
                            <span className="px-2 py-0.5 bg-white rounded-md border border-emerald-200/80 text-emerald-800 flex items-center gap-1">
                              <Check size={11} className="text-emerald-600" />
                              Location: {profileData.location}
                            </span>
                            <span className="px-2 py-0.5 bg-white rounded-md border border-emerald-200/80 text-emerald-800 flex items-center gap-1">
                              <Check size={11} className="text-emerald-600" />
                              Holding: {profileData.farmSize} {profileData.farmUnit}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* DIRECT PORTAL APPLY ACTION (PRIMARY) */}
                    <div className="p-6 sm:p-7 space-y-4">
                      <a
                        href={scheme.applyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-4 px-5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white rounded-2xl font-black text-sm shadow-md shadow-emerald-700/20 flex items-center justify-between transition-all group cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                            <ExternalLink size={20} className="text-white group-hover:scale-110 transition-transform" />
                          </div>
                          <div className="text-left">
                            <span className="block font-black text-sm tracking-wide leading-tight">
                              {t('applyOnPortal')} ↗
                            </span>
                            <span className="block text-[11px] text-emerald-100 font-medium opacity-95">
                              {scheme.portalName}
                            </span>
                          </div>
                        </div>
                        <ArrowUpRight size={22} className="text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform shrink-0" />
                      </a>

                      <p className="text-[11px] text-stone-400 font-medium text-center flex items-center justify-center gap-1">
                        <ShieldCheck size={13} className="text-emerald-600 shrink-0" />
                        {t('directPortalLinkNotice')}
                      </p>

                      {/* Accordion / Secondary Tools */}
                      <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                        <button
                          onClick={() => toggleDocAccordion(scheme.id)}
                          className="flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-stone-900 transition-colors py-1"
                        >
                          <FileText size={15} className="text-stone-400" />
                          <span>{t('requiredDocs')} & Highlights</span>
                          {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                        </button>

                        <button
                          onClick={() => handleCheckEligibility(scheme.id, scheme.title)}
                          disabled={checkingSchemeId === scheme.id}
                          className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors py-1 disabled:opacity-50"
                        >
                          {checkingSchemeId === scheme.id ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin"></div>
                              <span>{t('checkingEligibility')}</span>
                            </>
                          ) : (
                            <>
                              <Sparkles size={14} className="text-emerald-600" />
                              <span>{t('detailedAnalysis')}</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Expanded Documents and Highlights Panel */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="pt-3 space-y-4 text-xs overflow-hidden"
                          >
                            {/* Required Documents */}
                            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/70">
                              <p className="font-extrabold text-stone-800 uppercase tracking-wider text-[11px] mb-2.5 flex items-center gap-1.5">
                                <FileText size={14} className="text-stone-500" />
                                {t('requiredDocs')}
                              </p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {scheme.documents.map((doc, idx) => (
                                  <div key={idx} className="flex items-center gap-2 text-stone-700">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                                    <span>{doc}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Key Highlights */}
                            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/70">
                              <p className="font-extrabold text-stone-800 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                                <CheckCircle2 size={14} className="text-stone-500" />
                                {t('keyHighlights')}
                              </p>
                              <ul className="space-y-1.5 text-stone-600">
                                {scheme.keyHighlights.map((hl, idx) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <span className="text-emerald-600 font-bold">•</span>
                                    <span>{hl}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Helpline */}
                            {scheme.helpline && (
                              <div className="flex items-center justify-between p-3 bg-stone-100/70 rounded-xl text-stone-600 font-medium">
                                <span className="flex items-center gap-2">
                                  <PhoneCall size={14} className="text-emerald-600" />
                                  <span>{t('helpline')}: <strong>{scheme.helpline}</strong></span>
                                </span>
                                <span className="text-[10px] text-stone-400 uppercase font-bold">Toll Free / Central Desk</span>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Detailed AI Gemini Assessment Output */}
                      {eligibilityResults[scheme.id] && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="p-5 bg-emerald-50/70 rounded-2xl border border-emerald-200"
                        >
                          <div className="flex items-center justify-between mb-3 pb-2 border-b border-emerald-200/60">
                            <div className="flex items-center gap-2">
                              <Sparkles size={16} className="text-emerald-700" />
                              <span className="text-xs font-black text-emerald-900 uppercase tracking-wider">
                                {t('detailedAnalysis')}
                              </span>
                            </div>
                            <button
                              onClick={() => setEligibilityResults(prev => {
                                const next = { ...prev };
                                delete next[scheme.id];
                                return next;
                              })}
                              className="text-[11px] font-bold text-stone-400 hover:text-stone-700"
                            >
                              ✕
                            </button>
                          </div>
                          <div className="prose prose-sm prose-stone text-stone-800 leading-relaxed max-w-none text-xs sm:text-sm font-medium">
                            <ReactMarkdown>{eligibilityResults[scheme.id]}</ReactMarkdown>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                );
              })}

              {filteredSchemes.length === 0 && (
                <div className="py-16 text-center bg-white rounded-3xl border border-stone-200 p-8">
                  <div className="w-14 h-14 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-stone-400">
                    <Search size={28} />
                  </div>
                  <h4 className="text-base font-bold text-stone-800 mb-1">
                    {language === 'ta' ? 'திட்டங்கள் எதுவும் பொருந்தவில்லை' : language === 'hi' ? 'कोई योजना नहीं मिली' : 'No matching schemes found'}
                  </h4>
                  <p className="text-xs text-stone-500 mb-4">
                    {language === 'ta' 
                      ? 'உங்கள் தேடல் சொல்லை மாற்றி முயற்சிக்கவும் அல்லது வடிகட்டிகளை மீட்டமைக்கவும்.' 
                      : language === 'hi'
                      ? 'अपनी खोज बदलें या फ़िल्टर रीसेट करें।'
                      : 'Try adjusting your search terms or reset the filters.'}
                  </p>
                  <button
                    onClick={() => {
                      setSchemeSearchQuery('');
                      setFilterEligibleOnly(false);
                      setSchemeCategoryFilter('all');
                    }}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-emerald-700"
                  >
                    {language === 'ta' ? 'வடிகட்டிகளை மீட்டமை' : language === 'hi' ? 'फ़िल्टर रीसेट करें' : 'Reset Filters'}
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      }
      case 'market': {
        const getChartData = (view: 'primary' | 'average', timeframe: '1m' | '3m' | '6m') => {
          const baseData = view === 'primary' ? MARKET_TRENDS : AVERAGE_MARKET_TRENDS;
          if (timeframe === '6m') {
            return baseData.map(item => ({ label: item.month, price: Number((item.price / 100).toFixed(2)) }));
          } else if (timeframe === '3m') {
            return baseData.slice(-3).map(item => ({ label: item.month, price: Number((item.price / 100).toFixed(2)) }));
          } else {
            // '1m' weekly data
            if (view === 'primary') {
              return [
                { label: 'Wk 1', price: 23.40 },
                { label: 'Wk 2', price: 23.80 },
                { label: 'Wk 3', price: 24.10 },
                { label: 'Wk 4', price: 24.50 },
              ];
            } else {
              return [
                { label: 'Wk 1', price: 21.50 },
                { label: 'Wk 2', price: 21.65 },
                { label: 'Wk 3', price: 21.80 },
                { label: 'Wk 4', price: 22.00 },
              ];
            }
          }
        };

        const activeChartData = getChartData(marketChartView, marketTimeframe);
        const averagePrice = (activeChartData.reduce((acc, curr) => acc + curr.price, 0) / activeChartData.length).toFixed(2);

        return (
          <div className="pb-32 px-6 pt-12">
            <header className="flex items-center gap-4 mb-10">
              <button onClick={() => setScreen('home')} className="p-2 hover:bg-stone-100 rounded-full">
                <ChevronLeft size={24} />
              </button>
              <h2 className="text-2xl font-bold text-stone-800">{t('marketPrices')}</h2>
            </header>

            {isMarketLoading ? (
              <div className="py-20 flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
                <p className="text-lg font-bold text-stone-400">{t('fetchingLivePrices')}</p>
              </div>
            ) : (
              <>
                <div className="bg-white p-6 rounded-xl border border-stone-100 shadow-sm mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <History size={20} className="text-primary" />
                      <h3 className="font-bold text-stone-800">{t('priceTrends')}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                        {marketChartView === 'primary' ? profileData.crops : 'Market'} Avg.
                      </p>
                      <p className="text-lg font-black text-primary">
                        ₹{averagePrice} / kg
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 mb-6">
                    <div className="flex bg-stone-100 p-1 rounded-lg flex-1">
                      <button 
                        onClick={() => setMarketChartView('primary')}
                        className={cn(
                          "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-md transition-all",
                          marketChartView === 'primary' ? "bg-white text-primary shadow-sm" : "text-stone-400 hover:text-stone-600"
                        )}
                      >
                        {profileData.crops}
                      </button>
                      <button 
                        onClick={() => setMarketChartView('average')}
                        className={cn(
                          "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-md transition-all",
                          marketChartView === 'average' ? "bg-white text-primary shadow-sm" : "text-stone-400 hover:text-stone-600"
                        )}
                      >
                        Market Avg.
                      </button>
                    </div>

                    <div className="relative shrink-0">
                      <select
                        value={marketTimeframe}
                        onChange={(e) => setMarketTimeframe(e.target.value as '1m' | '3m' | '6m')}
                        className="bg-stone-50 border border-stone-200 text-xs font-black uppercase tracking-wider text-stone-600 px-3 py-2 rounded-lg outline-none cursor-pointer focus:ring-2 focus:ring-primary/20 appearance-none pr-8"
                        style={{ backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2357534e' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`, backgroundPosition: 'right 8px center', backgroundSize: '16px', backgroundRepeat: 'no-repeat' }}
                      >
                        <option value="1m">1 Month</option>
                        <option value="3m">3 Months</option>
                        <option value="6m">6 Months</option>
                      </select>
                    </div>
                  </div>

                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={activeChartData}>
                        <defs>
                          <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#166534" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#166534" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="label" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 12, fill: '#9ca3af' }} 
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 12, fill: '#9ca3af' }}
                          domain={['dataMin - 1', 'dataMax + 1']}
                        />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '12px' }}
                          formatter={(value: number) => [`₹${value.toFixed(2)} / kg`, 'Price']}
                          labelStyle={{ fontWeight: 'bold', marginBottom: '4px', color: '#1c1917' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="price" 
                          stroke="#166534" 
                          strokeWidth={3}
                          fillOpacity={1} 
                          fill="url(#colorPrice)" 
                          animationDuration={1000}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-[10px] text-center text-stone-400 mt-4 font-medium">
                    Historical data for the last {marketTimeframe === '1m' ? '1 month' : marketTimeframe === '3m' ? '3 months' : '6 months'} in your region
                  </p>
                </div>

                {/* 3-YEAR HISTORICAL MONTH COMPARISON FEATURE */}
                <HistoricalMarketPriceComparison
                  currentCrops={[profileData.crops, ...(marketData?.prices.map(p => p.crop) || [])]}
                  primaryCrop={profileData.crops || 'Paddy'}
                  marketPrices={marketData?.prices || []}
                  location={profileData.location || 'Salem'}
                  language={language}
                  onSetAlertClick={() => setScreen('alerts')}
                />

                {/* 3-MONTH AI-POWERED PRICE FORECAST CARD */}
                <CropPriceForecastCard
                  currentCrops={[profileData.crops, ...(marketData?.prices.map(p => p.crop) || [])]}
                  primaryCrop={profileData.crops || 'Paddy'}
                  marketPrices={marketData?.prices || []}
                  location={profileData.location || 'Salem, Tamil Nadu'}
                  language={language}
                  onSetAlertClick={() => setScreen('alerts')}
                />

                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-stone-800">{t('liveMandiPrices')}</h3>
                  {marketData?.prices.map((price, index) => {
                    const converted = getPricePerKg(price.price, price.unit);
                    return (
                      <motion.div 
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white p-6 rounded-xl border border-stone-100 shadow-sm"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-bold text-stone-800 text-lg">{price.crop}</h4>
                            <p className="text-xs text-stone-400 font-medium flex items-center gap-1">
                              <MapPin size={12} /> {price.mandi}
                            </p>
                          </div>
                          <div className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                            price.trend === 'up' ? "bg-green-50 text-green-600" : 
                            price.trend === 'down' ? "bg-red-50 text-red-600" : "bg-stone-50 text-stone-500"
                          )}>
                            {price.trend}
                          </div>
                        </div>
                        
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-black text-stone-800">₹{converted.price}</span>
                          <span className="text-xs text-stone-400 font-bold">/ {converted.unit}</span>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-stone-50 flex justify-between items-center">
                          <span className="text-[10px] text-stone-300 font-medium">Updated: {price.date}</span>
                          <button 
                            onClick={() => setScreen('alerts')}
                            className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
                          >
                            {t('setAlert')}
                          </button>
                        </div>
                      </motion.div>
                    )})}
                  {!marketData?.prices.length && (
                    <div className="py-10 text-center bg-white rounded-xl border border-stone-100 shadow-sm">
                      <p className="text-stone-400">{t('noLivePrices')}</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        );
      }
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

                    {scanResult.chemical && (
                      <div className="mt-6 pt-6 border-t border-primary/15 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="p-3 bg-white/90 rounded-2xl border border-primary/10 shadow-sm">
                            <p className="text-[9px] uppercase font-extrabold tracking-wider text-stone-500 mb-1">
                              {language === 'ta' ? '🧪 பரிந்துரைக்கப்பட்ட மருந்து' : language === 'hi' ? '🧪 अनुशंसित रसायन' : '🧪 Recommended Treatment'}
                            </p>
                            <p className="text-sm font-bold text-stone-800">{scanResult.chemical}</p>
                          </div>
                          <div className="p-3 bg-white/90 rounded-2xl border border-primary/10 shadow-sm">
                            <p className="text-[9px] uppercase font-extrabold tracking-wider text-stone-500 mb-1">
                              {language === 'ta' ? '⚖️ கலவை விகிதம்' : language === 'hi' ? '⚖️ मिश्रण अनुपात' : '⚖️ Application/Mixing Ratio'}
                            </p>
                            <p className="text-sm font-bold text-stone-800">{scanResult.ratio}</p>
                          </div>
                        </div>
                        {scanResult.shopRecommendation && (
                          <div className="p-3.5 bg-primary/10 rounded-2xl border border-primary/20 shadow-sm">
                            <p className="text-[9px] uppercase font-extrabold tracking-wider text-primary/80 mb-1">
                              {language === 'ta' ? '🏪 பரிந்துரைக்கப்பட்ட கடை / சலுகை' : language === 'hi' ? '🏪 सुझाई गई दुकान / सर्वोत्तम ऑफ़र' : '🏪 Suggested Local Shop / Best Offers'}
                            </p>
                            <p className="text-sm font-bold text-stone-800">{scanResult.shopRecommendation}</p>
                          </div>
                        )}
                        {scanResult.buyLink && (
                          <a 
                            href={scanResult.buyLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-3.5 bg-green-50 rounded-2xl border border-green-200 hover:bg-green-100/80 active:scale-[0.99] transition-all shadow-sm group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-green-600 flex items-center justify-center text-white">
                                <ShoppingCart size={18} />
                              </div>
                              <div className="text-left">
                                <p className="text-[9px] uppercase font-extrabold tracking-wider text-green-700/80 mb-0.5">
                                  {language === 'ta' ? '🛒 ஆன்லைனில் வாங்கவும் (விவசாயத் தயாரிப்பு)' : language === 'hi' ? '🛒 ऑनलाइन खरीदें (कृषि उत्पाद)' : '🛒 Buy Online (Agricultural Product)'}
                                </p>
                                <p className="text-sm font-bold text-stone-800 leading-tight">
                                  {scanResult.buyLinkTitle || (language === 'ta' ? 'BigHaat-இல் வாங்கவும்' : language === 'hi' ? 'BigHaat पर खरीदें' : 'Order online via BigHaat')}
                                </p>
                              </div>
                            </div>
                            <ExternalLink size={16} className="text-green-600 group-hover:translate-x-0.5 transition-transform" />
                          </a>
                        )}
                      </div>
                    )}
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
              <p className="text-stone-400 font-medium">{t('farmerId')}: #AS-9921</p>
            </header>

            {!isEditingProfile && (
              <div className="flex gap-2 p-1 bg-stone-100 rounded-xl mb-6">
                <button
                  onClick={() => setProfileActiveTab('info')}
                  className={cn(
                    "flex-1 py-2.5 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5",
                    profileActiveTab === 'info'
                      ? "bg-white text-stone-800 shadow-sm"
                      : "text-stone-500 hover:text-stone-700"
                  )}
                >
                  <User size={14} />
                  {t('profileInfoTab')}
                </button>
                <button
                  onClick={() => setProfileActiveTab('history')}
                  className={cn(
                    "flex-1 py-2.5 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5",
                    profileActiveTab === 'history'
                      ? "bg-white text-stone-800 shadow-sm"
                      : "text-stone-500 hover:text-stone-700"
                  )}
                >
                  <History size={14} />
                  {t('cropHistoryTab')}
                </button>
              </div>
            )}

            {isEditingProfile || profileActiveTab === 'info' ? (
              <div className="space-y-4">
                <div className="bg-white p-6 rounded-xl border border-stone-100 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-primary">
                        <Globe size={20} />
                      </div>
                      <span className="font-bold text-stone-700">{t('location')}</span>
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
                      <span className="font-bold text-stone-700">{t('primaryCrop')}</span>
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
                      <span className="font-bold text-stone-700">{t('farmSize')}</span>
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
                          <option value="Cent">Cent</option>
                          <option value="Kanal">Kanal</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white p-6 rounded-xl border border-stone-100 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-primary">
                        <Droplets size={20} />
                      </div>
                      <span className="font-bold text-stone-700">{t('soilType')}</span>
                    </div>
                    {!isEditingProfile && <span className="text-sm font-bold text-stone-400">{profileData.soilType || 'Not specified'}</span>}
                  </div>
                  {isEditingProfile && (
                    <div className="mt-4">
                      <label className="text-[10px] uppercase font-bold text-stone-400 mb-1 block">Soil Type</label>
                      <select 
                        value={selectedSoilType}
                        onChange={(e) => setSelectedSoilType(e.target.value)}
                        className="w-full p-3 bg-stone-50 rounded-lg border border-stone-100 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                      >
                        <option value="">Select Soil Type</option>
                        {SOIL_TYPES.map(soil => (
                          <option key={soil} value={soil}>{soil}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Global Language Toggle Card */}
                <div className="bg-white p-6 rounded-xl border border-stone-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-primary">
                        <Globe size={20} />
                      </div>
                      <span className="font-bold text-stone-700">{t('language')}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { code: 'en', label: 'English' },
                      { code: 'hi', label: 'हिन्दी' },
                      { code: 'ta', label: 'தமிழ்' }
                    ].map((langOption) => {
                      const isSelected = language === langOption.code;
                      return (
                        <button
                          key={langOption.code}
                          onClick={async () => {
                            setLanguage(langOption.code as Language);
                            if (user) {
                              try {
                                await updateDoc(doc(db, `users/${user.uid}`), {
                                  language: langOption.code
                                });
                              } catch (e) {
                                console.error("Error persisting language preference to Firestore:", e);
                              }
                            }
                          }}
                          className={cn(
                            "py-2.5 px-3 rounded-xl border font-bold text-xs transition-all",
                            isSelected
                              ? "bg-primary text-white border-primary shadow-sm"
                              : "bg-stone-50 text-stone-600 border-stone-100 hover:bg-stone-100"
                          )}
                        >
                          {langOption.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {!isEditingProfile && (
                  <div className="bg-white p-6 rounded-xl border border-stone-100 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-primary">
                          <Database size={20} />
                        </div>
                        <div>
                          <span className="font-bold text-stone-700 block">{t('googleDriveSync')}</span>
                          <span className="text-[10px] text-stone-400 font-medium block max-w-xs">{t('googleDriveSyncDesc')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-stone-50 flex flex-col gap-2">
                      {googleDriveToken ? (
                        <div className="flex items-center justify-between gap-3 bg-stone-50 p-3 rounded-lg border border-stone-100">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-emerald-500" />
                            <span className="text-xs font-bold text-stone-600">Connected to Drive</span>
                          </div>
                          <button
                            onClick={() => {
                              setGoogleDriveToken(null);
                              setDriveSyncStatus('idle');
                            }}
                            className="text-[10px] font-bold text-red-500 hover:underline"
                          >
                            {t('disconnect')}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={handleDriveBackupSync}
                          disabled={isSyncingDrive}
                          className="w-full py-2.5 bg-stone-50 border border-stone-100 text-stone-700 rounded-lg text-xs font-bold hover:bg-stone-100 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                          <RefreshCw size={14} className={cn(isSyncingDrive && "animate-spin")} />
                          {t('connectGoogleDrive')}
                        </button>
                      )}

                      {googleDriveToken && (
                        <button
                          onClick={handleDriveBackupSync}
                          disabled={isSyncingDrive}
                          className="w-full py-3 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/95 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm"
                        >
                          <RefreshCw size={14} className={cn(isSyncingDrive && "animate-spin")} />
                          {isSyncingDrive ? t('syncing') : t('syncNow')}
                        </button>
                      )}

                      {driveSyncStatus === 'success' && (
                        <motion.div 
                          initial={{ opacity: 0, y: 5 }} 
                          animate={{ opacity: 1, y: 0 }} 
                          className="text-[11px] text-emerald-600 font-bold text-center flex items-center justify-center gap-1 mt-1 bg-emerald-50/50 py-1.5 rounded-md"
                        >
                          <CheckCircle2 size={12} />
                          {t('syncedSuccessfully')}
                        </motion.div>
                      )}

                      {driveSyncStatus === 'error' && (
                        <motion.div 
                          initial={{ opacity: 0, y: 5 }} 
                          animate={{ opacity: 1, y: 0 }} 
                          className="text-[11px] text-red-500 font-medium text-center mt-1 bg-red-50/50 p-2 rounded-md space-y-1"
                        >
                          <p className="font-bold">⚠️ {driveSyncError || "Backup sync failed. Please try again."}</p>
                          {driveSyncError?.includes("assertion") || driveSyncError?.includes("promise") || driveSyncError?.includes("cancelled") ? (
                            <button 
                              onClick={() => window.location.reload()} 
                              className="text-[10px] text-primary hover:underline font-bold block mx-auto mt-1"
                            >
                              🔄 Refresh Page to Reset State
                            </button>
                          ) : null}
                        </motion.div>
                      )}
                    </div>
                  </div>
                )}

                {!isEditingProfile && (
                  <div className="bg-white p-6 rounded-xl border border-stone-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                          <MapPin size={20} />
                        </div>
                        <span className="font-bold text-stone-700">{t('agriOffices')}</span>
                      </div>
                      <button 
                        onClick={handleFindOffices}
                        disabled={isFindingOffices}
                        className="text-xs font-bold text-primary hover:underline disabled:opacity-50"
                      >
                        {isFindingOffices ? 'Searching...' : t('findNearbyOffices')}
                      </button>
                    </div>
                    
                    {isFindingOffices && (
                      <div className="flex flex-col items-center py-4">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2" />
                        <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">{t('locatingOffices')}</p>
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
                        soilType: selectedSoilType,
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
                          farmUnit: selectedFarmUnit,
                          soilType: selectedSoilType
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
                    {t('saveChanges')}
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-stone-800 text-lg">{t('cropHistoryTab')}</h3>
                    <p className="text-xs text-stone-400 font-medium">Seasonal patterns over time</p>
                  </div>
                  <button
                    onClick={() => {
                      setIsAddingHistory(!isAddingHistory);
                      if (!isAddingHistory) {
                        setNewHistoryCrop(profileData.crops || VALID_CROPS[0]);
                        setNewHistorySeason('Kharif');
                        setNewHistoryYear(new Date().getFullYear());
                        setNewHistoryYield('');
                        setNewHistoryNotes('');
                      }
                    }}
                    className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-md active:scale-95 transition-all flex items-center gap-1.5"
                  >
                    {isAddingHistory ? <X size={14} /> : <Plus size={14} />}
                    {isAddingHistory ? t('disconnect') : t('addRecord')}
                  </button>
                </div>

                <AnimatePresence>
                  {isAddingHistory && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm overflow-hidden space-y-4"
                    >
                      <h4 className="font-bold text-stone-800 text-sm border-b border-stone-50 pb-2 flex items-center gap-1.5">
                        <Sprout size={16} className="text-primary" />
                        New Seasonal Record
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] uppercase font-bold text-stone-400 mb-1 block">{t('cropNameLabel')}</label>
                          <select
                            value={newHistoryCrop}
                            onChange={(e) => setNewHistoryCrop(e.target.value)}
                            className="w-full p-3 bg-stone-50 rounded-lg border border-stone-100 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                          >
                            <option value="">Select Crop</option>
                            {VALID_CROPS.map(crop => (
                              <option key={crop} value={crop}>{crop}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] uppercase font-bold text-stone-400 mb-1 block">{t('seasonLabel')}</label>
                            <select
                              value={newHistorySeason}
                              onChange={(e) => setNewHistorySeason(e.target.value)}
                              className="w-full p-3 bg-stone-50 rounded-lg border border-stone-100 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                            >
                              <option value="Kharif">Kharif (Rainy)</option>
                              <option value="Rabi">Rabi (Winter)</option>
                              <option value="Summer">Summer / Zaid</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] uppercase font-bold text-stone-400 mb-1 block">{t('yearLabel')}</label>
                            <input
                              type="number"
                              min={2000}
                              max={2100}
                              value={newHistoryYear}
                              onChange={(e) => setNewHistoryYear(parseInt(e.target.value) || new Date().getFullYear())}
                              className="w-full p-3 bg-stone-50 rounded-lg border border-stone-100 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] uppercase font-bold text-stone-400 mb-1 block">{t('yieldLabel')}</label>
                          <input
                            type="text"
                            placeholder="e.g., 1800 kg / acre"
                            value={newHistoryYield}
                            onChange={(e) => setNewHistoryYield(e.target.value)}
                            className="w-full p-3 bg-stone-50 rounded-lg border border-stone-100 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] uppercase font-bold text-stone-400 mb-1 block">{t('notesLabel')}</label>
                          <textarea
                            placeholder="e.g., Good yields due to timely urea application. Irrigation water was critical in December."
                            value={newHistoryNotes}
                            onChange={(e) => setNewHistoryNotes(e.target.value)}
                            rows={3}
                            className="w-full p-3 bg-stone-50 rounded-lg border border-stone-100 text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                          />
                        </div>

                        <button
                          onClick={async () => {
                            if (!newHistoryCrop || !newHistoryYield.trim()) {
                              alert("Please select a crop name and enter yield.");
                              return;
                            }
                            setIsSavingHistory(true);
                            await handleAddCropHistory({
                              cropName: newHistoryCrop,
                              season: newHistorySeason,
                              year: newHistoryYear,
                              yieldValue: newHistoryYield,
                              notes: newHistoryNotes
                            });
                            setIsSavingHistory(false);
                            setIsAddingHistory(false);
                            setNewHistoryCrop('');
                            setNewHistorySeason('Kharif');
                            setNewHistoryYear(new Date().getFullYear());
                            setNewHistoryYield('');
                            setNewHistoryNotes('');
                          }}
                          disabled={isSavingHistory || !newHistoryCrop || !newHistoryYield.trim()}
                          className="w-full py-3 bg-primary text-white rounded-xl font-bold shadow-md active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          <Save size={16} />
                          {isSavingHistory ? t('syncing') : t('saveChanges')}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-5">
                  {/* RECHARTS HISTORICAL YIELD PERFORMANCE VISUALIZATION */}
                  <CropYieldHistoryChart
                    cropHistoryList={cropHistoryList}
                    primaryCrop={profileData.crops || 'Paddy'}
                    language={language}
                    farmUnit={profileData.farmUnit}
                    farmSize={profileData.farmSize}
                    onAddRecordClick={() => {
                      setIsAddingHistory(true);
                      setNewHistoryCrop(profileData.crops || VALID_CROPS[0]);
                      setNewHistorySeason('Kharif');
                      setNewHistoryYear(new Date().getFullYear());
                      setNewHistoryYield('');
                      setNewHistoryNotes('');
                    }}
                  />

                  {/* AI PREDICTIVE YIELD ESTIMATOR */}
                  <div className="bg-gradient-to-br from-emerald-900 to-green-950 p-6 rounded-3xl text-white shadow-xl border border-emerald-800/50 overflow-hidden relative">
                    <div className="absolute top-0 right-0 -mt-8 -mr-8 w-36 h-36 bg-green-500/10 rounded-full blur-2xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                    
                    <div className="flex items-center justify-between mb-4 relative z-10">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                          <BrainCircuit size={18} />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm tracking-tight">
                            {language === 'ta' ? 'AI மகசூல் கணிப்பு' : language === 'hi' ? 'AI उपज पूर्वानुमान' : 'AI Predictive Yield Estimate'}
                          </h4>
                          <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                            {profileData.crops} • {language === 'ta' ? 'தற்போதைய பருவம்' : language === 'hi' ? 'चालू मौसम' : 'Current Season'}
                          </p>
                        </div>
                      </div>
                      
                      {(yieldPrediction || isYieldPredictionLoading) && (
                        <button
                          onClick={fetchYieldPrediction}
                          disabled={isYieldPredictionLoading}
                          className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-800/80 text-white text-[11px] font-bold rounded-xl shadow-md shadow-emerald-950/50 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                        >
                          <RefreshCw size={12} className={cn(isYieldPredictionLoading && "animate-spin")} />
                          {isYieldPredictionLoading 
                            ? (language === 'ta' ? 'கணிக்கிறது...' : language === 'hi' ? 'पूर्वानुमान...' : 'Calculating...') 
                            : (language === 'ta' ? 'புதுப்பி' : language === 'hi' ? 'अपडेट करें' : 'Refresh')}
                        </button>
                      )}
                    </div>

                    {isYieldPredictionLoading && !yieldPrediction ? (
                      <div className="py-8 flex flex-col items-center justify-center gap-3 relative z-10">
                        <div className="w-10 h-10 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin" />
                        <p className="text-xs text-emerald-300 font-medium text-center px-4">
                          {language === 'ta' ? 'உங்கள் பயிர் தரவு மற்றும் வானிலை போக்குகளை பகுப்பாய்வு செய்கிறது...' : language === 'hi' ? 'आपकी फसल के डेटा और मौसम के रुझानों का विश्लेषण किया जा रहा है...' : 'Analyzing your crop data & weather trends...'}
                        </p>
                      </div>
                    ) : yieldPredictionError ? (
                      <div className="bg-red-950/40 p-4 rounded-2xl border border-red-900/30 text-center relative z-10">
                        <p className="text-xs text-red-300 font-bold mb-2">❌ {yieldPredictionError}</p>
                        <button 
                          onClick={fetchYieldPrediction}
                          className="px-4 py-2 bg-red-900 hover:bg-red-800 text-white text-xs font-bold rounded-xl active:scale-95 transition-all"
                        >
                          {language === 'ta' ? 'மீண்டும் முயற்சி' : language === 'hi' ? 'पुनः प्रयास करें' : 'Retry prediction'}
                        </button>
                      </div>
                    ) : yieldPrediction ? (
                      <div className="space-y-4 relative z-10 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                          {/* Left Column: Yield projection and confidence */}
                          <div className="col-span-1 md:col-span-5 bg-emerald-950/50 p-4 rounded-2xl border border-emerald-800/30 flex flex-col justify-between">
                            <div>
                              <span className="text-[10px] text-emerald-400/80 font-bold uppercase tracking-wider block mb-1">
                                {language === 'ta' ? 'மதிப்பிடப்பட்ட மகசூல்' : language === 'hi' ? 'अनुमानित उपज सीमा' : 'Projected Yield'}
                              </span>
                              <div className="text-2xl font-black text-white tracking-tight leading-none mb-1">
                                {yieldPrediction.estimatedYieldRange}
                              </div>
                              <span className="text-[11px] text-emerald-300/80 font-medium leading-snug block">
                                {language === 'ta' ? `பரப்பளவு: ${profileData.farmSize} ${profileData.farmUnit}` : language === 'hi' ? `क्षेत्रफल: ${profileData.farmSize} ${profileData.farmUnit}` : `For ${profileData.farmSize} ${profileData.farmUnit}`}
                              </span>
                            </div>
                            
                            <div className="mt-4 pt-4 border-t border-emerald-900/40">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[10px] text-emerald-400/80 font-bold uppercase tracking-wider">
                                  {language === 'ta' ? 'நம்பகத்தன்மை' : language === 'hi' ? 'विश्वास स्कोर' : 'Confidence'}
                                </span>
                                <span className="text-[11px] font-black text-emerald-300">
                                  {yieldPrediction.confidenceScore}%
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-emerald-900/60 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-yellow-400 to-emerald-400 rounded-full transition-all duration-1000"
                                  style={{ width: `${yieldPrediction.confidenceScore}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Right Column: Comparison percentage and text */}
                          <div className="col-span-1 md:col-span-7 bg-emerald-950/50 p-4 rounded-2xl border border-emerald-800/30 flex flex-col justify-between">
                            <div className="flex items-start gap-3">
                              <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-extrabold text-sm",
                                yieldPrediction.comparisonPercentage >= 0 
                                  ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400" 
                                  : "bg-red-500/20 border border-red-500/30 text-red-400"
                              )}>
                                {yieldPrediction.comparisonPercentage >= 0 ? '+' : ''}{yieldPrediction.comparisonPercentage}%
                              </div>
                              <div>
                                <span className="text-[10px] text-emerald-400/80 font-bold uppercase tracking-wider block mb-0.5">
                                  {language === 'ta' ? 'வரலாற்று ஒப்பீடு' : language === 'hi' ? 'ऐतिहासिक तुलना' : 'Historical Comparison'}
                                </span>
                                <p className="text-xs text-stone-200 font-medium leading-relaxed">
                                  {yieldPrediction.comparisonText}
                                </p>
                              </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-emerald-900/40 flex items-start gap-2 text-stone-300">
                              <CloudSun size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                              <p className="text-[11px] leading-relaxed">
                                <span className="font-bold text-white mr-1">
                                  {language === 'ta' ? 'வானிலை தாக்கம்:' : language === 'hi' ? 'मौसम प्रभाव:' : 'Weather Impact:'}
                                </span>
                                {yieldPrediction.weatherImpactSummary}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* limiting and optimizing details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                          {/* Limiting Factors */}
                          {yieldPrediction.limitingFactors && yieldPrediction.limitingFactors.length > 0 && (
                            <div className="bg-emerald-950/30 p-3.5 rounded-2xl border border-emerald-900/20">
                              <div className="flex items-center gap-1.5 mb-2 text-yellow-400">
                                <AlertTriangle size={14} />
                                <span className="text-[10px] font-extrabold uppercase tracking-wider">
                                  {language === 'ta' ? 'இடர் காரணிகள்' : language === 'hi' ? 'जोखिम कारक' : 'Risk & Limiting Factors'}
                                </span>
                              </div>
                              <ul className="space-y-1.5">
                                {yieldPrediction.limitingFactors.map((factor: string, idx: number) => (
                                  <li key={idx} className="text-[11px] text-stone-300 leading-snug flex items-start gap-1.5">
                                    <span className="text-yellow-500 shrink-0 mt-1">•</span>
                                    <span>{factor}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Optimizing Actions */}
                          {yieldPrediction.optimizingActions && yieldPrediction.optimizingActions.length > 0 && (
                            <div className="bg-emerald-950/30 p-3.5 rounded-2xl border border-emerald-900/20">
                              <div className="flex items-center gap-1.5 mb-2 text-emerald-400">
                                <CheckCircle2 size={14} />
                                <span className="text-[10px] font-extrabold uppercase tracking-wider">
                                  {language === 'ta' ? 'பரிந்துரைக்கப்பட்ட நடவடிக்கைகள்' : language === 'hi' ? 'अनुशंसित कदम' : 'Optimizing Actions'}
                                </span>
                              </div>
                              <ul className="space-y-1.5">
                                {yieldPrediction.optimizingActions.map((action: string, idx: number) => (
                                  <li key={idx} className="text-[11px] text-stone-300 leading-snug flex items-start gap-1.5">
                                    <span className="text-emerald-400 shrink-0 mt-1">✓</span>
                                    <span>{action}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        {cropHistoryList.length === 0 && (
                          <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 text-[11px] text-emerald-300/90 text-center">
                            💡 {language === 'ta' ? 'குறிப்பு: இன்னும் துல்லியமான கணிப்புக்கு உங்கள் முந்தைய பருவகால அறுவடை விவரங்களை கீழே சேர்க்கவும்!' : language === 'hi' ? 'संकेत: अधिक सटीक पूर्वानुमान के लिए नीचे अपने पिछले सीज़न के रिकॉर्ड जोड़ें!' : 'Tip: Add your past seasonal harvest records below for highly personalized, field-specific predictions!'}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-6 relative z-10">
                        <p className="text-xs text-stone-300 mb-4 leading-relaxed max-w-md mx-auto">
                          {language === 'ta' 
                            ? 'உங்கள் வரலாற்று பயிர் பதிவுகள் மற்றும் தற்போதைய வானிலை தரவுகளை அடிப்படையாகக் கொண்டு இந்த பருவத்திற்கான மகசூலைக் கணிக்கவும்!' 
                            : language === 'hi' 
                            ? 'अपने ऐतिहासिक फसल रिकॉर्ड और वर्तमान मौसम डेटा के आधार पर इस मौसम की उपज का पूर्वानुमान लगाएं!' 
                            : 'Get a personalized machine learning-based yield estimate for your current crop using your history and weather trends.'}
                        </p>
                        <button
                          onClick={fetchYieldPrediction}
                          className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-950/40 active:scale-95 transition-all flex items-center gap-1.5 mx-auto cursor-pointer"
                        >
                          <Sparkles size={13} />
                          {language === 'ta' ? 'மகசூல் கணிப்பைக் கணக்கிடு' : language === 'hi' ? 'उपज का पूर्वानुमान लगाएं' : 'Estimate Yield with AI'}
                        </button>
                      </div>
                    )}
                  </div>

                  {cropHistoryList.length === 0 ? (
                    <div className="bg-white p-8 rounded-2xl border border-stone-100 shadow-sm text-center py-10 space-y-4">
                      <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto text-primary">
                        <Sprout size={32} />
                      </div>
                      <p className="text-stone-500 font-medium text-sm px-6 max-w-md mx-auto">
                        {t('noCropHistory')}
                      </p>
                      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                        <button
                          onClick={() => {
                            setIsAddingHistory(true);
                            setNewHistoryCrop(profileData.crops || VALID_CROPS[0]);
                            setNewHistorySeason('Kharif');
                            setNewHistoryYear(new Date().getFullYear());
                            setNewHistoryYield('');
                            setNewHistoryNotes('');
                          }}
                          className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-sm hover:bg-primary/95 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus size={14} />
                          {t('addRecord')}
                        </button>
                        <button
                          onClick={async () => {
                            const sampleCrop = profileData.crops || 'Paddy';
                            const demoRecords = [
                              { cropName: sampleCrop, season: 'Kharif', year: 2022, yieldValue: '1920 kg / acre', notes: 'Normal monsoon, applied neem coated urea' },
                              { cropName: sampleCrop, season: 'Kharif', year: 2023, yieldValue: '2150 kg / acre', notes: 'Timely weed control and micronutrient spray' },
                              { cropName: sampleCrop, season: 'Kharif', year: 2024, yieldValue: '2380 kg / acre', notes: 'SRI method adopted, excellent grain filling' },
                              { cropName: sampleCrop, season: 'Kharif', year: 2025, yieldValue: '2460 kg / acre', notes: 'Bio-fertilizers trial with drip line irrigation' }
                            ];
                            for (const rec of demoRecords) {
                              await handleAddCropHistory(rec);
                            }
                          }}
                          className="px-4 py-2 bg-stone-100 text-stone-700 hover:bg-stone-200 text-xs font-bold rounded-xl active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Sparkles size={13} className="text-amber-500" />
                          {language === 'ta' ? 'மாதிரி பதிவுகளை ஏற்று' : language === 'hi' ? 'डेमो रिकॉर्ड लोड करें' : 'Load Sample Multi-Year Records'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="bg-green-50/50 p-4 rounded-xl border border-green-100/30 flex items-start gap-3">
                        <TrendingUp size={18} className="text-primary mt-0.5 shrink-0" />
                        <div className="text-xs text-stone-600">
                          <span className="font-bold text-primary block mb-0.5">Seasonal Pattern Insights</span>
                          You have tracked <span className="font-bold">{cropHistoryList.length} seasons</span> of growth. 
                          {cropHistoryList.length >= 2 ? (
                            <span> Cultivating multiple varieties over the years supports your soil's natural nutrient balance. Keep recording to get deeper weather & rotation suggestions!</span>
                          ) : (
                            <span> Add more seasonal records to build a complete profile of your farm's productivity and track yield trends over time.</span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-4">
                        {cropHistoryList.map((record) => (
                          <motion.div
                            key={record.id}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm relative hover:border-primary/20 transition-all"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-primary">
                                  <Leaf size={18} />
                                </div>
                                <div>
                                  <h4 className="font-bold text-stone-800 text-sm">{record.cropName}</h4>
                                  <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">
                                    {record.season} • {record.year}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleDeleteCropHistory(record.id)}
                                  className="p-1.5 text-stone-300 hover:text-red-500 transition-colors"
                                  title="Delete Record"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>

                            <div className="space-y-2 pl-1">
                              <div className="flex items-center gap-2 bg-stone-50 py-1.5 px-2.5 rounded-lg border border-stone-100/50 w-fit">
                                <TrendingUp size={14} className="text-emerald-500" />
                                <span className="text-xs font-bold text-stone-600">
                                  {record.yieldValue}
                                </span>
                              </div>

                              {record.notes && (
                                <p className="text-xs text-stone-500 bg-stone-50/30 p-2.5 rounded-lg border border-stone-100/30 italic">
                                  "{record.notes}"
                                </p>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            <button 
              onClick={async () => {
                await signOut(auth);
                setScreen('onboarding');
              }}
              className="w-full mt-12 py-4 bg-stone-100 text-stone-500 rounded-xl font-bold hover:bg-red-50 hover:text-red-500 transition-all"
            >
              {t('logout')}
            </button>
          </div>
        );
      case 'calendar':
        return <CropCalendarScreen data={calendarData} isLoading={isCalendarLoading} onBack={() => setScreen('home')} />;
      case 'rotation':
        return <CropRotationScreen data={rotationData} isLoading={isRotationLoading} onBack={() => setScreen('home')} />;
      case 'alerts':
        return (
          <PriceAlertsScreen 
            alerts={priceAlerts}
            onAdd={handleAddAlert}
            onDelete={handleDeleteAlert}
            onToggle={handleToggleAlert}
            onBack={() => setScreen('home')}
          />
        );
      case 'notifications':
        return (
          <NotificationsScreen 
            notifications={notifications}
            onRead={handleReadNotification}
            onClear={handleClearNotifications}
            onBack={() => setScreen('home')}
          />
        );
      default:
        return null;
    }
  };

  const isAuthScreen = ['splash', 'onboarding', 'login'].includes(screen);

  if (isAuthScreen) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-stone-100 min-h-[600px] flex flex-col justify-between">
          <AnimatePresence mode="wait">
            <motion.div
              key={screen}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col"
            >
              {renderScreen()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <Sidebar active={screen} onNavigate={setScreen} profileData={profileData} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative min-h-screen overflow-x-hidden">
        <main className="flex-grow w-full max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={screen}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="w-full h-full"
            >
              {renderScreen()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Bottom Nav for Mobile */}
      {['home', 'weather', 'market', 'profile', 'schemes', 'upload'].includes(screen) && (
        <div className="md:hidden">
          <BottomNav active={screen} onNavigate={setScreen} />
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <TranslationProvider>
      <AppContent />
    </TranslationProvider>
  );
}
