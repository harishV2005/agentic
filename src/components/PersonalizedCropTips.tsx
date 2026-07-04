import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sprout, 
  Droplets, 
  Scale, 
  Check, 
  CheckCircle2, 
  MessageSquare, 
  ChevronRight, 
  Info,
  Layers,
  Sparkles
} from 'lucide-react';

interface ProfileData {
  name: string;
  location: string;
  crops: string;
  farmSize: string;
  farmUnit: string;
  soilType: string;
}

interface PersonalizedCropTipsProps {
  profileData: ProfileData;
  language: 'en' | 'hi' | 'ta';
  onAskAI: (prompt: string) => void;
}

interface CropSpecification {
  seedRate: number; // kg per acre
  n: number; // Nitrogen kg per acre
  p: number; // Phosphorus kg per acre
  k: number; // Potassium kg per acre
  waterLabel: {
    en: string;
    hi: string;
    ta: string;
  };
  fertilizerFreq: {
    en: string;
    hi: string;
    ta: string;
  };
  stage: {
    en: string;
    hi: string;
    ta: string;
  };
}

// Data mapping of crops to resources
const CROP_SPECS: Record<string, CropSpecification> = {
  Paddy: {
    seedRate: 18,
    n: 50,
    p: 25,
    k: 25,
    waterLabel: {
      en: "Keep standing water of 2-5 cm. Ensure drainage at tillering.",
      hi: "2-5 सेमी खड़ा पानी बनाए रखें। कल्ले निकलने पर जल निकासी सुनिश्चित करें।",
      ta: "2-5 செமீ நின்ற தண்ணீர் வைக்கவும். தூர்விடும் போது வடிகால் வசதி செய்யவும்."
    },
    fertilizerFreq: {
      en: "Split Nitrogen in 3 doses: basal, tillering, and panicle initiation.",
      hi: "नाइट्रोजन को 3 खुराकों में विभाजित करें: रोपाई के समय, कल्ले निकलने पर और बालियां बनते समय।",
      ta: "நைட்ரஜனை 3 முறைகளாக பிரிக்கவும்: நடவு, தூர்விடுதல் மற்றும் கதிர் உருவாகும் தருணம்."
    },
    stage: {
      en: "Tillering / Active Growth Stage",
      hi: "कल्ले निकलने की अवस्था / सक्रिय विकास",
      ta: "தூர்விடும் நிலை / தீவிர வளர்ச்சி நிலை"
    }
  },
  Wheat: {
    seedRate: 45,
    n: 60,
    p: 30,
    k: 20,
    waterLabel: {
      en: "Irrigate crown root initiation (CRI) stage (20-25 days after sowing).",
      hi: "मुकुट जड़ दीक्षा (CRI) चरण में सिंचाई करें (बुआई के 20-25 दिन बाद)।",
      ta: "முடிவேர் தோன்றும் தருணத்தில் (CRI) நீர் பாய்ச்சவும் (விதைத்த 20-25 நாட்கள்)."
    },
    fertilizerFreq: {
      en: "Apply entire Phosphorus and Potassium as basal. Nitrogen in 2 split doses.",
      hi: "बुआई के समय पूरा फास्फोरस और पोटाश डालें। नाइट्रोजन 2 खुराकों में दें।",
      ta: "முழு பாஸ்பரஸ் மற்றும் பொட்டாசியத்தை அடிப்படையாக இடவும். நைட்ரஜனை 2 பாகங்களாகப் பிரித்திடவும்."
    },
    stage: {
      en: "Vegetative / Crown Root Stage",
      hi: "वानस्पतिक विकास / मुकुट जड़ अवस्था",
      ta: "வளர்ச்சி நிலை / முடிவேர் நிலை"
    }
  },
  Sugarcane: {
    seedRate: 2000, // stems/sets
    n: 120,
    p: 60,
    k: 60,
    waterLabel: {
      en: "Keep soil consistently moist. Irrigate every 10-12 days.",
      hi: "मिट्टी को लगातार नम रखें। हर 10-12 दिनों में सिंचाई करें।",
      ta: "மண்ணை தொடர்ந்து ஈரப்பதமாக வைத்திருக்கவும். 10-12 நாட்களுக்கு ஒருமுறை நீர் பாய்ச்சவும்."
    },
    fertilizerFreq: {
      en: "Basal dose followed by top dressing at 45, 90, and 120 days after planting.",
      hi: "रोपण के 45, 90 और 120 दिनों के बाद टॉप ड्रेसिंग के रूप में डालें।",
      ta: "நடவு செய்த 45, 90 மற்றும் 120 நாட்களில் மேலுரமாக இடவும்."
    },
    stage: {
      en: "Tillering & Grand Growth Stage",
      hi: "कल्ले निकलना एवं मुख्य वृद्धि अवस्था",
      ta: "தூர்விடுதல் மற்றும் முக்கிய வளர்ச்சி நிலை"
    }
  },
  Cotton: {
    seedRate: 2.5,
    n: 40,
    p: 20,
    k: 20,
    waterLabel: {
      en: "Avoid waterlogging. Irrigate during flowering and boll development.",
      hi: "जलभराव से बचें। फूल आने और डोडे बनने के दौरान सिंचाई करें।",
      ta: "நீர் தேங்குவதைத் தவிர்க்கவும். பூக்கும் மற்றும் காய் உருவாகும் போது நீர் பாய்ச்சவும்."
    },
    fertilizerFreq: {
      en: "Apply Nitrogen at thinning and flowering stages.",
      hi: "पौधों की छंटाई और फूल आने के चरणों में नाइट्रोजन डालें।",
      ta: "பயிர் கலைத்தல் மற்றும் பூக்கும் நிலைகளில் நைட்ரஜனை இடவும்."
    },
    stage: {
      en: "Flowering & Boll Formation",
      hi: "फूल आना और डोडे बनना",
      ta: "பூக்கும் மற்றும் காய் உருவாகும் நிலை"
    }
  },
  Maize: {
    seedRate: 9,
    n: 60,
    p: 30,
    k: 30,
    waterLabel: {
      en: "Irrigate critical knee-high and tasseling stages.",
      hi: "घुटने तक की ऊंचाई और नर-मंजरी (tasseling) अवस्था में सिंचाई करें।",
      ta: "முழங்கால் உயரம் மற்றும் கதிர் உருவாகும் முக்கிய நிலைகளில் நீர் பாய்ச்சவும்."
    },
    fertilizerFreq: {
      en: "Apply Nitrogen in splits: basal, knee-high, and tasseling stages.",
      hi: "नाइट्रोजन को बांटकर डालें: बुआई के समय, घुटने तक की ऊंचाई और मक्का बनते समय।",
      ta: "நைட்ரஜனைப் பிரித்து இடவும்: அடி உரம், முழங்கால் உயரம் மற்றும் கதிர் நிலை."
    },
    stage: {
      en: "Knee-High Stage",
      hi: "घुटने तक की ऊंचाई की अवस्था",
      ta: "முழங்கால் உயர நிலை"
    }
  },
  Tomato: {
    seedRate: 0.15,
    n: 45,
    p: 35,
    k: 40,
    waterLabel: {
      en: "Drip irrigation recommended. Avoid overhead watering to reduce leaf mold.",
      hi: "ड्रिप सिंचाई की सिफारिश की जाती है। पत्ती रोग कम करने के लिए ऊपर से पानी न डालें।",
      ta: "சொட்டு நீர் பாசனம் பரிந்துரைக்கப்படுகிறது. இலை பூஞ்சையை குறைக்க மேலிருந்து நீர் பாய்ச்சுவதை தவிர்க்கவும்."
    },
    fertilizerFreq: {
      en: "Apply fertilizer every 3 weeks once transplanting takes root.",
      hi: "रोपाई के जड़ पकड़ने के बाद हर 3 सप्ताह में उर्वरक डालें।",
      ta: "நாற்று வேர் பிடித்த பிறகு 3 வாரங்களுக்கு ஒருமுறை உரம் இடவும்."
    },
    stage: {
      en: "Flowering / Early Fruit Set",
      hi: "फूल आना / शुरुआती फल बनना",
      ta: "பூக்கும் / ஆரம்பக்காய் பிடிக்கும் நிலை"
    }
  },
  Onion: {
    seedRate: 4.5,
    n: 45,
    p: 25,
    k: 25,
    waterLabel: {
      en: "Provide regular light watering. Stop irrigation 15 days before harvest.",
      hi: "नियमित हल्की सिंचाई करें। कटाई से 15 दिन पहले सिंचाई बंद कर दें।",
      ta: "வழக்கமான லேசான நீர் பாய்ச்சவும். அறுவடைக்கு 15 நாட்களுக்கு முன் நீர் பாய்ச்சுவதை நிறுத்தவும்."
    },
    fertilizerFreq: {
      en: "Basal dose + Nitrogen top dressing at 30 and 45 days after transplanting.",
      hi: "रोपाई के 30 और 45 दिन बाद बेसल खुराक + नाइट्रोजन टॉप ड्रेसिंग दें।",
      ta: "அடி உரம் + நடவு செய்த 30 மற்றும் 45 நாட்களில் நைட்ரஜன் மேலுரம் இடவும்."
    },
    stage: {
      en: "Bulb Development Stage",
      hi: "कंद (प्याज) विकास की अवस्था",
      ta: "வெங்காயக் குமிழ் வளர்ச்சி நிலை"
    }
  }
};

