import { Language } from '../types';

export interface GovtScheme {
  id: number;
  title: string;
  shortName: string;
  category: 'income' | 'insurance' | 'credit' | 'irrigation' | 'machinery' | 'organic' | 'soil' | 'state';
  desc: string;
  department: string;
  benefit: string;
  applyUrl: string;
  portalName: string;
  documents: string[];
  helpline?: string;
  keyHighlights: string[];
  applicableCrops: string[]; // 'all' or list of crops
  minLandAcres?: number;
  maxLandAcres?: number;
}

export interface SchemeEvaluation {
  schemeId: number;
  status: 'eligible' | 'likely' | 'check';
  matchScore: number;
  reason: string;
  benefitHighlight: string;
}

export const GOVT_SCHEMES: GovtScheme[] = [
  {
    id: 1,
    title: "PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)",
    shortName: "PM-KISAN",
    category: "income",
    desc: "Income support of ₹6,000 per year in three equal installments of ₹2,000 directly transferred into the Aadhaar-linked bank accounts of all landholding farmer families.",
    department: "Ministry of Agriculture & Farmers Welfare, GoI",
    benefit: "₹6,000 / year (Direct DBT in 3 installments)",
    applyUrl: "https://pmkisan.gov.in/RegistrationFormNew.aspx",
    portalName: "pmkisan.gov.in (New Farmer Registration)",
    helpline: "155261 / 011-24300606",
    applicableCrops: ['all'],
    documents: [
      "Aadhaar Card (linked to Mobile & Bank)",
      "Land Ownership Documents (Patta / Chitta / 7/12)",
      "Bank Passbook with active DBT / NPCI linkage",
      "Valid Mobile Number for e-KYC OTP"
    ],
    keyHighlights: [
      "100% centrally funded direct benefit transfer",
      "Available to all cultivable landholding farmer families",
      "Mandatory e-KYC completed online or via CSC centres",
      "Instant registration tracking using Aadhaar number"
    ]
  },
  {
    id: 2,
    title: "PM Fasal Bima Yojana (PMFBY)",
    shortName: "PMFBY Crop Insurance",
    category: "insurance",
    desc: "Comprehensive crop insurance cover from pre-sowing to post-harvest against non-preventable natural risks (drought, flood, unseasonal rain, pests, diseases).",
    department: "Department of Agriculture & Farmers Welfare, GoI",
    benefit: "Subsidized Crop Insurance (1.5% - 2% Premium)",
    applyUrl: "https://pmfby.gov.in/farmerRegistrationForm",
    portalName: "pmfby.gov.in (Farmer Registration Portal)",
    helpline: "1800-180-1551",
    applicableCrops: ['all'],
    documents: [
      "Aadhaar Card copy",
      "Land Ownership Proof (Patta/Passbook) or Tenancy Agreement",
      "Sowing Certificate (VAO / Patwari / Village Officer issued)",
      "Cancelled Cheque or Bank Passbook copy"
    ],
    keyHighlights: [
      "Nominal premium: 2% for Kharif crops, 1.5% for Rabi, 5% for commercial/horticulture",
      "Remaining premium heavily subsidized by Central and State Governments",
      "Covers standing crop damage, prevented sowing, and post-harvest losses within 14 days",
      "Claims directly settled via electronic transfer to bank account"
    ]
  },
  {
    id: 3,
    title: "Kisan Credit Card (KCC) via JanSamarth",
    shortName: "Kisan Credit Card",
    category: "credit",
    desc: "Provides institutional credit for cultivation expenses, post-harvest costs, and farm maintenance at a highly concessional interest rate with flexible revolving credit limits.",
    department: "Department of Financial Services & NABARD, GoI",
    benefit: "Loans up to ₹3 Lakh @ 4% effective interest rate",
    applyUrl: "https://www.jansamarth.in/apply/kcc",
    portalName: "jansamarth.in (National Credit Portal for KCC)",
    helpline: "1800-11-5526",
    applicableCrops: ['all'],
    documents: [
      "Completed KCC Application Form",
      "Identity Proof (Aadhaar / Voter ID / PAN)",
      "Land Revenue Records (Patta / Chitta / Land Tax Receipt)",
      "Crop Sowing Details & Cultivation Area Declaration"
    ],
    keyHighlights: [
      "Collateral-free credit limit up to ₹1.60 Lakh (extended to ₹3 Lakh for prompt payers)",
      "7% base interest with 3% prompt repayment incentive = effective 4% interest rate",
      "Covers crops, dairy, poultry, fishery, and farm equipment inputs",
      "Includes free accidental insurance cover up to ₹50,000"
    ]
  },
  {
    id: 4,
    title: "Soil Health Card Scheme (SHC)",
    shortName: "Soil Health Card",
    category: "soil",
    desc: "Promotes balanced nutrient application by issuing comprehensive soil health report cards assessing 12 chemical parameters with tailored fertilizer and bio-manure recommendations.",
    department: "Ministry of Agriculture & Farmers Welfare, GoI",
    benefit: "Free Soil Testing & Personalized Fertilizer Schedule",
    applyUrl: "https://soilhealth.dac.gov.in/",
    portalName: "soilhealth.dac.gov.in (National Soil Health Portal)",
    helpline: "011-23381012",
    applicableCrops: ['all'],
    documents: [
      "Aadhaar Card",
      "Survey / Sub-Division / Khasra Number details",
      "Farmer Mobile Number",
      "Soil sample submission at nearest AEC or KVK"
    ],
    keyHighlights: [
      "Tests N, P, K, S, Zn, Fe, Cu, Mn, B, pH, EC, and Organic Carbon",
      "Reduces fertilizer cost by 15-20% and prevents soil degradation",
      "Renewed every 2 years for each agricultural holding",
      "Direct recommendations delivered via SMS in local language"
    ]
  },
  {
    id: 5,
    title: "PM Krishi Sinchayee Yojana (PMKSY - Micro Irrigation)",
    shortName: "PMKSY (Drip & Sprinkler)",
    category: "irrigation",
    desc: "Subsidies for installation of drip and sprinkler micro-irrigation systems to maximize water use efficiency ('Per Drop More Crop') and enhance crop productivity.",
    department: "Ministry of Agriculture & Farmers Welfare, GoI",
    benefit: "Up to 55% - 70% Subsidy (Up to 100% in TN for small farmers)",
    applyUrl: "https://pmksy.gov.in/",
    portalName: "pmksy.gov.in (Micro Irrigation Portal)",
    helpline: "011-23383370",
    applicableCrops: ['all'],
    maxLandAcres: 12.5,
    documents: [
      "Land Patta / Chitta & FMB Field Sketch",
      "Water Source Certificate (Well / Borewell availability)",
      "Electricity Connection Details / Solar Pump proof",
      "Aadhaar Card and Bank Passbook"
    ],
    keyHighlights: [
      "55% subsidy for small and marginal farmers, 45% for other farmers",
      "Tamil Nadu provides 100% subsidy for small/marginal farmers and 75% for others",
      "Saves up to 40-50% water while increasing yield by 30-40%",
      "Subsidy disbursed directly to authorized micro-irrigation system vendors"
    ]
  },
  {
    id: 6,
    title: "Sub-Mission on Agricultural Mechanization (SMAM)",
    shortName: "SMAM Machinery Subsidy",
    category: "machinery",
    desc: "Financial assistance to farmers for purchasing agricultural machinery, power tillers, rotavators, tractors, harvesters, and high-efficiency sprayers.",
    department: "Mechanization and Technology Division, DA&FW",
    benefit: "40% to 50% Capital Subsidy on Farm Equipment",
    applyUrl: "https://agrimachinery.nic.in/Index/FarmerRegistration",
    portalName: "agrimachinery.nic.in (Farmer Registration)",
    helpline: "011-23382922",
    applicableCrops: ['all'],
    documents: [
      "Aadhaar Card and Passport Photo",
      "Land Ownership Document (Patta / RoR)",
      "Bank Account Passbook (Aadhaar linked)",
      "Quotation from Authorized Equipment Dealer"
    ],
    keyHighlights: [
      "40% to 50% subsidy for individual farmers (up to 80% for Custom Hiring Centers)",
      "Special priority and enhanced subsidy for women, SC/ST, and small/marginal farmers",
      "Direct registration and dealer selection on the national portal",
      "Direct DBT transfer of subsidy amount to bank account"
    ]
  },
  {
    id: 7,
    title: "Paramparagat Krishi Vikas Yojana (PKVY)",
    shortName: "PKVY Organic Farming",
    category: "organic",
    desc: "Promotes organic farming through cluster approach and Participatory Guarantee System (PGS) certification, supporting chemical-free sustainable agriculture.",
    department: "National Centre of Organic and Natural Farming, GoI",
    benefit: "₹50,000 / hectare Financial Assistance over 3 years",
    applyUrl: "https://pgsindia-ncof.gov.in/",
    portalName: "pgsindia-ncof.gov.in (PGS Organic Certification)",
    helpline: "0120-2764906",
    applicableCrops: ['all'],
    documents: [
      "Aadhaar Card",
      "Land Patta / Land Holding Proof",
      "Cluster Membership Form (group of 20+ farmers)",
      "Bank Passbook copy"
    ],
    keyHighlights: [
      "₹31,000/ha allocated directly for on-farm organic inputs (neem cake, vermicompost, bio-agents)",
      "Free PGS-India organic certification and pesticide residue testing",
      "Dedicated market linkages and farmer-producer collective branding",
      "Premium price realization in organic domestic and export markets"
    ]
  },
  {
    id: 8,
    title: "State Agriculture & Uzhavan Portal (Agrisnet / State Portal)",
    shortName: "State Agri Portal / Uzhavan",
    category: "state",
    desc: "State agricultural department portal offering direct access to certified seed subsidies, bio-fertilizer kits, solar pump grants, and agricultural extension services.",
    department: "Department of Agriculture & Farmers Welfare, State Govt",
    benefit: "50% Seed Subsidy, Bio-Kits & Farm Tool Grants",
    applyUrl: "https://agrisnet.tn.gov.in/",
    portalName: "agrisnet.tn.gov.in / State Agriculture Portal",
    helpline: "1800-425-2444",
    applicableCrops: ['all'],
    documents: [
      "Aadhaar Card",
      "Farmer ID / Uzhavan App Registration Number",
      "Land Chitta / Patta and Adangal",
      "Active Bank Account with IFSC"
    ],
    keyHighlights: [
      "50% subsidy on high-yielding certified seeds (Paddy, Pulses, Oilseeds, Millets)",
      "Free distribution of bio-fertilizers and bio-pesticides for integrated pest management",
      "Application tracking via Uzhavan mobile app and Block AECs",
      "Special subsidies for solar pumpsets and farm ponds"
    ]
  }
];

