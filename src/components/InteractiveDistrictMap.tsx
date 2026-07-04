import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CloudRain, Thermometer, MapPin, Info, Compass, Plus, Minus, RotateCcw, Camera, Download } from 'lucide-react';

interface InteractiveDistrictMapProps {
  selectedState: string;
  selectedDistrict: string;
  onDistrictSelect: (district: string) => void;
}

interface DistrictData {
  name: string;
  path: string;
  labelX: number;
  labelY: number;
  rainfall: number; // in mm
  temp: number; // in °C
}

const STATE_MAP_DATA: Record<string, DistrictData[]> = {
  'Tamil Nadu': [
    { name: 'Chennai', path: 'M340,50 L380,50 L370,90 L330,90 Z', labelX: 355, labelY: 70, rainfall: 1150, temp: 32 },
    { name: 'Salem', path: 'M220,95 L290,105 L270,145 L200,135 Z', labelX: 245, labelY: 120, rainfall: 850, temp: 31 },
    { name: 'Karur', path: 'M160,150 L230,160 L220,200 L150,190 Z', labelX: 190, labelY: 175, rainfall: 650, temp: 34 },
    { name: 'Coimbatore', path: 'M80,180 L150,190 L130,240 L60,230 Z', labelX: 105, labelY: 210, rainfall: 900, temp: 28 },
    { name: 'Trichy', path: 'M235,160 L305,170 L285,215 L215,205 Z', labelX: 265, labelY: 187, rainfall: 920, temp: 33 },
    { name: 'Tanjore', path: 'M310,175 L380,185 L360,230 L290,220 Z', labelX: 335, labelY: 202, rainfall: 1250, temp: 30 },
    { name: 'Madurai', path: 'M140,245 L210,255 L190,305 L120,295 Z', labelX: 165, labelY: 275, rainfall: 890, temp: 35 },
    { name: 'Tirunelveli', path: 'M110,310 L180,320 L160,370 L90,360 Z', labelX: 135, labelY: 340, rainfall: 1050, temp: 29 },
  ],
  'Karnataka': [
    { name: 'Mangalore', path: 'M80,120 L180,110 L160,200 L60,210 Z', labelX: 120, labelY: 160, rainfall: 3200, temp: 27 },
    { name: 'Bangalore', path: 'M240,180 L340,170 L320,260 L220,270 Z', labelX: 280, labelY: 220, rainfall: 950, temp: 29 },
    { name: 'Mysore', path: 'M150,230 L250,220 L230,310 L130,320 Z', labelX: 190, labelY: 270, rainfall: 1100, temp: 26 },
  ],
  'Kerala': [
    { name: 'Kozhikode', path: 'M90,70 L210,90 L170,160 L50,140 Z', labelX: 130, labelY: 115, rainfall: 2900, temp: 28 },
    { name: 'Kochi', path: 'M110,170 L230,190 L190,260 L70,240 Z', labelX: 150, labelY: 215, rainfall: 2600, temp: 29 },
    { name: 'Thiruvananthapuram', path: 'M130,270 L250,290 L210,360 L90,340 Z', labelX: 170, labelY: 315, rainfall: 1800, temp: 30 },
  ],
  'Andhra Pradesh': [
    { name: 'Visakhapatnam', path: 'M260,60 L380,80 L340,160 L220,140 Z', labelX: 300, labelY: 110, rainfall: 1200, temp: 31 },
    { name: 'Vijayawada', path: 'M160,150 L280,170 L240,250 L120,230 Z', labelX: 200, labelY: 200, rainfall: 1020, temp: 33 },
    { name: 'Guntur', path: 'M110,240 L230,260 L190,340 L70,320 Z', labelX: 150, labelY: 290, rainfall: 910, temp: 34 },
  ],
  'Telangana': [
    { name: 'Nizamabad', path: 'M150,60 L270,70 L240,150 L120,140 Z', labelX: 195, labelY: 105, rainfall: 980, temp: 34 },
    { name: 'Warangal', path: 'M220,160 L340,170 L310,250 L190,240 Z', labelX: 265, labelY: 205, rainfall: 1050, temp: 35 },
    { name: 'Hyderabad', path: 'M100,220 L220,230 L190,310 L70,300 Z', labelX: 145, labelY: 265, rainfall: 820, temp: 36 },
  ],
  'Maharashtra': [
    { name: 'Nashik', path: 'M80,70 L200,80 L180,160 L60,150 Z', labelX: 130, labelY: 115, rainfall: 950, temp: 30 },
    { name: 'Nagpur', path: 'M260,80 L380,90 L350,170 L230,160 Z', labelX: 305, labelY: 125, rainfall: 1100, temp: 36 },
    { name: 'Mumbai', path: 'M50,170 L170,180 L150,260 L30,250 Z', labelX: 100, labelY: 215, rainfall: 2200, temp: 31 },
    { name: 'Pune', path: 'M160,190 L280,200 L250,280 L130,270 Z', labelX: 205, labelY: 235, rainfall: 1050, temp: 29 },
  ],
  'Delhi': [
    { name: 'North Delhi', path: 'M110,60 L290,60 L260,150 L80,150 Z', labelX: 185, labelY: 105, rainfall: 710, temp: 37 },
    { name: 'New Delhi', path: 'M130,160 L310,160 L280,250 L100,250 Z', labelX: 205, labelY: 205, rainfall: 750, temp: 38 },
    { name: 'South Delhi', path: 'M110,260 L290,260 L260,350 L80,350 Z', labelX: 185, labelY: 305, rainfall: 720, temp: 39 },
  ],
};