const DEFAULT_SPEC: CropSpecification = {
  seedRate: 10,
  n: 50,
  p: 25,
  k: 25,
  waterLabel: {
    en: "Keep soil moist. Check moisture at root zone.",
    hi: "मिट्टी को नम रखें। जड़ क्षेत्र में नमी की जाँच करें।",
    ta: "மண்ணை ஈரப்பதமாக வைத்திருக்கவும். வேர் பகுதியில் ஈரப்பதத்தை சரிபார்க்கவும்."
  },
  fertilizerFreq: {
    en: "Apply Nitrogen at active vegetative growth and flowering.",
    hi: "सक्रिय वानस्पतिक विकास और फूल आने के समय नाइट्रोजन डालें।",
    ta: "தீவிர வளர்ச்சி மற்றும் பூக்கும் தருணத்தில் நைட்ரஜனை இடவும்."
  },
  stage: {
    en: "Vegetative Growth",
    hi: "वानस्पतिक विकास",
    ta: "வளர்ச்சி நிலை"
  }
};

const TRANSLATIONS = {
  en: {
    title: "🌾 Personalized Crop Tips",
    subtitle: "Daily routines & resource estimates for your {{farm}} farm",
    resourceTitle: "🚜 Recommended Resource Inputs",
    seedLabel: "Recommended Seeds",
    fertilizerLabel: "NPK Fertilizer (Total Season)",
    waterTitle: "💧 Water Schedule",
    fertilizerTitle: "🌱 Nutrition Method",
    routineTitle: "✅ Today's Action Plan",
    askAIBtn: "Ask AI Expert about these tips",
    completed: "completed",
    stageLabel: "Estimated Crop Stage",
    notConfigured: "Complete your profile to get fully custom crop calculators!",
    soilSpecific: "Soil specific alert: Good drainage is key in your {{soil}}.",
    doneAll: "Fantastic! All daily tasks completed. Keep up the great work! 🎉"
  },
  hi: {
    title: "🌾 व्यक्तिगत फसल सुझाव",
    subtitle: "आपके {{farm}} खेत के लिए दैनिक दिनचर्या और संसाधन अनुमान",
    resourceTitle: "🚜 अनुशंसित संसाधन इनपुट",
    seedLabel: "अनुशंसित बीज मात्रा",
    fertilizerLabel: "एनपीके उर्वरक (पूर्ण सीजन)",
    waterTitle: "💧 सिंचाई की अनुसूची",
    fertilizerTitle: "🌱 पोषण विधि",
    routineTitle: "✅ आज की अनुशंसित कृषि दिनचर्या",
    askAIBtn: "इन सुझावों के बारे में एआई विशेषज्ञ से पूछें",
    completed: "पूरा किया",
    stageLabel: "अनुमानित फसल चरण",
    notConfigured: "पूरी तरह से अनुकूलित फसल कैलकुलेटर प्राप्त करने के लिए अपनी प्रोफ़ाइल पूरी करें!",
    soilSpecific: "मिट्टी विशिष्ट चेतावनी: आपकी {{soil}} में अच्छा जल निकासी मुख्य है।",
    doneAll: "शानदार! सभी दैनिक कार्य पूरे हो गए हैं। ऐसे ही आगे बढ़ते रहें! 🎉"
  },
  ta: {
    title: "🌾 தனிப்பயனாக்கப்பட்ட பயிர் குறிப்புகள்",
    subtitle: "உங்களது {{farm}} பண்ணைக்கான தினசரி பணிகள் & வளங்களின் மதிப்பீடு",
    resourceTitle: "🚜 பரிந்துரைக்கப்பட்ட வள உள்ளீடுகள்",
    seedLabel: "பரிந்துரைக்கப்பட்ட விதை அளவு",
    fertilizerLabel: "NPK உரம் (முழு பருவத்திற்கு)",
    waterTitle: "💧 நீர் மேலாண்மை",
    fertilizerTitle: "🌱 ஊட்டச்சத்து முறை",
    routineTitle: "✅ இன்றைய பரிந்துரைக்கப்பட்ட பண்ணை வழக்கமான பணிகள்",
    askAIBtn: "இந்த உதவிக்குறிப்புகள் பற்றி AI நிபுணரிடம் கேளுங்கள்",
    completed: "முடிந்தது",
    stageLabel: "மதிப்பிடப்பட்ட பயிர் நிலை",
    notConfigured: "முழுமையான தனிப்பயனாக்கப்பட்ட பயிர் கணிப்பான்களைப் பெற உங்கள் சுயவிவரத்தை நிரப்பவும்!",
    soilSpecific: "மண் சார்ந்த எச்சரிக்கை: உங்கள் {{soil}} மண்ணில் வடிகால் வசதி மிகவும் முக்கியமானது.",
    doneAll: "அற்புதம்! இன்றைய அனைத்துப் பணிகளும் வெற்றிகரமாக முடிக்கப்பட்டன. தொடர்ந்து சிறப்பாகச் செய்யுங்கள்! 🎉"
  }
};

