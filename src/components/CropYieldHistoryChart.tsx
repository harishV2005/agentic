import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ReferenceLine,
  Cell
} from 'recharts';
import { CropHistory, Language } from '../types';
import { 
  TrendingUp, 
  TrendingDown, 
  Award, 
  BarChart2, 
  LineChart as LineChartIcon, 
  Sprout, 
  Info, 
  Sparkles,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { cn } from '../lib/utils';

export interface CropYieldHistoryChartProps {
  cropHistoryList: CropHistory[];
  primaryCrop?: string;
  language: Language;
  farmUnit?: string;
  farmSize?: string;
  onAddRecordClick?: () => void;
}

// Regional benchmark multi-year historical yield baselines (kg/acre) for Indian agro-climates
const REGIONAL_BENCHMARKS: Record<string, {
  unit: string;
  benchmarkAvg: number;
  data: { year: number; season: string; yield: number; notes: string }[];
}> = {
  Paddy: {
    unit: 'kg/acre',
    benchmarkAvg: 2050,
    data: [
      { year: 2020, season: 'Kharif', yield: 1820, notes: 'Normal monsoon, standard canal irrigation' },
      { year: 2021, season: 'Kharif', yield: 1940, notes: 'Favorable rainfall, urea + DAP application' },
      { year: 2022, season: 'Kharif', yield: 1890, notes: 'Short dry spell in tillering stage' },
      { year: 2023, season: 'Kharif', yield: 2150, notes: 'Improved hybrid seeds & timely weed management' },
      { year: 2024, season: 'Kharif', yield: 2280, notes: 'Optimal micronutrient spray and SRI methods' },
      { year: 2025, season: 'Kharif', yield: 2360, notes: 'Precision irrigation & bio-fertilizer trial' },
    ]
  },
  Wheat: {
    unit: 'kg/acre',
    benchmarkAvg: 1850,
    data: [
      { year: 2020, season: 'Rabi', yield: 1650, notes: 'Late winter rains, mild cold wave' },
      { year: 2021, season: 'Rabi', yield: 1780, notes: 'Good tillering, 3 critical irrigations' },
      { year: 2022, season: 'Rabi', yield: 1720, notes: 'Early heat wave in March affected grain filling' },
      { year: 2023, season: 'Rabi', yield: 1910, notes: 'Heat-resistant HD-3226 variety planted' },
      { year: 2024, season: 'Rabi', yield: 2040, notes: 'Balanced NPK & timely fungicide spray' },
      { year: 2025, season: 'Rabi', yield: 2120, notes: 'Zinc sulfate fortification boosted yields' },
    ]
  },
  Cotton: {
    unit: 'kg/acre',
    benchmarkAvg: 920,
    data: [
      { year: 2020, season: 'Kharif', yield: 780, notes: 'Bollworm incidence managed with neem oil' },
      { year: 2021, season: 'Kharif', yield: 840, notes: 'Uniform square formation & drip fertigation' },
      { year: 2022, season: 'Kharif', yield: 810, notes: 'Excess late rains delayed boll opening' },
      { year: 2023, season: 'Kharif', yield: 960, notes: 'High density planting system (HDPS)' },
      { year: 2024, season: 'Kharif', yield: 1040, notes: 'Clean picking, 3 flush cycles' },
      { year: 2025, season: 'Kharif', yield: 1090, notes: 'Pheromone traps & optimal defoliant use' },
    ]
  },
  Sugarcane: {
    unit: 'tons/acre',
    benchmarkAvg: 40,
    data: [
      { year: 2020, season: 'Annual', yield: 34, notes: 'Ratoon crop, regular trench irrigation' },
      { year: 2021, season: 'Annual', yield: 37, notes: 'Trash mulching conserved root moisture' },
      { year: 2022, season: 'Annual', yield: 39, notes: 'Fresh sett planting with Co-0238' },
      { year: 2023, season: 'Annual', yield: 42, notes: 'Drip fertigation installed across plot' },
      { year: 2024, season: 'Annual', yield: 44, notes: 'Good cane girth and high sugar recovery' },
      { year: 2025, season: 'Annual', yield: 46, notes: 'Deep subsoiling and press-mud compost' },
    ]
  },
  Maize: {
    unit: 'kg/acre',
    benchmarkAvg: 2600,
    data: [
      { year: 2020, season: 'Kharif', yield: 2200, notes: 'Standard grain hybrid' },
      { year: 2021, season: 'Kharif', yield: 2450, notes: 'Fall armyworm tracked with pheromones' },
      { year: 2022, season: 'Kharif', yield: 2400, notes: 'Dry spell during silking' },
      { year: 2023, season: 'Kharif', yield: 2750, notes: 'Single cross hybrid & potash top-dress' },
      { year: 2024, season: 'Kharif', yield: 2900, notes: 'Intercropped with cowpea, soil enriched' },
      { year: 2025, season: 'Kharif', yield: 3050, notes: 'Precision mechanical weeding' },
    ]
  },
  Tomato: {
    unit: 'kg/acre',
    benchmarkAvg: 10500,
    data: [
      { year: 2020, season: 'Rabi', yield: 8800, notes: 'Open field trellis cultivation' },
      { year: 2021, season: 'Rabi', yield: 9500, notes: 'Drip irrigation & silver-black mulching' },
      { year: 2022, season: 'Rabi', yield: 9200, notes: 'Early blight managed with copper sprays' },
      { year: 2023, season: 'Rabi', yield: 11200, notes: 'Indeterminate F1 hybrid with staking' },
      { year: 2024, season: 'Rabi', yield: 12400, notes: 'Calcium nitrate foliar spray reduced rot' },
      { year: 2025, season: 'Rabi', yield: 13100, notes: 'Extended harvest window of 12 weeks' },
    ]
  },
  Groundnut: {
    unit: 'kg/acre',
    benchmarkAvg: 1150,
    data: [
      { year: 2020, season: 'Kharif', yield: 950, notes: 'Rainfed semi-spreading variety' },
      { year: 2021, season: 'Kharif', yield: 1080, notes: 'Gypsum application at pegging stage' },
      { year: 2022, season: 'Kharif', yield: 1020, notes: 'Leaf spot monitored and treated' },
      { year: 2023, season: 'Kharif', yield: 1220, notes: 'Rhizobium seed inoculation' },
      { year: 2024, season: 'Kharif', yield: 1310, notes: 'Sprinkler irrigation at pod development' },
      { year: 2025, season: 'Kharif', yield: 1380, notes: 'High shell-out ratio and bold pods' },
    ]
  }
};

/**
 * Robust parser converting freeform yield strings (e.g. "1800 kg/acre", "2.4 tons", "22 quintals")
 * into a standardized numeric value.
 */
function parseYieldNumber(str: string): number {
  if (!str) return 0;
  const clean = str.toLowerCase().replace(/,/g, '');
  const match = clean.match(/([0-9]+(?:\.[0-9]+)?)/);
  if (!match) return 0;
  let val = parseFloat(match[1]);
  if (clean.includes('ton') || clean.includes('tonne')) {
    val = val * 1000;
  } else if (clean.includes('quintal') || clean.includes('qtl')) {
    val = val * 100;
  } else if (clean.includes('bag')) {
    val = val * 75;
  }
  return Math.round(val);
}

export const CropYieldHistoryChart: React.FC<CropYieldHistoryChartProps> = ({
  cropHistoryList = [],
  primaryCrop = 'Paddy',
  language = 'en',
  farmUnit = 'Acres',
  farmSize = '',
  onAddRecordClick
}) => {
  // Chart visual type: 'area' or 'bar'
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');
  const [showBenchmarkLine, setShowBenchmarkLine] = useState<boolean>(true);

  // Available crops list: user-recorded crops + primary crop + benchmark crops
  const availableCrops = useMemo(() => {
    const cropsSet = new Set<string>();
    
    // Primary crop
    if (primaryCrop && primaryCrop.trim()) {
      cropsSet.add(primaryCrop.trim());
    }
    
    // User recorded crops
    cropHistoryList.forEach(item => {
      if (item.cropName && item.cropName.trim()) {
        cropsSet.add(item.cropName.trim());
      }
    });

    // Ensure common benchmark staples are available
    Object.keys(REGIONAL_BENCHMARKS).forEach(crop => cropsSet.add(crop));

    return Array.from(cropsSet);
  }, [cropHistoryList, primaryCrop]);

  // Selected crop for the visualization
  const [selectedCrop, setSelectedCrop] = useState<string>(() => {
    if (primaryCrop && availableCrops.includes(primaryCrop)) return primaryCrop;
    if (availableCrops.length > 0) return availableCrops[0];
    return 'Paddy';
  });

  // Keep selectedCrop valid if availableCrops changes
  useMemo(() => {
    if (!availableCrops.includes(selectedCrop) && availableCrops.length > 0) {
      setSelectedCrop(availableCrops[0]);
    }
  }, [availableCrops, selectedCrop]);

  // Filter user records for the selected crop
  const userCropRecords = useMemo(() => {
    const target = selectedCrop.toLowerCase().trim();
    return cropHistoryList
      .filter(item => (item.cropName || '').toLowerCase().trim() === target)
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        // Kharif then Rabi then Summer
        const seasonOrder: Record<string, number> = { 'kharif': 1, 'rabi': 2, 'summer': 3, 'zaid': 3, 'annual': 4 };
        const orderA = seasonOrder[(a.season || '').toLowerCase()] || 0;
        const orderB = seasonOrder[(b.season || '').toLowerCase()] || 0;
        return orderA - orderB;
      });
  }, [cropHistoryList, selectedCrop]);

  // Check if user has their own data for this crop
  const hasUserRecords = userCropRecords.length > 0;

  // Benchmark info
  const benchmarkInfo = REGIONAL_BENCHMARKS[selectedCrop] || REGIONAL_BENCHMARKS['Paddy'];

  // Construct chart dataset
  const chartData = useMemo(() => {
    if (hasUserRecords) {
      // Map user records
      return userCropRecords.map((item, index) => {
        const numericVal = parseYieldNumber(item.yieldValue);
        const prevYield = index > 0 ? parseYieldNumber(userCropRecords[index - 1].yieldValue) : null;
        const diffPercent = prevYield && prevYield > 0 ? Math.round(((numericVal - prevYield) / prevYield) * 100) : null;

        return {
          id: item.id || `${item.year}-${item.season}`,
          year: item.year,
          season: item.season,
          label: `${item.year} ${item.season ? item.season.slice(0, 3) : ''}`.trim(),
          yield: numericVal,
          displayYield: item.yieldValue,
          notes: item.notes || '',
          isUserRecord: true,
          diffPercent,
          unit: 'kg/acre'
        };
      });
    }

    // Otherwise, plot the regional historical benchmark dataset
    return benchmarkInfo.data.map((item, index) => {
      const prevYield = index > 0 ? benchmarkInfo.data[index - 1].yield : null;
      const diffPercent = prevYield ? Math.round(((item.yield - prevYield) / prevYield) * 100) : null;

      return {
        id: `bm-${item.year}-${item.season}`,
        year: item.year,
        season: item.season,
        label: `${item.year} ${item.season ? item.season.slice(0, 3) : ''}`.trim(),
        yield: item.yield,
        displayYield: `${item.yield} ${benchmarkInfo.unit}`,
        notes: item.notes,
        isUserRecord: false,
        diffPercent,
        unit: benchmarkInfo.unit
      };
    });
  }, [hasUserRecords, userCropRecords, benchmarkInfo]);

  // Key performance indicators
  const kpiData = useMemo(() => {
    if (chartData.length === 0) {
      return {
        avgYield: 0,
        peakYield: 0,
        peakYear: '-',
        growthRate: 0,
        trendDirection: 'stable' as 'up' | 'down' | 'stable'
      };
    }

    const yields = chartData.map(d => d.yield).filter(y => y > 0);
    const avg = yields.length > 0 ? Math.round(yields.reduce((a, b) => a + b, 0) / yields.length) : 0;
    
    let max = 0;
    let maxLabel = '-';
    chartData.forEach(d => {
      if (d.yield > max) {
        max = d.yield;
        maxLabel = `${d.year} ${d.season || ''}`.trim();
      }
    });

    // Growth from earliest year to latest year
    let growthRate = 0;
    if (chartData.length >= 2) {
      const first = chartData[0].yield;
      const last = chartData[chartData.length - 1].yield;
      if (first > 0) {
        growthRate = Math.round(((last - first) / first) * 100);
      }
    }

    const trendDirection: 'up' | 'down' | 'stable' = 
      growthRate >= 3 ? 'up' : growthRate <= -3 ? 'down' : 'stable';

    return {
      avgYield: avg,
      peakYield: max,
      peakYear: maxLabel,
      growthRate,
      trendDirection
    };
  }, [chartData]);

  // Labels based on language
  const texts = useMemo(() => {
    if (language === 'ta') {
      return {
        title: 'வரலாற்று மகசூல் செயல்பாடு',
        subtitle: 'ஆண்டு வாரியாக உற்பத்தித்திறன் மற்றும் போக்குகள்',
        cropLabel: 'பயிர் தேர்வு',
        areaView: 'போக்கு வரைபடம்',
        barView: 'பருவ வாரியாக',
        avgYield: 'சராசரி மகசூல்',
        peakHarvest: 'அதிகபட்ச மகசூல்',
        productivityTrend: 'உற்பத்தித்திறன் மாற்றம்',
        baseline: 'மண்டல இலக்கு',
        userRecordNotice: 'உங்கள் பண்ணையின் பதிவு செய்யப்பட்ட அறுவடைகள்',
        benchmarkNotice: 'மண்டல மாதிரி வரலாற்று போக்குகள் (உங்கள் பண்ணை பதிவுகளை சேர்க்கவும்)',
        addRecordBtn: 'புதிய பருவத்தை சேர்',
        yieldUnit: 'கிலோ / ஏக்கர்',
        growthPositive: 'முன்னேற்றம்',
        growthNegative: 'சரிவு',
        stable: 'நிலையானது',
        vsPrev: 'முந்தைய ஆண்டை விட',
        notes: 'பருவகால குறிப்பு'
      };
    }
    if (language === 'hi') {
      return {
        title: 'ऐतिहासिक उपज प्रदर्शन',
        subtitle: 'वर्षों में फसल उत्पादकता रुझान और तुलना',
        cropLabel: 'फसल चुनें',
        areaView: 'रुझान चार्ट',
        barView: 'मौसम तुलना',
        avgYield: 'औसत उपज',
        peakHarvest: 'सर्वोत्तम उपज',
        productivityTrend: 'उत्पादकता वृद्धि',
        baseline: 'क्षेत्रीय बेंचमार्क',
        userRecordNotice: 'आपके खेत के दर्ज किए गए वास्तविक रिकॉर्ड',
        benchmarkNotice: 'क्षेत्रीय मानक ऐतिहासिक रुझान (अपने रिकॉर्ड नीचे जोड़ें)',
        addRecordBtn: 'नया रिकॉर्ड जोड़ें',
        yieldUnit: 'किग्रा / एकड़',
        growthPositive: 'सुधार',
        growthNegative: 'कमी',
        stable: 'स्थिर',
        vsPrev: 'पिछले वर्ष से',
        notes: 'सीजन की टिप्पणी'
      };
    }
    return {
      title: 'Historical Yield Performance',
      subtitle: 'Multi-year productivity trends & seasonal trajectories',
      cropLabel: 'Select Crop',
      areaView: 'Trend Area',
      barView: 'Bar Comparison',
      avgYield: 'Average Yield',
      peakHarvest: 'Peak Harvest',
      productivityTrend: 'Productivity Shift',
      baseline: 'Regional Target',
      userRecordNotice: 'Actual records from your farm field',
      benchmarkNotice: 'Regional agro-benchmark data (Add your records to replace)',
      addRecordBtn: 'Add Season Record',
      yieldUnit: 'kg / acre',
      growthPositive: 'Gain',
      growthNegative: 'Decline',
      stable: 'Steady',
      vsPrev: 'vs prior season',
      notes: 'Field Notes'
    };
  }, [language]);

  return (
    <div className="bg-white rounded-3xl border border-stone-200/80 shadow-md p-5 sm:p-6 space-y-5 transition-all">
      {/* Header & Crop Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-primary">
              <TrendingUp size={18} />
            </div>
            <h3 className="font-extrabold text-stone-800 text-base sm:text-lg tracking-tight">
              {texts.title}
            </h3>
          </div>
          <p className="text-xs text-stone-500 font-medium">
            {texts.subtitle}
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="bg-stone-100 p-1 rounded-xl flex items-center gap-1 border border-stone-200/60">
            <button
              onClick={() => setChartType('area')}
              className={cn(
                "px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                chartType === 'area'
                  ? "bg-white text-emerald-800 shadow-sm"
                  : "text-stone-500 hover:text-stone-800"
              )}
              title="Area Trend View"
            >
              <LineChartIcon size={14} />
              <span className="hidden xs:inline">{texts.areaView}</span>
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={cn(
                "px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                chartType === 'bar'
                  ? "bg-white text-emerald-800 shadow-sm"
                  : "text-stone-500 hover:text-stone-800"
              )}
              title="Bar Chart View"
            >
              <BarChart2 size={14} />
              <span className="hidden xs:inline">{texts.barView}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Crop Selector Pills */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase font-bold tracking-wider text-stone-400">
            {texts.cropLabel}
          </span>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
            {selectedCrop} ({chartData.length} {language === 'ta' ? 'பருவங்கள்' : language === 'hi' ? 'सीजन' : 'Seasons'})
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-stone-200">
          {availableCrops.map(crop => {
            const isSelected = crop === selectedCrop;
            const countForCrop = cropHistoryList.filter(
              c => (c.cropName || '').toLowerCase().trim() === crop.toLowerCase().trim()
            ).length;

            return (
              <button
                key={crop}
                onClick={() => setSelectedCrop(crop)}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 shrink-0",
                  isSelected
                    ? "bg-emerald-700 text-white border-emerald-700 shadow-sm shadow-emerald-900/20"
                    : "bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100 hover:border-stone-300"
                )}
              >
                <Sprout size={13} className={cn(isSelected ? "text-emerald-200" : "text-stone-400")} />
                <span>{crop}</span>
                {countForCrop > 0 && (
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full font-black",
                    isSelected ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800"
                  )}>
                    {countForCrop}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI Highlight Stat Cards */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5">
        {/* Average Yield */}
        <div className="bg-stone-50/80 p-3 sm:p-3.5 rounded-2xl border border-stone-200/70 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-stone-500 mb-1">
            <Calendar size={13} className="text-stone-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider line-clamp-1">
              {texts.avgYield}
            </span>
          </div>
          <div>
            <div className="text-base sm:text-xl font-black text-stone-800 tracking-tight">
              {kpiData.avgYield.toLocaleString()}
            </div>
            <span className="text-[10px] text-stone-400 font-medium">
              {texts.yieldUnit}
            </span>
          </div>
        </div>

        {/* Peak Harvest */}
        <div className="bg-emerald-50/60 p-3 sm:p-3.5 rounded-2xl border border-emerald-100 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-emerald-700 mb-1">
            <Award size={13} className="text-emerald-600" />
            <span className="text-[10px] font-bold uppercase tracking-wider line-clamp-1">
              {texts.peakHarvest}
            </span>
          </div>
          <div>
            <div className="text-base sm:text-xl font-black text-emerald-900 tracking-tight">
              {kpiData.peakYield.toLocaleString()}
            </div>
            <span className="text-[10px] text-emerald-600 font-bold truncate block">
              {kpiData.peakYear}
            </span>
          </div>
        </div>

        {/* Productivity Shift / Trend */}
        <div className={cn(
          "p-3 sm:p-3.5 rounded-2xl border flex flex-col justify-between",
          kpiData.trendDirection === 'up' 
            ? "bg-emerald-50/70 border-emerald-200 text-emerald-900" 
            : kpiData.trendDirection === 'down'
            ? "bg-amber-50/70 border-amber-200 text-amber-900"
            : "bg-stone-50/80 border-stone-200/70 text-stone-800"
        )}>
          <div className="flex items-center gap-1.5 mb-1">
            {kpiData.trendDirection === 'up' ? (
              <TrendingUp size={13} className="text-emerald-600 shrink-0" />
            ) : kpiData.trendDirection === 'down' ? (
              <TrendingDown size={13} className="text-amber-600 shrink-0" />
            ) : (
              <Sparkles size={13} className="text-stone-400 shrink-0" />
            )}
            <span className="text-[10px] font-bold uppercase tracking-wider line-clamp-1">
              {texts.productivityTrend}
            </span>
          </div>
          <div>
            <div className="text-base sm:text-xl font-black tracking-tight">
              {kpiData.growthRate >= 0 ? `+${kpiData.growthRate}%` : `${kpiData.growthRate}%`}
            </div>
            <span className="text-[10px] font-bold opacity-80">
              {kpiData.trendDirection === 'up' 
                ? texts.growthPositive 
                : kpiData.trendDirection === 'down' 
                ? texts.growthNegative 
                : texts.stable}
            </span>
          </div>
        </div>
      </div>

      {/* Recharts Chart Canvas */}
      <div className="bg-stone-50/50 p-3 sm:p-4 rounded-2xl border border-stone-100">
        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart data={chartData} margin={{ top: 12, right: 12, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="cropYieldGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.35} />
                    <stop offset="60%" stopColor="#10b981" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis 
                  dataKey="label" 
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                  dy={6}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(1)}k` : `${val}`}
                  domain={['dataMin - 150', 'dataMax + 150']}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 rounded-xl shadow-lg border border-stone-200 text-xs space-y-1.5 min-w-[170px]">
                          <div className="flex items-center justify-between border-b border-stone-100 pb-1">
                            <span className="font-extrabold text-stone-800 text-sm">{data.label}</span>
                            <span className={cn(
                              "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                              data.isUserRecord ? "bg-emerald-100 text-emerald-800" : "bg-stone-100 text-stone-600"
                            )}>
                              {data.isUserRecord ? 'Farm Harvest' : 'Regional Base'}
                            </span>
                          </div>
                          
                          <div className="flex items-baseline justify-between pt-0.5">
                            <span className="text-stone-500 font-medium">Yield:</span>
                            <span className="font-black text-emerald-700 text-sm">
                              {data.yield.toLocaleString()} {data.unit}
                            </span>
                          </div>

                          {data.diffPercent !== null && (
                            <div className="flex items-center justify-between pt-0.5">
                              <span className="text-stone-400 text-[10px]">{texts.vsPrev}:</span>
                              <span className={cn(
                                "text-[11px] font-bold flex items-center gap-0.5",
                                data.diffPercent >= 0 ? "text-emerald-600" : "text-amber-600"
                              )}>
                                {data.diffPercent >= 0 ? '+' : ''}{data.diffPercent}%
                              </span>
                            </div>
                          )}

                          {data.notes && (
                            <p className="text-[10px] text-stone-500 bg-stone-50 p-1.5 rounded-md italic border border-stone-100/60 mt-1">
                              "{data.notes}"
                            </p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {showBenchmarkLine && kpiData.avgYield > 0 && (
                  <ReferenceLine 
                    y={kpiData.avgYield} 
                    stroke="#f59e0b" 
                    strokeDasharray="4 4" 
                    strokeWidth={1.5}
                    label={{ 
                      value: `Avg: ${kpiData.avgYield}`, 
                      fill: '#b45309', 
                      fontSize: 10, 
                      fontWeight: 'bold',
                      position: 'top' 
                    }} 
                  />
                )}
                <Area 
                  type="monotone" 
                  dataKey="yield" 
                  name="Yield"
                  stroke="#059669" 
                  strokeWidth={3}
                  fill="url(#cropYieldGradient)"
                  dot={{ r: 4, fill: '#059669', stroke: '#ffffff', strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: '#047857', stroke: '#ffffff', strokeWidth: 2 }}
                  animationDuration={1100}
                />
              </AreaChart>
            ) : (
              <BarChart data={chartData} margin={{ top: 12, right: 12, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis 
                  dataKey="label" 
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                  dy={6}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(1)}k` : `${val}`}
                  domain={['dataMin - 150', 'dataMax + 150']}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 rounded-xl shadow-lg border border-stone-200 text-xs space-y-1.5 min-w-[170px]">
                          <div className="flex items-center justify-between border-b border-stone-100 pb-1">
                            <span className="font-extrabold text-stone-800 text-sm">{data.label}</span>
                            <span className={cn(
                              "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                              data.isUserRecord ? "bg-emerald-100 text-emerald-800" : "bg-stone-100 text-stone-600"
                            )}>
                              {data.isUserRecord ? 'Farm Harvest' : 'Regional Base'}
                            </span>
                          </div>
                          
                          <div className="flex items-baseline justify-between pt-0.5">
                            <span className="text-stone-500 font-medium">Yield:</span>
                            <span className="font-black text-emerald-700 text-sm">
                              {data.yield.toLocaleString()} {data.unit}
                            </span>
                          </div>

                          {data.diffPercent !== null && (
                            <div className="flex items-center justify-between pt-0.5">
                              <span className="text-stone-400 text-[10px]">{texts.vsPrev}:</span>
                              <span className={cn(
                                "text-[11px] font-bold flex items-center gap-0.5",
                                data.diffPercent >= 0 ? "text-emerald-600" : "text-amber-600"
                              )}>
                                {data.diffPercent >= 0 ? '+' : ''}{data.diffPercent}%
                              </span>
                            </div>
                          )}

                          {data.notes && (
                            <p className="text-[10px] text-stone-500 bg-stone-50 p-1.5 rounded-md italic border border-stone-100/60 mt-1">
                              "{data.notes}"
                            </p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {showBenchmarkLine && kpiData.avgYield > 0 && (
                  <ReferenceLine 
                    y={kpiData.avgYield} 
                    stroke="#f59e0b" 
                    strokeDasharray="4 4" 
                    strokeWidth={1.5}
                    label={{ 
                      value: `Avg: ${kpiData.avgYield}`, 
                      fill: '#b45309', 
                      fontSize: 10, 
                      fontWeight: 'bold',
                      position: 'top' 
                    }} 
                  />
                )}
                <Bar 
                  dataKey="yield" 
                  radius={[8, 8, 0, 0]}
                  animationDuration={1100}
                >
                  {chartData.map((entry, index) => {
                    const isMax = entry.yield === kpiData.peakYield;
                    return (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={isMax ? '#047857' : '#10b981'} 
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Legend / Status pill */}
        <div className="mt-3 pt-3 border-t border-stone-200/60 flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-stone-600">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
              <span className="font-semibold">{selectedCrop} Yield ({texts.yieldUnit})</span>
            </div>
            {showBenchmarkLine && (
              <div className="flex items-center gap-1.5 text-amber-700">
                <span className="w-3 h-0.5 bg-amber-500 inline-block" />
                <span className="font-semibold">{texts.baseline} ({kpiData.avgYield.toLocaleString()})</span>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowBenchmarkLine(!showBenchmarkLine)}
            className="text-[10px] font-bold text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
          >
            {showBenchmarkLine ? 'Hide Average Line' : 'Show Average Line'}
          </button>
        </div>
      </div>

      {/* Data Source Notice & Productivity Takeaway */}
      <div className={cn(
        "p-3.5 rounded-2xl border text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3",
        hasUserRecords 
          ? "bg-emerald-50/70 border-emerald-200/80 text-emerald-900" 
          : "bg-blue-50/70 border-blue-200/80 text-blue-900"
      )}>
        <div className="flex items-start gap-2.5">
          {hasUserRecords ? (
            <CheckCircle2 size={16} className="text-emerald-600 mt-0.5 shrink-0" />
          ) : (
            <Info size={16} className="text-blue-600 mt-0.5 shrink-0" />
          )}
          <div>
            <p className="font-bold text-xs">
              {hasUserRecords ? texts.userRecordNotice : texts.benchmarkNotice}
            </p>
            <p className="text-[11px] opacity-80 mt-0.5 leading-relaxed">
              {hasUserRecords 
                ? (kpiData.trendDirection === 'up' 
                    ? `Great progress! Yield trajectory is trending upward (+${kpiData.growthRate}%). Continuing proper soil organic amendments and pest monitoring preserves high productivity.`
                    : `Maintaining consistent irrigation and balanced micro-nutrients helps stabilize seasonal fluctuations.`)
                : `Showing verified regional agronomic trajectory for ${selectedCrop}. Log your specific harvests below to map your own plot's historical performance!`}
            </p>
          </div>
        </div>

        {onAddRecordClick && (
          <button
            onClick={onAddRecordClick}
            className="px-3.5 py-1.5 bg-white font-bold text-[11px] rounded-xl shadow-xs border border-stone-200 text-stone-800 hover:bg-stone-50 active:scale-95 transition-all shrink-0 cursor-pointer"
          >
            + {texts.addRecordBtn}
          </button>
        )}
      </div>
    </div>
  );
};
