import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language } from './types';

export const translations = {
  en: {
    // Navigation
    home: "Home",
    weather: "Weather",
    askAI: "Ask AI",
    market: "Market",
    profile: "Profile",

    // Home Screen
    appTitle: "AgriSeva AI",
    currentWeather: "Current Weather",
    weatherAdvice: "Weather Advice",
    quickActions: "Quick Actions",
    askAIAdvice: "Ask AI Advice",
    scanCrop: "Scan Crop",
    marketPrices: "Market Prices",
    govtSchemes: "Govt Schemes",
    cropCalendar: "Crop Calendar",
    cropRotation: "Crop Rotation",
    priceAlerts: "Price Alerts",
    farmingTips: "Farming Tips",
    exportReport: "Export Report",
    exporting: "Exporting...",
    googleDriveSync: "Google Drive Sync",
    googleDriveSyncDesc: "Back up your profile, alerts, and farming notifications safely to your private Google Drive.",
    syncNow: "Sync Now",
    syncing: "Syncing...",
    syncedSuccessfully: "Backup synced successfully!",
    connectGoogleDrive: "Connect Google Drive",
    disconnect: "Disconnect",
    aiWeatherExpert: "AI Weather Expert",
    irrigationAlert: "Irrigation Alert",
    irrigationTip: "High evaporation expected today. Water your paddy fields before 9 AM.",
    fetchingWeather: "Fetching weather...",
    noWeatherAvailable: "No weather data available",
    selectLocationAdvice: "Select a location to get personalized weather advice.",

    // Weather Screen
    weatherTitle: "Weather Info",
    humidity: "Humidity",
    wind: "Wind",
    uvIndex: "UV Index",
    forecast: "Forecast",
    hourly: "Hourly",
    weatherSimulation: "Weather Alert Simulation",
    weatherSimulationDesc: "Test the automated check in the weather service by simulating extreme weather conditions. This triggers an instant alert notification.",
    simulateHeatwave: "Simulate Heatwave (42°C)",
    simulateStorm: "Simulate Storm (52 km/h)",
    sevenDayForecast: "7-Day Forecast",
    high: "High",
    low: "Low",

    // Market Screen
    priceTrends: "Price Trends",
    liveMandiPrices: "Live Mandi Prices",
    setAlert: "Set Alert",
    noLivePrices: "No live prices found for your crops in this location.",
    historicalDataNote: "Historical data for the last 6 months in your region",
    fetchingLivePrices: "Fetching live prices...",

    // Scan Crop Screen
    analyzingCrop: "Analyzing Crop...",
    geminiVisionProcessing: "Gemini Vision AI is processing your image",
    detectedCrop: "Detected Crop",
    healthStatus: "Health Status",
    consultAIExpert: "Consult AI Expert",
    retake: "Retake",
    tapOrDragImage: "Tap or Drag image here",
    pointCamera: "Point your camera or drop a photo of the affected area",
    startNewScan: "Start New Scan",
    recentScans: "Recent Scans",
    infectionDetected: "Infection Detected",

    // Govt Schemes Screen
    schemesHeader: "Government Schemes Portal",
    searchSchemes: "Search schemes by title, crop or benefit...",
    checkEligibility: "Check Eligibility",
    eligibilityResult: "Eligibility Result",
    checkingEligibility: "Checking eligibility...",
    applyOnPortal: "Apply on Official Portal",
    officialPortal: "Official Portal",
    eligible: "Eligible for You",
    likelyEligible: "Likely Eligible",
    agentAssessment: "Automated Agent Audit",
    agentAuditCompleted: "AgriSeva Schemes Agent has automatically verified your eligibility based on your farmer profile.",
    directApplyPortal: "Direct Portal Application",
    requiredDocs: "Key Required Documents",
    keyHighlights: "Key Scheme Benefits",
    allSchemes: "All Schemes",
    eligibleSchemesOnly: "Eligible Only",
    directPortalLinkNotice: "Opens official Government of India / State portal in a secure new tab.",
    detailedAnalysis: "Detailed AI Analysis",
    hideAnalysis: "Hide Detailed Analysis",
    helpline: "Official Helpline",

    // Profile Screen
    profileSettings: "Profile Settings",
    farmerId: "Farmer ID",
    location: "Location",
    primaryCrop: "Primary Crop",
    farmSize: "Farm Size",
    soilType: "Soil Type",
    agriOffices: "Agri Offices",
    language: "Language",
    logout: "Logout",
    saveChanges: "Save Changes",
    findNearbyOffices: "Find Nearby",
    locatingOffices: "Locating Offices...",
    cropHistoryTab: "Crop History",
    profileInfoTab: "Profile Info",
    addRecord: "Add Seasonal Record",
    noCropHistory: "No crop history recorded yet. Add your first crop history below!",
    cropNameLabel: "Crop Name",
    seasonLabel: "Season",
    yearLabel: "Year",
    yieldLabel: "Yield achieved (e.g., 1500 kg)",
    notesLabel: "Seasonal Notes / learnings",

    // Price Alerts Screen
    setNewAlert: "Set New Alert",
    createAlert: "Create Alert",
    dropsBelow: "Drops below",
    risesAbove: "Rises above",
    priceDropsBelow: "Price Drops Below",
    priceRisesAbove: "Price Rises Above",
    noAlertsSet: "No price alerts set yet.",
    crop: "Crop",
    targetPrice: "Target Price (₹ / kg)",
    condition: "Condition",

    // Crop Calendar Screen
    generatingCalendar: "Generating your calendar...",
    timelineMonth: "Month",
    noCalendar: "Unable to load crop calendar. Please try again.",

    // Crop Rotation Screen
    rotationSuggestions: "Crop Rotation Suggestions",
    soilTypeLabel: "Soil Type",
    benefits: "Benefits",
    risks: "Risks",
    reasoning: "Reasoning",
    generatingSuggestions: "Generating suggestions...",
    noRotation: "Unable to load rotation suggestions. Please try again.",

    // Notifications Screen
    notificationsTitle: "Notifications",
    clearAll: "Clear All",
    noNewNotifications: "No new notifications.",

    // Chat Screen
    chatHeader: "AgriSeva AI Expert",
    agentStatus: "Multi-Agent System Active",
    howCanIHelp: "How can I help you today?",
    howCanIHelpDesc: "Ask about crop health, weather, market prices, or government schemes.",
    listening: "Listening...",
    askQuestionPlaceholder: "Ask about farming, crop, pests...",
  },
  hi: {
    // Navigation
    home: "होम",
    weather: "मौसम",
    askAI: "एआई से पूछें",
    market: "बाज़ार",
    profile: "प्रोफ़ाइल",

    // Home Screen
    appTitle: "कृषिसेवा एआई",
    currentWeather: "वर्तमान मौसम",
    weatherAdvice: "मौसम सलाह",
    quickActions: "त्वरित कार्रवाई",
    askAIAdvice: "एआई सलाह लें",
    scanCrop: "फसल स्कैन करें",
    marketPrices: "बाज़ार भाव",
    govtSchemes: "सरकारी योजनाएं",
    cropCalendar: "फसल कैलेंडर",
    cropRotation: "फसल चक्र",
    priceAlerts: "मूल्य अलर्ट",
    farmingTips: "खेती के सुझाव",
    exportReport: "रिपोर्ट निर्यात करें",
    exporting: "निर्यात किया जा रहा है...",
    googleDriveSync: "गूगल ड्राइव सिंक",
    googleDriveSyncDesc: "अपने प्रोफाइल, अलर्ट और कृषि सूचनाओं को अपने निजी गूगल ड्राइव में सुरक्षित रूप से बैकअप लें।",
    syncNow: "अभी सिंक करें",
    syncing: "सिंक हो रहा है...",
    syncedSuccessfully: "बैकअप सफलतापूर्वक सिंक हो गया!",
    connectGoogleDrive: "गूगल ड्राइव कनेक्ट करें",
    disconnect: "डिस्कनेक्ट करें",
    aiWeatherExpert: "एआई मौसम विशेषज्ञ",
    irrigationAlert: "सिंचाई अलर्ट",
    irrigationTip: "आज अधिक वाष्पीकरण की उम्मीद है। सुबह 9 बजे से पहले अपने धान के खेतों में पानी डालें।",
    fetchingWeather: "मौसम की जानकारी प्राप्त की जा रही है...",
    noWeatherAvailable: "मौसम का कोई डेटा उपलब्ध नहीं है",
    selectLocationAdvice: "व्यक्तिगत मौसम सलाह प्राप्त करने के लिए एक स्थान चुनें।",

    // Weather Screen
    weatherTitle: "मौसम की जानकारी",
    humidity: "आर्द्रता",
    wind: "हवा",
    uvIndex: "यूवी सूचकांक",
    forecast: "पूर्वानुमान",
    hourly: "प्रति घंटा",
    weatherSimulation: "मौसम चेतावनी सिमुलेशन",
    weatherSimulationDesc: "अत्यधिक मौसम स्थितियों का अनुकरण करके मौसम सेवा में स्वचालित जांच का परीक्षण करें। यह एक त्वरित अलर्ट अधिसूचना को ट्रिगर करता है।",
    simulateHeatwave: "लू का अनुकरण करें (42°C)",
    simulateStorm: "तूफान का अनुकरण करें (52 किमी/घंटा)",
    sevenDayForecast: "7-दिवसीय पूर्वानुमान",
    high: "उच्च",
    low: "निम्न",

    // Market Screen
    priceTrends: "मूल्य रुझान",
    liveMandiPrices: "लाइव मंडी भाव",
    setAlert: "अलर्ट सेट करें",
    noLivePrices: "इस स्थान पर आपकी फसलों के लिए कोई लाइव भाव नहीं मिला।",
    historicalDataNote: "आपके क्षेत्र में पिछले 6 महीनों का ऐतिहासिक डेटा",
    fetchingLivePrices: "लाइव भाव प्राप्त किए जा रहे हैं...",

    // Scan Crop Screen
    analyzingCrop: "फसल का विश्लेषण किया जा रहा है...",
    geminiVisionProcessing: "जेमिनी विजन एआई आपकी छवि को संसाधित कर रहा है",
    detectedCrop: "पहचानी गई फसल",
    healthStatus: "स्वास्थ्य की स्थिति",
    consultAIExpert: "एआई विशेषज्ञ से परामर्श करें",
    retake: "पुनः लें",
    tapOrDragImage: "छवि को यहां टैप करें या खींचें",
    pointCamera: "अपना कैमरा घुमाएं या प्रभावित क्षेत्र की एक तस्वीर खींचें",
    startNewScan: "नया स्कैन शुरू करें",
    recentScans: "हाल के स्कैन",
    infectionDetected: "संक्रमण का पता चला",

    // Govt Schemes Screen
    schemesHeader: "सरकारी योजना पोर्टल",
    searchSchemes: "योजना का नाम, फसल या लाभ खोजें...",
    checkEligibility: "पात्रता जांचें",
    eligibilityResult: "पात्रता का परिणाम",
    checkingEligibility: "पात्रता जांची जा रही है...",
    applyOnPortal: "आधिकारिक पोर्टल पर आवेदन करें",
    officialPortal: "आधिकारिक पोर्टल",
    eligible: "आपके लिए पात्र",
    likelyEligible: "संभावित पात्र",
    agentAssessment: "स्वचालित एआई एजेंट ऑडिट",
    agentAuditCompleted: "एग्रीसेवा योजना एजेंट ने आपके किसान प्रोफ़ाइल के आधार पर आपकी पात्रता की स्वतः जांच कर ली है।",
    directApplyPortal: "सीधा ऑनलाइन आवेदन पोर्टल",
    requiredDocs: "प्रमुख आवश्यक दस्तावेज",
    keyHighlights: "योजना के प्रमुख लाभ",
    allSchemes: "सभी योजनाएं",
    eligibleSchemesOnly: "केवल पात्र योजनाएं",
    directPortalLinkNotice: "भारत सरकार / राज्य सरकार के आधिकारिक पोर्टल पर सुरक्षित नए टैब में खुलेगा।",
    detailedAnalysis: "विस्तृत एआई विश्लेषण",
    hideAnalysis: "विस्तृत विवरण छिपाएं",
    helpline: "आधिकारिक हेल्पलाइन",

    // Profile Screen
    profileSettings: "प्रोफ़ाइल सेटिंग्स",
    farmerId: "किसान आईडी",
    location: "स्थान",
    primaryCrop: "मुख्य फसल",
    farmSize: "फार्म का आकार",
    soilType: "मिट्टी का प्रकार",
    agriOffices: "कृषि कार्यालय",
    language: "भाषा",
    logout: "लॉगआउट",
    saveChanges: "बदलाव सहेजें",
    findNearbyOffices: "निकटतम खोजें",
    locatingOffices: "कार्यालयों का पता लगाया जा रहा है...",
    cropHistoryTab: "फसल इतिहास",
    profileInfoTab: "प्रोफ़ाइल जानकारी",
    addRecord: "सत्र रिकॉर्ड जोड़ें",
    noCropHistory: "अभी तक कोई फसल इतिहास दर्ज नहीं किया गया है। नीचे अपनी पहली फसल का इतिहास जोड़ें!",
    cropNameLabel: "फसल का नाम",
    seasonLabel: "ऋतु / मौसम",
    yearLabel: "वर्ष",
    yieldLabel: "प्राप्त उपज (जैसे, 1500 किग्रा)",
    notesLabel: "सत्र की टिप्पणी / सीख",

    // Price Alerts Screen
    setNewAlert: "नया अलर्ट सेट करें",
    createAlert: "अलर्ट बनाएं",
    dropsBelow: "इससे कम होने पर",
    risesAbove: "इससे अधिक होने पर",
    priceDropsBelow: "मूल्य इससे कम होने पर",
    priceRisesAbove: "मूल्य इससे अधिक होने पर",
    noAlertsSet: "अभी तक कोई मूल्य अलर्ट सेट नहीं किया गया है।",
    crop: "फसल",
    targetPrice: "लक्ष्य मूल्य (₹ / किग्रा)",
    condition: "शर्त",

    // Crop Calendar Screen
    generatingCalendar: "आपका कैलेंडर तैयार किया जा रहा है...",
    timelineMonth: "महीना",
    noCalendar: "फसल कैलेंडर लोड करने में असमर्थ। कृपया पुनः प्रयास करें।",

    // Crop Rotation Screen
    rotationSuggestions: "फसल चक्र के सुझाव",
    soilTypeLabel: "मिट्टी का प्रकार",
    benefits: "लाभ",
    risks: "जोखिम",
    reasoning: "तर्क",
    generatingSuggestions: "सुझाव तैयार किए जा रहे हैं...",
    noRotation: "फसल चक्र के सुझाव लोड करने में असमर्थ। कृपया पुनः प्रयास करें।",

    // Notifications Screen
    notificationsTitle: "अधिसूचनाएं",
    clearAll: "सभी साफ़ करें",
    noNewNotifications: "कोई नई अधिसूचना नहीं।",

    // Chat Screen
    chatHeader: "कृषिसेवा एआई विशेषज्ञ",
    agentStatus: "मल्टी-एजेंट सिस्टम सक्रिय",
    howCanIHelp: "आज मैं आपकी क्या सहायता कर सकता हूँ?",
    howCanIHelpDesc: "फसल स्वास्थ्य, मौसम, बाज़ार भाव, या सरकारी योजनाओं के बारे में पूछें।",
    listening: "सुन रहा हूँ...",
    askQuestionPlaceholder: "खेती, फसल, कीटों के बारे में पूछें...",
  },
  ta: {
    // Navigation
    home: "முகப்பு",
    weather: "வானிலை",
    askAI: "AI-யிடம் கேள்",
    market: "சந்தை",
    profile: "சுயவிவரம்",

    // Home Screen
    appTitle: "அகிரிசேவா AI",
    currentWeather: "தற்போதைய வானிலை",
    weatherAdvice: "வானிலை ஆலோசனை",
    quickActions: "விரைவுச் செயல்பாடுகள்",
    askAIAdvice: "AI ஆலோசனை",
    scanCrop: "பயிரை ஸ்கேன் செய்",
    marketPrices: "சந்தை விலை",
    govtSchemes: "அரசு திட்டங்கள்",
    cropCalendar: "பயிர் காலண்டர்",
    cropRotation: "பயிர் சுழற்சி",
    priceAlerts: "விலை எச்சரிக்கை",
    farmingTips: "விவசாயக் குறிப்புகள்",
    exportReport: "அறிக்கையைப் பதிவிறக்கு",
    exporting: "பதிவிறக்கப்படுகிறது...",
    googleDriveSync: "கூகிள் டிரைவ் ஒத்திசைவு",
    googleDriveSyncDesc: "உங்கள் சுயவிவரம், விழிப்பூட்டல்கள் மற்றும் விவசாய அறிவிப்புகளை உங்கள் தனிப்பட்ட கூகிள் டிரைவில் பாதுகாப்பாக காப்புப் பிரதி எடுக்கவும்.",
    syncNow: "இப்போது ஒத்திசைக்கவும்",
    syncing: "ஒத்திசைக்கப்படுகிறது...",
    syncedSuccessfully: "காப்புப்பிரதி வெற்றிகரமாக ஒத்திசைக்கப்பட்டது!",
    connectGoogleDrive: "கூகிள் டிரைவை இணைக்கவும்",
    disconnect: "துண்டிக்கவும்",
    aiWeatherExpert: "AI வானிலை நிபுணர்",
    irrigationAlert: "நீர்ப்பாசன எச்சரிக்கை",
    irrigationTip: "இன்று அதிக ஆவியாதல் எதிர்பார்க்கப்படுகிறது. காலை 9 மணிக்குள் நெல் வயல்களுக்கு நீர் பாய்ச்சவும்.",
    fetchingWeather: "வானிலை தகவல் பெறப்படுகிறது...",
    noWeatherAvailable: "வானிலை தகவல் கிடைக்கவில்லை",
    selectLocationAdvice: "தனிப்பயனாக்கப்பட்ட வானிலை ஆலோசனை பெற ஒரு இடத்தைத் தேர்ந்தெடுக்கவும்.",

    // Weather Screen
    weatherTitle: "வானிலை தகவல்",
    humidity: "ஈரப்பதம்",
    wind: "காற்று",
    uvIndex: "UV குறியீடு",
    forecast: "முன்னறிவிப்பு",
    hourly: "மணிநேர வாரியாக",
    weatherSimulation: "வானிலை எச்சரிக்கை உருவகப்படுத்துதல்",
    weatherSimulationDesc: "கடுமையான வானிலை நிலைமைகளை உருவகப்படுத்துவதன் மூலம் வானிலை சேவையில் தானியங்கி சரிபார்ப்பைச் சோதிக்கவும். இது உடனடி எச்சரிக்கை அறிவிப்பைத் தூண்டும்.",
    simulateHeatwave: "வெப்ப அலையை உருவகப்படுத்து (42°C)",
    simulateStorm: "புயலை உருவகப்படுத்து (52 கி.மீ/மணி)",
    sevenDayForecast: "7-நாள் முன்னறிவிப்பு",
    high: "அதிகபட்சம்",
    low: "குறைந்தபட்சம்",

    // Market Screen
    priceTrends: "விலை போக்குகள்",
    liveMandiPrices: "நேரடி மண்டி விலை",
    setAlert: "எச்சரிக்கை அமை",
    noLivePrices: "இந்த இடத்தில் உங்கள் பயிர்களுக்கான நேரடி விலைகள் ஏதும் கிடைக்கவில்லை.",
    historicalDataNote: "உங்கள் பகுதியில் கடந்த 6 மாதங்களுக்கான வரலாற்றுத் தரவு",
    fetchingLivePrices: "நேரடி விலைகள் பெறப்படுகின்றன...",

    // Scan Crop Screen
    analyzingCrop: "பயிர் பகுப்பாய்வு செய்யப்படுகிறது...",
    geminiVisionProcessing: "ஜெமினி விஷன் AI உங்கள் படத்தை செயலாக்குகிறது",
    detectedCrop: "கண்டறியப்பட்ட பயிர்",
    healthStatus: "ஆரோக்கிய நிலை",
    consultAIExpert: "AI நிபுணரைக் கலந்தாலோசி",
    retake: "மீண்டும் எடு",
    tapOrDragImage: "படத்தை இங்கே தட்டவும் அல்லது இழுக்கவும்",
    pointCamera: "உங்கள் கேமராவை சுழற்றவும் அல்லது பாதிக்கப்பட்ட பகுதியின் புகைப்படத்தை எடுக்கவும்",
    startNewScan: "புதிய ஸ்கேன் தொடங்கு",
    recentScans: "சமீபத்திய ஸ்கேன்கள்",
    infectionDetected: "தொற்று கண்டறியப்பட்டது",

    // Govt Schemes Screen
    schemesHeader: "அரசு திட்டங்கள் போர்ட்டல்",
    searchSchemes: "திட்டத்தின் பெயர், பயிர் அல்லது நன்மைகளைத் தேடு...",
    checkEligibility: "தகுதியைச் சரிபார்",
    eligibilityResult: "தகுதி முடிவு",
    checkingEligibility: "தகுதி சரிபார்க்கப்படுகிறது...",
    applyOnPortal: "அதிகாரப்பூர்வ போர்ட்டலில் விண்ணப்பிக்க",
    officialPortal: "அதிகாரப்பூர்வ போர்ட்டல்",
    eligible: "உங்களுக்கான தகுதி",
    likelyEligible: "சாத்தியமான தகுதி",
    agentAssessment: "தானியங்கி AI முகவர் தணிக்கை",
    agentAuditCompleted: "உங்கள் உழவர் சுயவிவரத்தின் அடிப்படையில் அக்ரிசேவா திட்ட முகவர் உங்கள் தகுதியை தானாகவே சரிபார்த்துள்ளார்.",
    directApplyPortal: "நேரடி ஆன்லைன் விண்ணப்ப போர்ட்டல்",
    requiredDocs: "முக்கிய தேவையான ஆவணங்கள்",
    keyHighlights: "திட்டத்தின் முக்கிய நன்மைகள்",
    allSchemes: "அனைத்து திட்டங்கள்",
    eligibleSchemesOnly: "தகுதியுடையவை மட்டும்",
    directPortalLinkNotice: "இந்திய அரசு / மாநில அரசின் அதிகாரப்பூர்வ போர்ட்டலில் பாதுகாப்பான புதிய தாவலில் திறக்கும்.",
    detailedAnalysis: "விரிவான AI விளக்கம்",
    hideAnalysis: "விளக்கத்தை மறைக்கவும்",
    helpline: "உதவி எண்",

    // Profile Screen
    profileSettings: "சுயவிவர அமைப்புகள்",
    farmerId: "விவசாயி ஐடி",
    location: "இருப்பிடம்",
    primaryCrop: "முதன்மை பயிர்",
    farmSize: "பண்ணை அளவு",
    soilType: "மண் வகை",
    agriOffices: "விவசாய அலுவலகங்கள்",
    language: "மொழி",
    logout: "வெளியேறு",
    saveChanges: "மாற்றங்களைச் சேமி",
    findNearbyOffices: "அருகிலுள்ளதைக் கண்டறி",
    locatingOffices: "அலுவலகங்கள் கண்டறியப்படுகின்றன...",
    cropHistoryTab: "பயிர் வரலாறு",
    profileInfoTab: "சுயவிவர தகவல்",
    addRecord: "பருவக்கால பதிவு சேர்க்கவும்",
    noCropHistory: "பயிர் வரலாறு இன்னும் பதிவு செய்யப்படவில்லை. உங்கள் முதல் பயிர் வரலாற்றை கீழே சேர்க்கவும்!",
    cropNameLabel: "பயிர் பெயர்",
    seasonLabel: "பருவம்",
    yearLabel: "வருடம்",
    yieldLabel: "அடைந்த மகசூல் (उदा, 1500 கிலோ)",
    notesLabel: "பருவக்கால குறிப்புகள் / கற்றுக்கொண்டவை",

    // Price Alerts Screen
    setNewAlert: "புதிய எச்சரிக்கை அமை",
    createAlert: "எச்சரிக்கையை உருவாக்கு",
    dropsBelow: "குறைந்தால்",
    risesAbove: "உயர்ந்தால்",
    priceDropsBelow: "விலை குறைந்தால்",
    priceRisesAbove: "விலை உயர்ந்தால்",
    noAlertsSet: "விலை எச்சரிக்கைகள் இன்னும் அமைக்கப்படவில்லை.",
    crop: "பயிர்",
    targetPrice: "இலக்கு விலை (₹ / கிலோ)",
    condition: "நிபந்தனை",

    // Crop Calendar Screen
    generatingCalendar: "உங்கள் காலண்டர் உருவாக்கப்படுகிறது...",
    timelineMonth: "மாதம்",
    noCalendar: "பயிர் காலண்டரை ஏற்ற முடியவில்லை. மீண்டும் முயற்சிக்கவும்.",

    // Crop Rotation Screen
    rotationSuggestions: "பயிர் சுழற்சி ஆலோசனைகள்",
    soilTypeLabel: "மண் வகை",
    benefits: "நன்மைகள்",
    risks: "ஆபத்துகள்",
    reasoning: "காரணம்",
    generatingSuggestions: "ஆலோசனைகள் உருவாக்கப்படுகின்றன...",
    noRotation: "பயிர் சுழற்சி ஆலோசனைகளை ஏற்ற முடியவில்லை. மீண்டும் முயற்சிக்கவும்.",

    // Notifications Screen
    notificationsTitle: "அறிவிப்புகள்",
    clearAll: "அனைத்தையும் அழி",
    noNewNotifications: "புதிய அறிவிப்புகள் எதுவும் இல்லை.",

    // Chat Screen
    chatHeader: "அகிரிசேவா AI நிபுணர்",
    agentStatus: "மல்டி-ஏஜென்ட் சிஸ்டம் செயலில் உள்ளது",
    howCanIHelp: "இன்று நான் உங்களுக்கு எவ்வாறு உதவ முடியும்?",
    howCanIHelpDesc: "பயிர் ஆரோக்கியம், வானிலை, சந்தை விலை அல்லது அரசு திட்டங்கள் பற்றி கேளுங்கள்.",
    listening: "கேட்டுக்கொண்டிருக்கிறது...",
    askQuestionPlaceholder: "விவசாயம், பயிர், பூச்சிகள் பற்றி கேளுங்கள்...",
  }
};

interface TranslationContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const TranslationProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('agriseva_language') as Language) || 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('agriseva_language', lang);
  };

  const t = (key: string): string => {
    const langDict = translations[language] || translations['en'];
    return (langDict as any)[key] || key;
  };

  return (
    <TranslationContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};