const CHECKLIST_TEMPLATES: Record<string, Record<'en' | 'hi' | 'ta', string[]>> = {
  Paddy: {
    en: [
      "Maintain a standing water level of 2-5 cm in the main field.",
      "Check for stem borer or leaf folder infestations near the base of the tillers.",
      "Apply split Nitrogen top dressing if currently at tillering stage.",
      "Ensure boundaries and bunds are closed to prevent water leakage."
    ],
    hi: [
      "मुख्य खेत में 2-5 सेमी खड़ा पानी का स्तर बनाए रखें।",
      "कल्लों के पास तना छेदक या पत्ती लपेटक कीटों के संक्रमण की जाँच करें।",
      "यदि वर्तमान में कल्ले निकलने की अवस्था है, तो नाइट्रोजन की टॉप ड्रेसिंग करें।",
      "पानी के रिसाव को रोकने के लिए मेड़ों को ठीक और बंद रखें।"
    ],
    ta: [
      "முக்கிய வயலில் 2-5 செமீ நின்ற தண்ணீர் அளவை பராமரிக்கவும்.",
      "தூர் பகுதிகளில் தண்டு துளைப்பான் அல்லது இலை சுருட்டு புழு உள்ளதா என கண்காணிக்கவும்.",
      "தூர்விடும் தருணத்தில் இருந்தால் நைட்ரஜன் மேலுரம் இடவும்.",
      "நீர் கசிவைத் தடுக்க வரப்புகளைச் சரிசெய்து அடைக்கவும்."
    ]
  },
  Wheat: {
    en: [
      "Irrigate the field gently if at the critical crown root initiation (CRI) stage.",
      "Inspect wheat leaves for yellow rust or powdery mildew patches.",
      "Apply Nitrogen top dressing just before the second irrigation cycle.",
      "Remove broad-leaf weeds from fields manually or with selective weeding."
    ],
    hi: [
      "यदि मुकुट जड़ दीक्षा (CRI) की महत्वपूर्ण अवस्था है, तो खेत की हल्की सिंचाई करें।",
      "गेहूं की पत्तियों पर पीले रतुआ या ख़स्ता फफूंदी के धब्बों की जाँच करें।",
      "दूसरे सिंचाई चक्र से ठीक पहले नाइट्रोजन का छिड़काव करें।",
      "खेतों से चौड़ी पत्ती वाले खरपतवारों को हाथ से या चुनिंदा निराई से हटाएँ।"
    ],
    ta: [
      "முடிவேர் தோன்றும் முக்கிய நிலையில் இருந்தால் லேசாக நீர் பாய்ச்சவும்.",
      "கோதுமை இலைகளில் மஞ்சள் துரு நோய் அல்லது பூஞ்சை உள்ளதா என கண்காணிக்கவும்.",
      "இரண்டாவது நீர் பாய்ச்சுவதற்கு சற்று முன்பு நைட்ரஜன் மேலுரம் இடவும்.",
      "களைகளைக் கைகளால் அல்லது களை எடுக்கும் கருவி கொண்டு அகற்றவும்."
    ]
  },
  Cotton: {
    en: [
      "Monitor underside of lower leaves for sucking pests like whiteflies and thrips.",
      "Apply post-emergence weeding to keep the rows clean and airy.",
      "Check for moisture distress; irrigate if leaves look wilted in late morning.",
      "Prepare bio-pesticides or neem oil spray for organic pest management."
    ],
    hi: [
      "सफेद मक्खियों और थ्रिप्स जैसे चूसने वाले कीटों के लिए निचली पत्तियों के निचले हिस्से की जाँच करें।",
      "पंक्तियों को साफ और हवादार रखने के लिए बुआई के बाद निराई करें।",
      "नमी की कमी की जाँच करें; यदि दोपहर में पत्तियां मुरझाई हुई दिखें तो सिंचाई करें।",
      "जैविक कीट प्रबंधन के लिए जैव-कीटनाशक या नीम के तेल का स्प्रे तैयार करें।"
    ],
    ta: [
      "வெள்ளை ஈக்கள் மற்றும் அசுவினி போன்ற உறிஞ்சும் பூச்சிகள் உள்ளதா என இலைகளின் அடியில் சரிபார்க்கவும்.",
      "வரிசைகளை சுத்தமாகவும் காற்றோட்டமாகவும் வைத்திருக்க களைகளை அகற்றவும்.",
      "ஈரப்பதக் குறைபாட்டைச் சரிபார்க்கவும்; இலைகள் வாடினால் நீர் பாய்ச்சவும்.",
      "இயற்கை பூச்சி மேலாண்மைக்காக வேப்ப எண்ணெய் கரைசல் தயார் செய்யவும்."
    ]
  },
  Maize: {
    en: [
      "Scout fields for Fall Armyworm damages on young whorls.",
      "Apply earthing-up operation to support the root system from lodging.",
      "Irrigate specifically if tasseling or silking stage has arrived.",
      "Apply nitrogen fertilizer around root zones of the maize stalks."
    ],
    hi: [
      "युवा पौधों की भंवरियों पर फॉल आर्मीवॉर्म कीट के नुकसान की जाँच करें।",
      "पौधों को गिरने से बचाने के लिए जड़ों के पास मिट्टी चढ़ाने (कान चढ़ाना) का कार्य करें।",
      "यदि मक्के में फूल आ रहे हों या बालियाँ बन रही हों तो निश्चित रूप से सिंचाई करें।",
      "मक्के के पौधों के जड़ क्षेत्रों के आसपास नाइट्रोजन उर्वरक डालें।"
    ],
    ta: [
      "இளம் குருத்துகளில் படைப்புழு தாக்குதல் உள்ளதா என ஆய்வு செய்யவும்.",
      "காற்றில் பயிர் சாயாமல் இருக்க வேர் பகுதியில் மண் அணைக்கும் பணியைச் செய்யவும்.",
      "பூக்கள் பூக்கும் அல்லது கதிர் பிடிக்கும் நிலையில் இருந்தால் கட்டாயம் நீர் பாய்ச்சவும்.",
      "சோளத் தண்டுகளின் வேர்ப் பகுதியில் நைட்ரஜன் உரமிடவும்."
    ]
  },
  Sugarcane: {
    en: [
      "Perform earthing-up to prevent lodging of heavy mature sugarcane stalks.",
      "Inspect crop for sugarcane pyrilla or early shoot borer symptoms.",
      "Irrigate fields to maintain optimum sugar accumulation in nodes.",
      "Remove dried lower leaves (detrash) to allow good light penetration."
    ],
    hi: [
      "भारी और परिपक्व गन्ने के तनों को गिरने से बचाने के लिए मिट्टी चढ़ाएं।",
      "गन्ने के पायरिला कीट या शुरुआती तना छेदक के लक्षणों की जाँच करें।",
      "गांठों में इष्टतम चीनी संचय बनाए रखने के लिए खेतों की सिंचाई करें।",
      "अच्छी रोशनी और हवा के लिए सूखी निचली पत्तियों को हटा दें (डेट्रैशिंग)।"
    ],
    ta: [
      "கரும்புத் தண்டுகள் சாயாமல் இருக்க மண் அணைக்கும் பணியைச் செய்யவும்.",
      "கரும்பு குருத்து துளைப்பான் அல்லது பூச்சிகளின் தாக்குதல் அறிகுறிகளை ஆராயவும்.",
      "கணுக்களில் சர்க்கரைச் சத்து அதிகரிக்க வயல்களில் சீராக நீர் பாய்ச்சவும்.",
      "காற்று மற்றும் சூரிய ஒளி பட ஏதுவாக காய்ந்த அடி இலைகளை உரிக்கவும்."
    ]
  },
  Tomato: {
    en: [
      "Check staking ties and trellis to keep tomato fruits off the soil.",
      "Inspect leaves for early blight (brown rings on lower foliage).",
      "Maintain consistent drip watering to prevent blossom end rot.",
      "Pinch off suckers to direct energy into main fruiting branches."
    ],
    hi: [
      "टमाटर के फलों को मिट्टी से ऊपर रखने के लिए मचान या सुतली के बंधनों की जाँच करें।",
      "पत्तियों पर अगेती झुलसा रोग (निचली पत्तियों पर भूरे छल्ले) की जाँच करें।",
      "फलों को सड़ने से बचाने के लिए ड्रिप सिंचाई द्वारा लगातार पानी दें।",
      "मुख्य फल देने वाली शाखाओं में ऊर्जा भेजने के लिए अतिरिक्त कल्ले (सकर्स) तोड़ें।"
    ],
    ta: [
      "தக்காளிப் பழங்கள் மண்ணில் படாமல் இருக்க தாங்கு கம்புகளைச் சரிபார்க்கவும்.",
      "இலைகளில் கருகல் நோய் (அடி இலைகளில் பழுப்பு நிற வளையங்கள்) உள்ளதா எனப் பார்க்கவும்.",
      "அழுகல் நோயைத் தடுக்க சொட்டு நீர் பாசனம் மூலம் சீராக நீர் பாய்ச்சவும்.",
      "முக்கிய கிளைகளில் காய் பிடிக்க பக்கவாட்டுக் குருத்துகளைக் கிள்ளி எறியவும்."
    ]
  },
  Onion: {
    en: [
      "Monitor soil bed dryness; irrigate lightly to support onion bulb expansion.",
      "Scout for thrips (silvery streaks or patches on the tubular leaves).",
      "Gently weed the onion beds manually to avoid damage to shallow roots.",
      "Apply micronutrient spray or sulfur to enhance bulb size and pungency."
    ],
    hi: [
      "मिट्टी की क्यारी के सूखेपन की जाँच करें; कंद के विस्तार के लिए हल्की सिंचाई करें।",
      "थ्रिप्स कीट (पत्तियों पर चांदी जैसी धारियां या धब्बे) की जाँच करें।",
      "उथली जड़ों को नुकसान से बचाने के लिए क्यारियों की हाथ से सावधानीपूर्वक निराई करें।",
      "प्याज का आकार और तीखापन बढ़ाने के लिए सूक्ष्म पोषक तत्व स्प्रे या सल्फर डालें।"
    ],
    ta: [
      "மண் ஈரப்பதத்தை சரிபார்த்து வெங்காயக் குமிழ் வளர லேசாக நீர் பாய்ச்சவும்.",
      "வெங்காய இலைகளில் இலைப்பேன் தாக்குதல் உள்ளதா என ஆய்வு செய்யவும்.",
      "வேர்கள் சேதமடையாமல் இருக்க வெங்காயப் பாத்திகளில் கவனமாக கைக்களை எடுக்கவும்.",
      "குமிழின் அளவு மற்றும் தரத்தை அதிகரிக்க நுண்ணூட்டச்சத்துக்களைத் தெளிக்கவும்."
    ]
  },
  General: {
    en: [
      "Walk along your field bunds to check for soil erosion or water logging.",
      "Look under leaves of several random plants to inspect for early pest egg-masses.",
      "Apply organic mulch to retain soil moisture and suppress heavy weed growth.",
      "Update your field records with today's activities and market rates."
    ],
    hi: [
      "मिट्टी के कटाव या जलभराव की जांच के लिए अपने खेत की मेड़ों पर चलें।",
      "शुरुआती कीटों के अंडे की थैलियों की जांच के लिए यादृच्छिक पौधों की पत्तियों के नीचे देखें।",
      "मिट्टी की नमी बनाए रखने और खरपतवारों को दबाने के लिए जैविक मल्चिंग लगाएं।",
      "आज की गतिविधियों और बाजार की दरों के साथ अपनी कृषि डायरी अपडेट करें।"
    ],
    ta: [
      "மண் அரிப்பு அல்லது நீர் தேக்கம் உள்ளதா என வயல் வரப்புகளைச் சுற்றிப் பார்க்கவும்.",
      "பூச்சி முட்டைகள் ஏதேனும் உள்ளதா என இலைகளின் பின்புறம் சரிபார்க்கவும்.",
      "மண் ஈரப்பதத்தைக் காக்கவும் களைகளைக் கட்டுப்படுத்தவும் மூடாக்கு அமைக்கவும்.",
      "இன்றைய பணிகள் மற்றும் சந்தை விலைகளை உங்களது குறிப்பேட்டில் பதிவு செய்யவும்."
    ]
  }
};