export const InteractiveDistrictMap: React.FC<InteractiveDistrictMapProps> = ({
  selectedState,
  selectedDistrict,
  onDistrictSelect,
}) => {
  const [viewMode, setViewMode] = useState<'rainfall' | 'temp'>('rainfall');
  const [showPrecipitationOverlay, setShowPrecipitationOverlay] = useState<boolean>(false);
  const [hoveredDistrict, setHoveredDistrict] = useState<DistrictData | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);

  const exportMap = async (format: 'png' | 'svg') => {
    const svgElement = document.getElementById('district-map-svg');
    if (!svgElement) return;

    setIsExporting(true);
    setShowExportMenu(false);

    try {
      // Clone SVG
      const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
      clonedSvg.setAttribute('width', '920');
      clonedSvg.setAttribute('height', '800');

      // Add solid white background
      const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      bgRect.setAttribute('width', '100%');
      bgRect.setAttribute('height', '100%');
      bgRect.setAttribute('fill', '#ffffff');
      clonedSvg.insertBefore(bgRect, clonedSvg.firstChild);

      // Add watermark / metadata text group
      const metadataGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      metadataGroup.setAttribute('transform', 'translate(15, 30)');
      
      const titleText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      titleText.setAttribute('font-family', 'sans-serif');
      titleText.setAttribute('font-size', '14px');
      titleText.setAttribute('font-weight', 'bold');
      titleText.setAttribute('fill', '#1c1917');
      titleText.textContent = `${selectedState} Agro-Climatic Zone Map`;

      const subtitleText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      subtitleText.setAttribute('transform', 'translate(0, 18)');
      subtitleText.setAttribute('font-family', 'sans-serif');
      subtitleText.setAttribute('font-size', '10px');
      subtitleText.setAttribute('fill', '#78716c');
      subtitleText.textContent = `Focus Area: ${selectedDistrict} | View: ${viewMode === 'rainfall' ? 'Rainfall' : 'Temperature'} Mode | Generated: ${new Date().toLocaleDateString()}`;

      metadataGroup.appendChild(titleText);
      metadataGroup.appendChild(subtitleText);
      clonedSvg.appendChild(metadataGroup);

      // Serialize
      const serializer = new XMLSerializer();
      let svgString = serializer.serializeToString(clonedSvg);
      
      if (!svgString.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
        svgString = svgString.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
      }

      const fileName = `agro_climatic_map_${selectedState.toLowerCase()}_${viewMode}`;

      if (format === 'svg') {
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);
        const downloadLink = document.createElement('a');
        downloadLink.href = svgUrl;
        downloadLink.download = `${fileName}.svg`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(svgUrl);
        setIsExporting(false);
      } else {
        // PNG format
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 920;
          canvas.height = 800;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            try {
              canvas.toBlob((blob) => {
                if (blob) {
                  const pngUrl = URL.createObjectURL(blob);
                  const downloadLink = document.createElement('a');
                  downloadLink.href = pngUrl;
                  downloadLink.download = `${fileName}.png`;
                  document.body.appendChild(downloadLink);
                  downloadLink.click();
                  document.body.removeChild(downloadLink);
                  URL.revokeObjectURL(pngUrl);
                }
                setIsExporting(false);
              }, 'image/png');
            } catch (err) {
              console.error('Canvas conversion error:', err);
              // Fallback to SVG download on security or context failures
              const svgBlobFallback = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
              const svgUrlFallback = URL.createObjectURL(svgBlobFallback);
              const downloadLink = document.createElement('a');
              downloadLink.href = svgUrlFallback;
              downloadLink.download = `${fileName}.svg`;
              document.body.appendChild(downloadLink);
              downloadLink.click();
              document.body.removeChild(downloadLink);
              URL.revokeObjectURL(svgUrlFallback);
              setIsExporting(false);
            }
          } else {
            setIsExporting(false);
          }
          URL.revokeObjectURL(svgUrl);
        };
        img.onerror = () => {
          setIsExporting(false);
          URL.revokeObjectURL(svgUrl);
        };
        img.src = svgUrl;
      }
    } catch (error) {
      console.error('Failed to export map image:', error);
      setIsExporting(false);
    }
  };

  React.useEffect(() => {
    setZoom(1);
  }, [selectedState]);

  const districts = STATE_MAP_DATA[selectedState] || [];

  if (!selectedState) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm text-center py-12">
        <Compass className="w-12 h-12 text-stone-300 mx-auto mb-3 animate-pulse" />
        <p className="text-stone-500 font-medium text-sm">
          Select a State to view the interactive agro-climatic map
        </p>
      </div>
    );
  }

  // Generate repeatable mock historical rainfall data based on district name
  const getHistoricalData = (districtName: string, baseRain: number) => {
    const seed = districtName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    // 5-year trend data
    const years = [2021, 2022, 2023, 2024, 2025];
    const yearly = years.map((y, idx) => {
      const variation = Math.sin(seed + idx) * 0.14; // +/- 14% variation
      return {
        year: y,
        rainfall: Math.round(baseRain * (1 + variation)),
      };
    });

    // Monthly breakdown for Southwest or Northeast Monsoon peaks
    const months = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const isEastCoast = ['chennai', 'tanjore', 'trichy', 'guntur', 'visakhapatnam', 'nellore', 'madurai', 'tirunelveli'].some(
      name => districtName.toLowerCase().includes(name)
    );

    const monthly = months.map((m, idx) => {
      let factor = 0.1;
      if (isEastCoast) {
        if (m === 'Jun') factor = 0.04;
        else if (m === 'Jul') factor = 0.06;
        else if (m === 'Aug') factor = 0.11;
        else if (m === 'Sep') factor = 0.14;
        else if (m === 'Oct') factor = 0.28;
        else if (m === 'Nov') factor = 0.27;
        else if (m === 'Dec') factor = 0.10;
      } else {
        if (m === 'Jun') factor = 0.24;
        else if (m === 'Jul') factor = 0.29;
        else if (m === 'Aug') factor = 0.19;
        else if (m === 'Sep') factor = 0.14;
        else if (m === 'Oct') factor = 0.08;
        else if (m === 'Nov') factor = 0.04;
        else if (m === 'Dec') factor = 0.02;
      }
      return {
        month: m,
        rainfall: Math.round(baseRain * factor),
      };
    });

    return { yearly, monthly };
  };

  // Color functions based on value
  const getRainfallColorClass = (val: number, isSelected: boolean) => {
    if (isSelected) return 'fill-emerald-500/35 stroke-emerald-600 stroke-[3px] filter drop-shadow-md';
    if (val < 700) return 'fill-amber-50 stroke-amber-300 hover:fill-amber-100/80 transition-colors cursor-pointer';
    if (val < 1100) return 'fill-emerald-50 stroke-emerald-300 hover:fill-emerald-100/80 transition-colors cursor-pointer';
    if (val < 2000) return 'fill-teal-50 stroke-teal-300 hover:fill-teal-100/80 transition-colors cursor-pointer';
    return 'fill-blue-50 stroke-blue-300 hover:fill-blue-100/80 transition-colors cursor-pointer';
  };

  const getTempColorClass = (val: number, isSelected: boolean) => {
    if (isSelected) return 'fill-orange-500/35 stroke-orange-600 stroke-[3px] filter drop-shadow-md';
    if (val < 30) return 'fill-sky-50 stroke-sky-300 hover:fill-sky-100/80 transition-colors cursor-pointer';
    if (val < 33) return 'fill-yellow-50 stroke-yellow-300 hover:fill-yellow-100/80 transition-colors cursor-pointer';
    if (val < 36) return 'fill-orange-50 stroke-orange-300 hover:fill-orange-100/80 transition-colors cursor-pointer';
    return 'fill-red-50 stroke-red-300 hover:fill-red-100/80 transition-colors cursor-pointer';
  };

  const getRainfallText = (val: number) => {
    if (val < 700) return `${val} mm (Deficit)`;
    if (val < 1100) return `${val} mm (Normal)`;
    if (val < 2000) return `${val} mm (Excess)`;
    return `${val} mm (Heavy)`;
  };

  const getTempText = (val: number) => {
    if (val < 30) return `${val}°C (Cool)`;
    if (val < 33) return `${val}°C (Moderate)`;
    if (val < 36) return `${val}°C (Warm)`;
    return `${val}°C (Hot)`;
  };

  const selectedDistrictData = districts.find(d => d.name.toLowerCase() === selectedDistrict.toLowerCase());

  return (
    <div id="interactive-district-map" className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2">
            <Compass className="text-primary" size={20} />
            Agro-Climatic Zone Map: {selectedState}
          </h3>
          <p className="text-xs text-stone-400 font-medium">
            Click on any district to set your active farm location and view local data
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Mode Toggles */}
          <div className="flex bg-stone-50 p-1 rounded-xl border border-stone-100 self-start">
            <button
              onClick={() => setViewMode('rainfall')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'rainfall'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-stone-400 hover:text-stone-700'
              }`}
            >
              <CloudRain size={13} />
              Rainfall
            </button>
            <button
              onClick={() => setViewMode('temp')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'temp'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-stone-400 hover:text-stone-700'
              }`}
            >
              <Thermometer size={13} />
              Temperature
            </button>
          </div>

          {/* Precipitation Overlay Toggle */}
          <button
            onClick={() => setShowPrecipitationOverlay(!showPrecipitationOverlay)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
              showPrecipitationOverlay
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white text-stone-500 border-stone-200 hover:text-stone-700 hover:bg-stone-50'
            }`}
          >
            <CloudRain size={13} className={showPrecipitationOverlay ? 'animate-bounce' : ''} />
            Precipitation Overlay
          </button>

          {/* Export Map Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border bg-white text-stone-500 border-stone-200 hover:text-stone-700 hover:bg-stone-50 shadow-sm disabled:opacity-50"
            >
              <Camera size={13} className={isExporting ? 'animate-spin' : ''} />
              {isExporting ? 'Exporting...' : 'Export Map'}
            </button>
            {showExportMenu && (
              <>
                <div 
                  className="fixed inset-0 z-20" 
                  onClick={() => setShowExportMenu(false)} 
                />
                <div className="absolute right-0 mt-1 w-36 bg-white rounded-xl shadow-lg border border-stone-200/80 p-1.5 z-30 flex flex-col gap-1 animate-in fade-in slide-in-from-top-2 duration-100">
                  <button
                    onClick={() => exportMap('png')}
                    className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-stone-50 rounded-lg text-xs font-semibold text-stone-700 text-left w-full transition-colors"
                  >
                    <Download size={12} className="text-stone-400" />
                    Download PNG
                  </button>
                  <button
                    onClick={() => exportMap('svg')}
                    className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-stone-50 rounded-lg text-xs font-semibold text-stone-700 text-left w-full transition-colors"
                  >
                    <Download size={12} className="text-stone-400" />
                    Download SVG
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* SVG Map Canvas */}
        <div className="md:col-span-7 bg-stone-50/50 rounded-xl border border-stone-100 p-4 relative overflow-hidden flex items-center justify-center">
          <svg
            id="district-map-svg"
            viewBox="0 0 460 400"
            className="w-full max-h-[320px] select-none"
          >
            <defs>
              <style>{`
                @keyframes rainfall-slide {
                  0% {
                    transform: translate(0, 0);
                  }
                  100% {
                    transform: translate(-10px, 20px);
                  }
                }
                .rain-anim {
                  animation: rainfall-slide 1.5s infinite linear;
                }
                .rain-anim-fast {
                  animation: rainfall-slide 0.8s infinite linear;
                }
              `}</style>

              <pattern id="rain-low" width="20" height="20" patternUnits="userSpaceOnUse">
                <g className="rain-anim">
                  <line x1="2" y1="2" x2="1" y2="6" stroke="#0ea5e9" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
                  <line x1="12" y1="10" x2="11" y2="14" stroke="#0ea5e9" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
                </g>
              </pattern>

              <pattern id="rain-medium" width="16" height="16" patternUnits="userSpaceOnUse">
                <g className="rain-anim">
                  <line x1="3" y1="2" x2="2" y2="7" stroke="#3b82f6" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
                  <line x1="10" y1="9" x2="9" y2="14" stroke="#3b82f6" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
                  <line x1="14" y1="3" x2="13" y2="8" stroke="#3b82f6" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
                </g>
              </pattern>

              <pattern id="rain-high" width="12" height="12" patternUnits="userSpaceOnUse">
                <g className="rain-anim-fast">
                  <line x1="2" y1="1" x2="1" y2="7" stroke="#2563eb" strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />
                  <line x1="7" y1="6" x2="6" y2="12" stroke="#2563eb" strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />
                  <line x1="10" y1="2" x2="9" y2="8" stroke="#2563eb" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
                </g>
              </pattern>

              <pattern id="rain-heavy" width="10" height="10" patternUnits="userSpaceOnUse">
                <g className="rain-anim-fast">
                  <line x1="2" y1="1" x2="1" y2="8" stroke="#1d4ed8" strokeWidth="1.6" strokeLinecap="round" opacity="0.8" />
                  <line x1="5" y1="5" x2="4" y2="12" stroke="#1d4ed8" strokeWidth="1.6" strokeLinecap="round" opacity="0.8" />
                  <line x1="8" y1="2" x2="7" y2="9" stroke="#1d4ed8" strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
                  <line x1="9" y1="7" x2="8" y2="14" stroke="#1d4ed8" strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />
                </g>
              </pattern>
            </defs>

            <g transform={`translate(230, 200) scale(${zoom}) translate(-230, -200)`} className="transition-transform duration-300 ease-out">
              {districts.map((district) => {
                const isSelected = district.name.toLowerCase() === selectedDistrict.toLowerCase();
                const colorClass =
                  viewMode === 'rainfall'
                    ? getRainfallColorClass(district.rainfall, isSelected)
                    : getTempColorClass(district.temp, isSelected);

                let rainPattern = 'rain-low';
                if (district.rainfall >= 2000) rainPattern = 'rain-heavy';
                else if (district.rainfall >= 1100) rainPattern = 'rain-high';
                else if (district.rainfall >= 700) rainPattern = 'rain-medium';

                return (
                  <g key={district.name}>
                    <motion.path
                      d={district.path}
                      className={`${colorClass} transition-all duration-200`}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => onDistrictSelect(district.name)}
                      onMouseEnter={() => setHoveredDistrict(district)}
                      onMouseLeave={() => setHoveredDistrict(null)}
                    />

                    {/* Subtle pulse/glow outline for the selected district */}
                    {isSelected && (
                      <motion.path
                        d={district.path}
                        fill="none"
                        className="pointer-events-none"
                        stroke={viewMode === 'rainfall' ? '#10b981' : '#f97316'}
                        initial={{ strokeWidth: 2, opacity: 0.8, scale: 1 }}
                        animate={{ 
                          strokeWidth: [2, 8], 
                          opacity: [0.8, 0],
                          scale: [1, 1.04]
                        }}
                        transition={{ 
                          repeat: Infinity, 
                          duration: 2, 
                          ease: "easeOut" 
                        }}
                        style={{ transformOrigin: `${district.labelX}px ${district.labelY}px` }}
                      />
                    )}

                    {/* Precipitation Overlay */}
                    <motion.path
                      d={district.path}
                      fill={`url(#${rainPattern})`}
                      className="pointer-events-none"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: showPrecipitationOverlay ? 1 : 0 }}
                      transition={{ duration: 0.4, ease: "easeInOut" }}
                    />

                    {/* District Text Label */}
                    <text
                      x={district.labelX}
                      y={district.labelY}
                      textAnchor="middle"
                      className={`text-[10px] font-bold pointer-events-none ${
                        isSelected ? 'fill-stone-900 font-extrabold scale-110' : 'fill-stone-600'
                      }`}
                    >
                      {district.name}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Zoom Controls */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-1 bg-white p-1 rounded-xl shadow-md border border-stone-200/80 z-10">
            <button
              onClick={() => setZoom(z => Math.min(3, z + 0.25))}
              className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-600 active:scale-95 transition-all"
              title="Zoom In"
            >
              <Plus size={15} />
            </button>
            <button
              onClick={() => setZoom(z => Math.max(1, z - 0.25))}
              className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-600 active:scale-95 transition-all"
              title="Zoom Out"
            >
              <Minus size={15} />
            </button>
            {zoom > 1 && (
              <button
                onClick={() => setZoom(1)}
                className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-500 hover:text-stone-800 active:scale-95 transition-all border-t border-stone-100 mt-1 pt-1.5"
                title="Reset Zoom"
              >
                <RotateCcw size={13} />
              </button>
            )}
          </div>

          {/* District Tooltip */}
          {hoveredDistrict && (
            <div className="absolute top-4 left-4 bg-stone-900/90 text-white px-3 py-2 rounded-xl text-xs font-medium shadow-lg backdrop-blur-sm pointer-events-none transition-all duration-150 border border-stone-800">
              <p className="font-extrabold text-stone-100 flex items-center gap-1">
                <MapPin size={11} className="text-primary-container" />
                {hoveredDistrict.name}
              </p>
              <div className="mt-1 space-y-0.5 text-stone-300">
                <p className="flex items-center gap-1">
                  <CloudRain size={10} className="text-blue-400" />
                  Rainfall: {getRainfallText(hoveredDistrict.rainfall)}
                </p>
                <p className="flex items-center gap-1">
                  <Thermometer size={10} className="text-orange-400" />
                  Temp: {getTempText(hoveredDistrict.temp)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Legend & Summary Details */}
        <div className="md:col-span-5 space-y-4">
          {showPrecipitationOverlay && selectedDistrictData ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
                  <CloudRain size={14} className="text-blue-500" />
                  Precipitation History ({selectedDistrictData.name})
                </h4>
                <span className="text-[9px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                  Overlay Active
                </span>
              </div>

              {/* Monthly Bar Chart */}
              <div>
                <p className="text-[10px] font-bold text-stone-500 mb-2">Monthly Rainfall Breakdown (mm)</p>
                <div className="flex items-end justify-between h-20 pt-2 px-1">
                  {getHistoricalData(selectedDistrictData.name, selectedDistrictData.rainfall).monthly.map((m) => {
                    const monthlyData = getHistoricalData(selectedDistrictData.name, selectedDistrictData.rainfall).monthly;
                    const maxRain = Math.max(...monthlyData.map(x => x.rainfall));
                    const heightPercent = maxRain > 0 ? (m.rainfall / maxRain) * 100 : 0;
                    return (
                      <div key={m.month} className="flex flex-col items-center flex-1 group relative">
                        {/* Tooltip */}
                        <span className="absolute -top-6 bg-stone-900 text-white text-[9px] px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                          {m.rainfall} mm
                        </span>
                        <div
                          style={{ height: `${Math.max(5, heightPercent)}%` }}
                          className="w-3.5 bg-blue-500 hover:bg-blue-600 rounded-t-sm transition-all duration-300"
                        />
                        <span className="text-[9px] text-stone-400 font-bold mt-1">{m.month}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 5-Year Trend Bars */}
              <div className="pt-2 border-t border-blue-100/50">
                <p className="text-[10px] font-bold text-stone-500 mb-2">5-Year Historical Annual Trend</p>
                <div className="space-y-1.5">
                  {getHistoricalData(selectedDistrictData.name, selectedDistrictData.rainfall).yearly.map((y) => (
                    <div key={y.year} className="flex items-center text-xs justify-between">
                      <span className="text-stone-500 font-bold font-mono">{y.year}</span>
                      <div className="flex-1 mx-3 h-1.5 bg-stone-200/50 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${Math.min(100, (y.rainfall / 3500) * 100)}%` }}
                          className="h-full bg-teal-500 rounded-full"
                        />
                      </div>
                      <span className="text-stone-700 font-bold font-mono">{y.rainfall} mm</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-100 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Map Visualization Legend
              </h4>
              
              {viewMode === 'rainfall' ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-stone-600 font-medium">
                    <span className="w-4 h-4 bg-amber-50 border border-amber-300 rounded-md block"></span>
                    <span>Deficit Rainfall (&lt; 700 mm)</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-stone-600 font-medium">
                    <span className="w-4 h-4 bg-emerald-50 border border-emerald-300 rounded-md block"></span>
                    <span>Normal Rainfall (700 - 1100 mm)</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-stone-600 font-medium">
                    <span className="w-4 h-4 bg-teal-50 border border-teal-300 rounded-md block"></span>
                    <span>Excess Rainfall (1100 - 2000 mm)</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-stone-600 font-medium">
                    <span className="w-4 h-4 bg-blue-50 border border-blue-300 rounded-md block"></span>
                    <span>Heavy Rainfall (&gt; 2000 mm)</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-stone-600 font-medium">
                    <span className="w-4 h-4 bg-sky-50 border border-sky-300 rounded-md block"></span>
                    <span>Cool Climate (&lt; 30°C)</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-stone-600 font-medium">
                    <span className="w-4 h-4 bg-yellow-50 border border-yellow-300 rounded-md block"></span>
                    <span>Moderate Climate (30°C - 33°C)</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-stone-600 font-medium">
                    <span className="w-4 h-4 bg-orange-50 border border-orange-300 rounded-md block"></span>
                    <span>Warm Climate (33°C - 36°C)</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-stone-600 font-medium">
                    <span className="w-4 h-4 bg-red-50 border border-red-300 rounded-md block"></span>
                    <span>Hot Climate (&gt; 36°C)</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick Insights Card for active/hovered district */}
          <div className="p-4 rounded-xl bg-green-50/50 border border-green-100/30">
            <div className="flex items-start gap-2.5">
              <Info size={16} className="text-primary mt-0.5 shrink-0" />
              <div className="text-xs text-stone-600 leading-relaxed">
                <span className="font-bold text-primary block mb-0.5">Agro-Climatic Insights</span>
                {selectedDistrict ? (
                  <>
                    Your active district is <span className="font-bold text-stone-800">{selectedDistrict}</span>. 
                    {viewMode === 'rainfall' ? (
                      <span> Adequate rainfall planning helps opt for optimal crop seasons like Kharif or Rabi.</span>
                    ) : (
                      <span> Managing soil mulching and smart shade/irrigation techniques based on current temperature zones prevents moisture stress.</span>
                    )}
                  </>
                ) : (
                  <span>Select any region on the interactive map to inspect local weather ranges, precipitation statistics, and heatwave probability.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