export interface FarmerProfileForEvaluation {
  name: string;
  location: string;
  crops: string;
  farmSize: string;
  farmUnit: string;
  soilType?: string;
}

export function evaluateFarmerEligibility(
  scheme: GovtScheme,
  profile: FarmerProfileForEvaluation,
  lang: Language
): SchemeEvaluation {
  const isTa = lang === 'ta';
  const isHi = lang === 'hi';

  const locationParts = (profile.location || 'Salem, Tamil Nadu').split(',');
  const district = locationParts[0]?.trim() || 'Your District';
  const state = locationParts[1]?.trim() || locationParts[0]?.trim() || 'India';
  const crop = profile.crops || 'Paddy';
  const farmSizeNum = parseFloat(profile.farmSize) || 2;
  const unit = profile.farmUnit || 'Acres';

  // Normalize acres
  let acres = farmSizeNum;
  if (unit.toLowerCase().includes('hectare')) {
    acres = farmSizeNum * 2.471;
  } else if (unit.toLowerCase().includes('bigha')) {
    acres = farmSizeNum * 0.4;
  } else if (unit.toLowerCase().includes('gunta')) {
    acres = farmSizeNum * 0.025;
  }

  const isSmallOrMarginal = acres <= 5.0; // Under 2 hectares (~5 acres) is small/marginal

  switch (scheme.id) {
    case 1: {
      // PM-KISAN
      const matchScore = 98;
      const reason = isTa
        ? `உங்கள் சுயவிவரப்படி, நீங்கள் ${district}, ${state} பகுதியில் ${farmSizeNum} ${unit} நிலத்தில் ${crop} சாகுபடி செய்யும் விவசாயி. நில உரிமை மற்றும் சிறு/குறு விவசாயி வரம்புக்குள் நீங்கள் வருவதால் ஆண்டுக்கு ₹6,000 நேரடி உதவித்தொகை பெற நீங்கள் முழு தகுதியுடையவர்.`
        : isHi
        ? `आपके प्रोफ़ाइल के अनुसार, आप ${district}, ${state} में ${farmSizeNum} ${unit} भूमि पर ${crop} की खेती कर रहे हैं। भूमि स्वामित्व और किसान मानदंडों के तहत आप ₹6,000 वार्षिक प्रत्यक्ष सहायता के लिए पूर्णतः पात्र हैं।`
        : `Based on your profile as an active farmer cultivating ${crop} across ${farmSizeNum} ${unit} in ${district}, ${state}, you meet all landholding and occupation eligibility criteria for the ₹6,000/yr direct benefit transfer.`;
      
      const summary = isTa ? "100% நேரடி வங்கி வரவு தகுதி" : isHi ? "100% प्रत्यक्ष बैंक अंतरण पात्रता" : "100% Direct Benefit Transfer Eligible";
      return { schemeId: 1, status: 'eligible', matchScore, reason, benefitHighlight: summary };
    }

    case 2: {
      // PMFBY
      const matchScore = 96;
      const reason = isTa
        ? `${district} மாவட்டத்தில் உங்கள் முதன்மை பயிரான ${crop} அறிவிக்கப்பட்ட பயிர்களில் ஒன்றாகும் (Notified Crop). இயற்கை இடர்பாடுகள் மற்றும் பூச்சி தாக்குதலில் இருந்து பயிரைப் பாதுகாக்க 1.5% - 2% குறைந்த பிரீமியத்தில் நீங்கள் காப்பீடு செய்ய தகுதியுடையவர்.`
        : isHi
        ? `${district} जिले में आपकी मुख्य फसल ${crop} अधिसूचित फसलों (Notified Crops) में शामिल है। प्राकृतिक आपदाओं और कीट जोखिमों के खिलाफ 1.5% - 2% नाममात्र प्रीमियम पर आप बीमा के लिए पात्र हैं।`
        : `In ${district}, your crop ${crop} is an officially notified crop under PMFBY. You qualify for comprehensive crop loss protection from sowing to harvest at nominal 1.5% - 2% premium rates.`;
      
      const summary = isTa ? "அறிவிக்கப்பட்ட பயிர் காப்பீட்டு தகுதி" : isHi ? "अधिसूचित फसल बीमा पात्रता" : "Notified Crop Insurance Eligible";
      return { schemeId: 2, status: 'eligible', matchScore, reason, benefitHighlight: summary };
    }

    case 3: {
      // Kisan Credit Card
      const matchScore = 95;
      const reason = isTa
        ? `${farmSizeNum} ${unit} நிலத்தில் ${crop} சாகுபடிக்கான விதை, உரம் மற்றும் பராமரிப்பு செலவுகளுக்கு ₹1,60,000 பிணையமற்ற (Collateral-free) கடன் மற்றும் ஆண்டுக்கு ₹3,00,000 வரை 4% சலுகை வட்டியில் KCC கடன் பெற தகுதியுடையவர்.`
        : isHi
        ? `${farmSizeNum} ${unit} भूमि पर ${crop} की खेती के खर्चों के लिए ₹1.60 लाख तक बिना गारंटी ऋण और कुल ₹3 लाख तक रियायती 4% ब्याज पर KCC प्राप्त करने के पात्र हैं।`
        : `For your ${crop} cultivation across ${farmSizeNum} ${unit}, you qualify for collateral-free operational credit up to ₹1.60 Lakh and up to ₹3 Lakh at an effective 4% subsidized interest rate via JanSamarth.`;
      
      const summary = isTa ? "4% சலுகை வட்டி கடன் தகுதி" : isHi ? "4% रियायती ब्याज ऋण पात्रता" : "Concessional 4% Credit Eligible";
      return { schemeId: 3, status: 'eligible', matchScore, reason, benefitHighlight: summary };
    }

    case 4: {
      // Soil Health Card
      const matchScore = 99;
      const reason = isTa
        ? `${district} பகுதியிலுள்ள உங்கள் விளைநிலத்திற்கு 12 ஊட்டச்சத்து அளவுருக்களைக் கொண்ட இலவச மண் பரிசோதனை அட்டை பெறலாம். உங்களின் ${crop} பயிருக்கு ஏற்ற உர அளவீடுகளை இதன் மூலம் பெற தகுதியுடையவர்.`
        : isHi
        ? `${district} में आपकी कृषि भूमि के लिए 12 पोषक तत्वों की निशुल्क जांच रिपोर्ट और ${crop} फसल के लिए सटीक संतुलित खाद परामर्श पाने के आप पूर्णतः पात्र हैं।`
        : `Eligible for completely free soil nutrient testing across 12 chemical parameters in ${district}, with customized NPK and micronutrient recommendations for your ${crop} crop.`;
      
      const summary = isTa ? "இலவச மண் பரிசோதனை தகுதி" : isHi ? "निशुल्क मृदा परीक्षण पात्रता" : "Free Soil Health Audit Eligible";
      return { schemeId: 4, status: 'eligible', matchScore, reason, benefitHighlight: summary };
    }

    case 5: {
      // PMKSY Micro-irrigation
      const matchScore = isSmallOrMarginal ? 94 : 85;
      const reason = isTa
        ? isSmallOrMarginal
          ? `நீங்கள் ${farmSizeNum} ${unit} நிலம் கொண்ட சிறு/குறு விவசாயி என்பதால், ${district} பகுதியில் சொட்டு நீர் / தெளிப்பு நீர் பாசனம் அமைக்க 70% முதல் 100% வரை அரசு மானியம் பெற நீங்கள் முன்னுரிமை தகுதியுடையவர்.`
          : `${farmSizeNum} ${unit} நிலத்தில் நீர் மேலாண்மையை மேம்படுத்த சொட்டு நீர் பாசன உபகரணங்களுக்கு 45% - 55% மானியம் பெற நீங்கள் தகுதியுடையவர்.`
        : isHi
        ? isSmallOrMarginal
          ? `आप ${farmSizeNum} ${unit} भूमि वाले छोटे/सीमांत किसान हैं, अतः ${district} में ड्रिप एवं स्प्रिंकलर सिंचाई के लिए 70% से 100% तक की अधिकतम सब्सिडी पाने के प्राथमिकता पात्र हैं।`
          : `${farmSizeNum} ${unit} भूमि में सूक्ष्म सिंचाई प्रणाली के लिए 45% से 55% सरकारी सब्सिडी पाने के पात्र हैं।`
        : isSmallOrMarginal
        ? `As a small/marginal farmer with ${farmSizeNum} ${unit} in ${district}, you qualify for the maximum priority subsidy (55% - 70% Central, up to 100% in TN) on Drip and Sprinkler irrigation systems.`
        : `Qualifies for 45% - 55% standard subsidy for micro-irrigation installation to optimize water efficiency on your ${farmSizeNum} ${unit} landholding.`;
      
      const summary = isTa ? (isSmallOrMarginal ? "அதிகபட்ச 70-100% பாசன மானியம்" : "55% பாசன மானியம்") : isHi ? (isSmallOrMarginal ? "अधिकतम 70-100% सिंचाई सब्सिडी" : "55% सिंचाई सब्सिडी") : (isSmallOrMarginal ? "Priority 70-100% Subsidy" : "Standard 55% Subsidy");
      return { schemeId: 5, status: 'eligible', matchScore, reason, benefitHighlight: summary };
    }

    case 6: {
      // SMAM Machinery
      const matchScore = isSmallOrMarginal ? 92 : 82;
      const reason = isTa
        ? `${crop} சாகுபடிக்கு தேவையான பவர் டில்லர், டிராக்டர் உபகரணங்கள் மற்றும் ஸ்பிரேயர்களுக்கு 40% முதல் 50% வரை நேரடி அரசு மானியம் பெற தகுதியுடையவர்.`
        : isHi
        ? `${crop} की खेती के लिए आवश्यक पावर टिलर, ट्रैक्टर उपकरण और स्प्रेयर पर 40% से 50% प्रत्यक्ष सरकारी सब्सिडी पाने के पात्र हैं।`
        : `Eligible for 40% to 50% capital subsidy on mechanized farm implements, power tillers, rotavators, and sprayers suited for ${crop} farming in ${district}.`;
      
      const summary = isTa ? "40% - 50% உபகரண மானியம்" : isHi ? "40% - 50% कृषि यंत्र सब्सिडी" : "40% - 50% Machine Subsidy";
      return { schemeId: 6, status: 'eligible', matchScore, reason, benefitHighlight: summary };
    }

    case 7: {
      // PKVY Organic
      const matchScore = 88;
      const reason = isTa
        ? `${district} பகுதியில் இயற்கை விவசாயத்திற்கு மாற விரும்பினால், 3 ஆண்டுகளுக்கு ஹெக்டேருக்கு ₹50,000 நிதி உதவி மற்றும் இலவச PGS இயற்கை சான்றிதழ் பெற தகுதியுடையவர்.`
        : isHi
        ? `${district} में जैविक खेती अपनाने के लिए 3 वर्षों में ₹50,000 प्रति हेक्टेयर सहायता और निशुल्क पीजीएस जैविक प्रमाणन प्राप्त करने के पात्र हैं।`
        : `Eligible for ₹50,000/hectare assistance over 3 years and free PGS-India organic certification upon participating in a local farmer organic cluster in ${district}.`;
      
      const summary = isTa ? "₹50,000/ஹெக்டேர் இயற்கை வேளாண் உதவி" : isHi ? "₹50,000/हेक्टेयर जैविक सहायता" : "₹50,000/ha Organic Grant";
      return { schemeId: 7, status: 'likely', matchScore, reason, benefitHighlight: summary };
    }

    case 8: {
      // State Agri Portal
      const isTamilNadu = state.toLowerCase().includes('tamil') || district.toLowerCase().includes('chennai') || district.toLowerCase().includes('salem') || district.toLowerCase().includes('coimbatore') || district.toLowerCase().includes('madurai');
      const matchScore = isTamilNadu ? 98 : 85;
      const reason = isTa
        ? `உழவன் போர்டல் மற்றும் வட்டார வேளாண்மை விரிவாக்க மையம் (AEC) மூலம் ${crop} சான்று பெற்ற விதைகள், நுண்ணுயிர் உரங்கள் மற்றும் வேளாண் உபகரணங்களுக்கு 50% மானியம் பெற முழு தகுதி பெற்றுள்ளீர்கள்.`
        : isHi
        ? `राज्य कृषि पोर्टल और स्थानीय कृषि विस्तार केंद्र (AEC) के माध्यम से ${crop} प्रमाणित बीज, जैव-उर्वरक और कृषि उपकरणों पर 50% सब्सिडी के लिए पात्र हैं।`
        : `Eligible for 50% certified seed subsidy, bio-fertilizer kits, and local agricultural grants directly through the State Agriculture Department / Uzhavan portal in ${district}.`;
      
      const summary = isTa ? "50% விதை மற்றும் உள்ளூர் மானியம்" : isHi ? "50% बीज व राज्य सब्सिडी" : "50% Seed & State Subsidy";
      return { schemeId: 8, status: 'eligible', matchScore, reason, benefitHighlight: summary };
    }

    default:
      return {
        schemeId: scheme.id,
        status: 'likely',
        matchScore: 85,
        reason: isTa ? "விவசாயி விவரங்களின் அடிப்படையில் இத்திட்டத்திற்கு நீங்கள் தகுதியுடையவர்." : isHi ? "किसान प्रोफ़ाइल के अनुसार आप इस योजना के लिए पात्र हैं।" : "Eligible based on registered farmer profile criteria.",
        benefitHighlight: isTa ? "அரசு உதவி தகுதி" : isHi ? "सरकारी सहायता पात्रता" : "Govt Assistance Eligible"
      };
  }
}