export const PersonalizedCropTips: React.FC<PersonalizedCropTipsProps> = ({ 
  profileData, 
  language = 'en',
  onAskAI
}) => {
  const farmVal = parseFloat(profileData.farmSize) || 1;
  const crop = profileData.crops || 'Paddy';
  const unit = profileData.farmUnit || 'Acres';
  const soil = profileData.soilType || 'Soil';

  // State to track completed checklist items
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

  // Reset checklist when crop changes
  useEffect(() => {
    setCheckedItems({});
  }, [crop]);

  // Find specifications
  const spec = CROP_SPECS[crop] || DEFAULT_SPEC;

  // Language texts
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  // Checklist items
  const templateObj = CHECKLIST_TEMPLATES[crop] || CHECKLIST_TEMPLATES.General;
  const itemsList = templateObj[language] || templateObj.en || CHECKLIST_TEMPLATES.General[language];

  // Dynamic calculations based on unit and size
  let multiplier = 1;
  if (unit.toLowerCase().includes('bigha')) {
    multiplier = 0.4; // 1 Bigha ~ 0.4 Acre
  } else if (unit.toLowerCase().includes('hectare')) {
    multiplier = 2.47; // 1 Hectare ~ 2.47 Acre
  }

  const effectiveSize = farmVal * multiplier;
  const computedSeeds = (spec.seedRate * effectiveSize).toFixed(1);
  const computedN = (spec.n * effectiveSize).toFixed(0);
  const computedP = (spec.p * effectiveSize).toFixed(0);
  const computedK = (spec.k * effectiveSize).toFixed(0);

  const handleToggle = (index: number) => {
    setCheckedItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const completedCount = Object.values(checkedItems).filter(Boolean).length;
  const totalCount = itemsList.length;
  const isAllDone = totalCount > 0 && completedCount === totalCount;

  const handleAskAIAboutTips = () => {
    const prompt = language === 'hi' 
      ? `नमस्ते एग्रीसेवा एआई, मैं ${profileData.location} में ${profileData.farmSize} ${profileData.farmUnit} भूमि पर ${crop} की खेती कर रहा हूँ। मेरी मिट्टी का प्रकार ${soil || "सामान्य"} है। कृपया मुझे इस सप्ताह की कृषि गतिविधियों, सिंचाई योजना और कीट नियंत्रण के बारे में विस्तृत व्यक्तिगत सुझाव दें।`
      : language === 'ta'
      ? `வணக்கம் அக்ரிசேவா AI, நான் ${profileData.location} பகுதியில் ${profileData.farmSize} ${profileData.farmUnit} நிலப்பரப்பில் ${crop} பயிரிடுகிறேன். எனது மண் வகை ${soil || "சாதாரண மண்"}. தயவுசெய்து இந்த வாரத்திற்கான நீர்ப்பாசனம், உரம் மற்றும் பூச்சி மேலாண்மை பற்றிய தனிப்பயனாக்கப்பட்ட ஆலோசனைகளை வழங்கவும்.`
      : `Hello AgriSeva AI, I am farming ${crop} on ${profileData.farmSize} ${profileData.farmUnit} of land in ${profileData.location} with ${soil || "standard"} soil. Please provide me with highly specific crop tips, water schedules, and fertilizer applications tailored for my farm size this week.`;

    onAskAI(prompt);
  };

  // Interpolate strings
  const getSubTitle = () => {
    const farmStr = `${profileData.farmSize} ${unit} ${crop}`;
    return t.subtitle.replace('{{farm}}', farmStr);
  };

  const getSoilAlert = () => {
    if (!profileData.soilType) return null;
    return t.soilSpecific.replace('{{soil}}', profileData.soilType);
  };

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl border border-stone-100 shadow-sm p-6 space-y-6 overflow-hidden relative"
    >
      {/* Background ambient light */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-extrabold text-stone-900 tracking-tight">
              {t.title}
            </h3>
            <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
              {spec.stage[language]}
            </span>
          </div>
          <p className="text-xs text-stone-400 font-medium">
            {getSubTitle()}
          </p>
        </div>
      </div>

      {/* Resource Inputs Bento */}
      <div className="space-y-3">
        <h4 className="text-xs font-black uppercase tracking-widest text-stone-400 flex items-center gap-1.5">
          <span>{t.resourceTitle}</span>
        </h4>
        
        <div className="grid grid-cols-2 gap-3">
          {/* Seed Rate Card */}
          <div className="bg-stone-50 border border-stone-100 p-4 rounded-2xl flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-green-50 text-primary flex items-center justify-center shrink-0 mt-0.5">
              <Sprout size={18} />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-stone-400 font-bold block truncate">
                {t.seedLabel}
              </span>
              <span className="text-lg font-black text-stone-800 block mt-0.5">
                {computedSeeds} <span className="text-xs font-bold text-stone-500">{crop === 'Sugarcane' ? 'sets' : 'kg'}</span>
              </span>
            </div>
          </div>

          {/* Fertilizer Card */}
          <div className="bg-stone-50 border border-stone-100 p-4 rounded-2xl flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 mt-0.5">
              <Scale size={18} />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-stone-400 font-bold block truncate">
                {t.fertilizerLabel}
              </span>
              <span className="text-lg font-black text-stone-800 block mt-0.5">
                {computedN}-{computedP}-{computedK} <span className="text-xs font-bold text-stone-500">kg</span>
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Alerts */}
        {getSoilAlert() && (
          <div className="bg-amber-50/50 border border-amber-100 rounded-xl px-3 py-2 flex items-center gap-2 text-amber-800 text-[11px] font-semibold">
            <Info size={14} className="shrink-0 text-amber-600" />
            <p className="leading-tight">{getSoilAlert()}</p>
          </div>
        )}
      </div>

      {/* Dynamic Guides */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 border-t border-stone-50">
        <div className="flex gap-3 items-start p-1.5">
          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
            <Droplets size={16} />
          </div>
          <div>
            <h5 className="text-xs font-black text-stone-700">{t.waterTitle}</h5>
            <p className="text-xs text-stone-500 mt-0.5 leading-relaxed font-medium">
              {spec.waterLabel[language]}
            </p>
          </div>
        </div>

        <div className="flex gap-3 items-start p-1.5">
          <div className="w-8 h-8 rounded-full bg-green-50 text-primary flex items-center justify-center shrink-0 mt-0.5">
            <Layers size={16} />
          </div>
          <div>
            <h5 className="text-xs font-black text-stone-700">{t.fertilizerTitle}</h5>
            <p className="text-xs text-stone-500 mt-0.5 leading-relaxed font-medium">
              {spec.fertilizerFreq[language]}
            </p>
          </div>
        </div>
      </div>

      {/* Daily Checklist Routine */}
      <div className="space-y-3 pt-3 border-t border-stone-50">
        <div className="flex justify-between items-center">
          <h4 className="text-xs font-black uppercase tracking-widest text-stone-400">
            {t.routineTitle}
          </h4>
          <span className="text-[10px] font-black text-primary bg-primary/5 px-2.5 py-1 rounded-full">
            {completedCount}/{totalCount} {t.completed}
          </span>
        </div>

        <div className="space-y-2">
          {itemsList.map((item, idx) => {
            const isChecked = !!checkedItems[idx];
            return (
              <motion.div 
                key={idx}
                onClick={() => handleToggle(idx)}
                className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer select-none active:scale-[0.99] ${
                  isChecked 
                    ? 'bg-emerald-50/40 border-emerald-100 text-stone-500' 
                    : 'bg-white border-stone-100 text-stone-700 hover:border-stone-200'
                }`}
              >
                <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                  isChecked 
                    ? 'bg-emerald-500 border-emerald-500 text-white' 
                    : 'border-stone-300 bg-white'
                }`}>
                  {isChecked && <Check size={12} strokeWidth={3} />}
                </div>
                <span className={`text-xs font-semibold leading-relaxed transition-all ${
                  isChecked ? 'line-through opacity-75' : ''
                }`}>
                  {item}
                </span>
              </motion.div>
            );
          })}
        </div>

        <AnimatePresence>
          {isAllDone && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl text-center text-xs font-black text-emerald-800 flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={16} className="text-emerald-600 animate-bounce" />
              <span>{t.doneAll}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Ask AI CTA */}
      <button
        onClick={handleAskAIAboutTips}
        className="w-full py-4 px-4 bg-stone-900 text-white rounded-2xl text-xs font-black hover:bg-stone-800 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-stone-900/10"
      >
        <Sparkles size={14} className="text-amber-400" />
        <span>{t.askAIBtn}</span>
        <ChevronRight size={14} className="opacity-60 ml-1" />
      </button>
    </motion.section>
  );
};
