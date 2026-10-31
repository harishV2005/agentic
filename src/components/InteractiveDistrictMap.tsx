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
    { name: 'Erode', path: 'M130,110 L210,110 L195,160 L120,155 Z', labelX: 160, labelY: 135, rainfall: 720, temp: 32 },
    { name: 'Coimbatore', path: 'M70,170 L150,180 L130,240 L50,230 Z', labelX: 100, labelY: 205, rainfall: 900, temp: 28 },
    { name: 'Dindigul', path: 'M140,205 L220,210 L205,260 L130,250 Z', labelX: 175, labelY: 232, rainfall: 810, temp: 32 },
    { name: 'Trichy', path: 'M235,160 L305,170 L285,215 L215,205 Z', labelX: 265, labelY: 187, rainfall: 920, temp: 33 },
    { name: 'Thanjavur', path: 'M310,175 L380,185 L360,230 L290,220 Z', labelX: 335, labelY: 202, rainfall: 1250, temp: 30 },
    { name: 'Madurai', path: 'M140,265 L210,270 L190,320 L120,310 Z', labelX: 165, labelY: 290, rainfall: 890, temp: 35 },
    { name: 'Tirunelveli', path: 'M110,325 L180,330 L160,380 L90,370 Z', labelX: 135, labelY: 350, rainfall: 1050, temp: 29 },
  ],
  'Punjab': [
    { name: 'Amritsar', path: 'M60,60 L180,50 L160,130 L50,120 Z', labelX: 110, labelY: 90, rainfall: 650, temp: 31 },
    { name: 'Jalandhar', path: 'M190,50 L310,60 L290,140 L170,130 Z', labelX: 240, labelY: 95, rainfall: 710, temp: 32 },
    { name: 'Ludhiana', path: 'M160,140 L290,145 L270,230 L140,220 Z', labelX: 215, labelY: 185, rainfall: 680, temp: 33 },
    { name: 'Ferozepur', path: 'M40,130 L150,140 L130,230 L30,210 Z', labelX: 90, labelY: 180, rainfall: 480, temp: 34 },
    { name: 'Bathinda', path: 'M50,240 L170,240 L150,330 L40,320 Z', labelX: 105, labelY: 285, rainfall: 410, temp: 35 },
    { name: 'Sangrur', path: 'M180,240 L300,235 L280,330 L160,335 Z', labelX: 230, labelY: 285, rainfall: 520, temp: 34 },
    { name: 'Patiala', path: 'M310,210 L420,200 L400,310 L290,320 Z', labelX: 355, labelY: 260, rainfall: 690, temp: 33 },
  ],
  'Haryana': [
    { name: 'Ambala', path: 'M200,40 L340,50 L310,130 L180,110 Z', labelX: 260, labelY: 85, rainfall: 900, temp: 30 },
    { name: 'Kurukshetra', path: 'M170,120 L310,140 L280,200 L150,180 Z', labelX: 230, labelY: 160, rainfall: 750, temp: 32 },
    { name: 'Sirsa', path: 'M40,70 L160,80 L140,160 L30,150 Z', labelX: 95, labelY: 115, rainfall: 350, temp: 37 },
    { name: 'Hisar', path: 'M50,170 L160,175 L140,280 L40,260 Z', labelX: 100, labelY: 220, rainfall: 420, temp: 36 },
    { name: 'Karnal', path: 'M250,205 L390,215 L360,285 L230,275 Z', labelX: 310, labelY: 245, rainfall: 700, temp: 33 },
    { name: 'Rohtak', path: 'M150,210 L240,210 L220,300 L130,290 Z', labelX: 185, labelY: 255, rainfall: 550, temp: 35 },
  ],
  'Uttar Pradesh': [
    { name: 'Meerut', path: 'M50,70 L160,60 L150,150 L40,150 Z', labelX: 100, labelY: 105, rainfall: 820, temp: 32 },
    { name: 'Bareilly', path: 'M175,60 L285,65 L270,155 L165,150 Z', labelX: 225, labelY: 110, rainfall: 980, temp: 31 },
    { name: 'Gorakhpur', path: 'M340,60 L440,70 L425,165 L330,155 Z', labelX: 385, labelY: 115, rainfall: 1200, temp: 32 },
    { name: 'Agra', path: 'M50,170 L160,165 L145,260 L40,250 Z', labelX: 100, labelY: 212, rainfall: 650, temp: 36 },
    { name: 'Kanpur', path: 'M160,170 L260,170 L250,265 L150,265 Z', labelX: 205, labelY: 218, rainfall: 840, temp: 35 },
    { name: 'Lucknow', path: 'M270,140 L370,145 L355,230 L265,225 Z', labelX: 315, labelY: 185, rainfall: 890, temp: 34 },
    { name: 'Prayagraj', path: 'M255,245 L360,240 L345,340 L245,335 Z', labelX: 300, labelY: 290, rainfall: 960, temp: 35 },
    { name: 'Varanasi', path: 'M365,245 L450,250 L435,350 L350,345 Z', labelX: 400, labelY: 295, rainfall: 1050, temp: 34 },
  ],
  'Madhya Pradesh': [
    { name: 'Gwalior', path: 'M160,40 L300,45 L280,120 L150,110 Z', labelX: 225, labelY: 80, rainfall: 750, temp: 36 },
    { name: 'Bhopal', path: 'M190,130 L300,135 L285,210 L180,205 Z', labelX: 240, labelY: 170, rainfall: 1120, temp: 32 },
    { name: 'Ujjain', path: 'M60,130 L180,135 L165,220 L50,210 Z', labelX: 115, labelY: 175, rainfall: 920, temp: 33 },
    { name: 'Dewas', path: 'M190,215 L280,220 L265,295 L175,290 Z', labelX: 230, labelY: 255, rainfall: 980, temp: 33 },
    { name: 'Indore', path: 'M60,230 L180,230 L160,330 L50,320 Z', labelX: 115, labelY: 280, rainfall: 960, temp: 32 },
    { name: 'Hoshangabad', path: 'M180,305 L310,305 L295,380 L170,375 Z', labelX: 240, labelY: 340, rainfall: 1250, temp: 31 },
    { name: 'Jabalpur', path: 'M315,140 L430,150 L410,260 L300,250 Z', labelX: 365, labelY: 200, rainfall: 1300, temp: 31 },
  ],
  'Rajasthan': [
    { name: 'Sri Ganganagar', path: 'M140,40 L280,45 L260,115 L130,105 Z', labelX: 205, labelY: 80, rainfall: 260, temp: 38 },
    { name: 'Alwar', path: 'M330,100 L430,105 L415,190 L315,185 Z', labelX: 375, labelY: 145, rainfall: 620, temp: 34 },
    { name: 'Bikaner', path: 'M60,110 L190,115 L175,195 L50,185 Z', labelX: 120, labelY: 155, rainfall: 280, temp: 39 },
    { name: 'Jaipur', path: 'M200,120 L320,125 L305,210 L190,200 Z', labelX: 255, labelY: 165, rainfall: 580, temp: 35 },
    { name: 'Jodhpur', path: 'M50,200 L180,205 L165,300 L40,290 Z', labelX: 110, labelY: 250, rainfall: 360, temp: 38 },
    { name: 'Kota', path: 'M260,220 L380,225 L365,320 L250,315 Z', labelX: 315, labelY: 270, rainfall: 760, temp: 36 },
    { name: 'Udaipur', path: 'M120,305 L240,305 L225,385 L110,380 Z', labelX: 175, labelY: 345, rainfall: 640, temp: 33 },
  ],
  'Gujarat': [
    { name: 'Mehsana', path: 'M160,50 L280,55 L260,130 L150,120 Z', labelX: 215, labelY: 90, rainfall: 680, temp: 35 },
    { name: 'Ahmedabad', path: 'M160,140 L275,145 L260,225 L150,220 Z', labelX: 212, labelY: 182, rainfall: 780, temp: 34 },
    { name: 'Vadodara', path: 'M285,150 L395,155 L380,240 L275,235 Z', labelX: 335, labelY: 195, rainfall: 920, temp: 33 },
    { name: 'Rajkot', path: 'M50,140 L150,140 L135,235 L40,230 Z', labelX: 95, labelY: 185, rainfall: 620, temp: 33 },
    { name: 'Bhavnagar', path: 'M155,235 L255,235 L240,325 L145,320 Z', labelX: 200, labelY: 280, rainfall: 660, temp: 33 },
    { name: 'Junagadh', path: 'M40,245 L145,245 L130,340 L30,335 Z', labelX: 90, labelY: 290, rainfall: 740, temp: 32 },
    { name: 'Surat', path: 'M265,250 L375,255 L360,350 L255,340 Z', labelX: 315, labelY: 300, rainfall: 1350, temp: 31 },
  ],
  'Maharashtra': [
    { name: 'Nashik', path: 'M80,70 L200,80 L180,160 L60,150 Z', labelX: 130, labelY: 115, rainfall: 950, temp: 30 },
    { name: 'Nagpur', path: 'M260,80 L380,90 L350,170 L230,160 Z', labelX: 305, labelY: 125, rainfall: 1100, temp: 36 },
    { name: 'Aurangabad', path: 'M170,140 L270,145 L255,215 L155,210 Z', labelX: 212, labelY: 177, rainfall: 780, temp: 34 },
    { name: 'Mumbai', path: 'M50,170 L170,180 L150,260 L30,250 Z', labelX: 100, labelY: 215, rainfall: 2200, temp: 31 },
    { name: 'Pune', path: 'M160,220 L270,225 L250,295 L140,290 Z', labelX: 205, labelY: 257, rainfall: 1050, temp: 29 },
    { name: 'Kolhapur', path: 'M90,305 L190,310 L170,380 L80,375 Z', labelX: 135, labelY: 342, rainfall: 1750, temp: 28 },
    { name: 'Solapur', path: 'M210,300 L320,305 L300,375 L195,370 Z', labelX: 255, labelY: 337, rainfall: 730, temp: 36 },
    { name: 'Amravati', path: 'M250,175 L360,180 L345,255 L240,250 Z', labelX: 295, labelY: 215, rainfall: 880, temp: 35 },
  ],
  'Andhra Pradesh': [
    { name: 'Visakhapatnam', path: 'M260,60 L380,80 L340,160 L220,140 Z', labelX: 300, labelY: 110, rainfall: 1200, temp: 31 },
    { name: 'Rajahmundry', path: 'M200,120 L320,135 L290,205 L180,195 Z', labelX: 245, labelY: 165, rainfall: 1150, temp: 32 },
    { name: 'Vijayawada', path: 'M160,200 L280,210 L245,275 L135,265 Z', labelX: 205, labelY: 240, rainfall: 1020, temp: 33 },
    { name: 'Guntur', path: 'M110,270 L220,280 L185,345 L85,335 Z', labelX: 150, labelY: 310, rainfall: 910, temp: 34 },
    { name: 'Nellore', path: 'M170,335 L280,340 L255,395 L150,390 Z', labelX: 210, labelY: 365, rainfall: 1080, temp: 33 },
    { name: 'Kurnool', path: 'M40,180 L150,190 L130,270 L30,260 Z', labelX: 85, labelY: 225, rainfall: 670, temp: 36 },
    { name: 'Anantapur', path: 'M40,280 L140,290 L120,375 L30,365 Z', labelX: 80, labelY: 330, rainfall: 560, temp: 35 },
  ],
  'Telangana': [
    { name: 'Nizamabad', path: 'M140,50 L260,60 L230,135 L110,125 Z', labelX: 185, labelY: 95, rainfall: 980, temp: 34 },
    { name: 'Karimnagar', path: 'M270,60 L390,70 L360,145 L240,135 Z', labelX: 315, labelY: 105, rainfall: 1020, temp: 35 },
    { name: 'Warangal', path: 'M230,150 L350,160 L320,235 L200,225 Z', labelX: 275, labelY: 195, rainfall: 1050, temp: 35 },
    { name: 'Hyderabad', path: 'M90,145 L210,155 L180,230 L60,220 Z', labelX: 135, labelY: 190, rainfall: 820, temp: 36 },
    { name: 'Khammam', path: 'M250,240 L370,250 L340,325 L220,315 Z', labelX: 295, labelY: 285, rainfall: 1120, temp: 34 },
    { name: 'Nalgonda', path: 'M110,235 L230,245 L200,320 L80,310 Z', labelX: 155, labelY: 280, rainfall: 780, temp: 36 },
  ],
  'Karnataka': [
    { name: 'Belgaum', path: 'M70,50 L180,50 L160,130 L50,130 Z', labelX: 115, labelY: 90, rainfall: 1350, temp: 28 },
    { name: 'Dharwad', path: 'M190,50 L300,50 L280,130 L170,130 Z', labelX: 235, labelY: 90, rainfall: 920, temp: 30 },
    { name: 'Bellary', path: 'M270,135 L380,135 L360,215 L250,215 Z', labelX: 315, labelY: 175, rainfall: 620, temp: 35 },
    { name: 'Shimoga', path: 'M60,140 L170,140 L150,225 L40,225 Z', labelX: 105, labelY: 182, rainfall: 1850, temp: 28 },
    { name: 'Mangalore', path: 'M40,235 L145,235 L130,320 L30,320 Z', labelX: 85, labelY: 277, rainfall: 3200, temp: 27 },
    { name: 'Mysore', path: 'M140,280 L245,280 L230,375 L125,375 Z', labelX: 182, labelY: 327, rainfall: 1100, temp: 26 },
    { name: 'Bangalore', path: 'M255,235 L365,235 L345,340 L240,340 Z', labelX: 300, labelY: 287, rainfall: 950, temp: 29 },
  ],
  'Kerala': [
    { name: 'Wayanad', path: 'M80,40 L200,50 L175,115 L60,105 Z', labelX: 125, labelY: 78, rainfall: 3400, temp: 24 },
    { name: 'Kozhikode', path: 'M60,120 L180,130 L155,190 L40,180 Z', labelX: 110, labelY: 155, rainfall: 2900, temp: 28 },
    { name: 'Palakkad', path: 'M190,120 L310,130 L285,195 L170,185 Z', labelX: 240, labelY: 157, rainfall: 2100, temp: 32 },
    { name: 'Thrissur', path: 'M80,195 L200,205 L175,265 L60,255 Z', labelX: 130, labelY: 230, rainfall: 3000, temp: 29 },
    { name: 'Idukki', path: 'M205,200 L325,210 L300,285 L180,275 Z', labelX: 250, labelY: 242, rainfall: 3600, temp: 22 },
    { name: 'Kochi', path: 'M70,270 L185,275 L165,335 L50,330 Z', labelX: 115, labelY: 302, rainfall: 2600, temp: 29 },
    { name: 'Thiruvananthapuram', path: 'M110,340 L230,345 L200,400 L80,395 Z', labelX: 155, labelY: 370, rainfall: 1800, temp: 30 },
  ],
  'Bihar': [
    { name: 'Muzaffarpur', path: 'M150,55 L285,60 L270,145 L140,135 Z', labelX: 210, labelY: 100, rainfall: 1180, temp: 31 },
    { name: 'Darbhanga', path: 'M295,50 L425,55 L405,140 L280,135 Z', labelX: 355, labelY: 95, rainfall: 1250, temp: 30 },
    { name: 'Patna', path: 'M165,155 L295,160 L280,245 L155,240 Z', labelX: 225, labelY: 200, rainfall: 1100, temp: 33 },
    { name: 'Rohtas', path: 'M50,180 L155,180 L140,290 L40,280 Z', labelX: 100, labelY: 235, rainfall: 1020, temp: 34 },
    { name: 'Gaya', path: 'M165,255 L285,255 L270,350 L155,345 Z', labelX: 220, labelY: 300, rainfall: 1060, temp: 35 },
    { name: 'Bhagalpur', path: 'M305,170 L420,175 L405,280 L295,270 Z', labelX: 355, labelY: 225, rainfall: 1220, temp: 32 },
  ],
  'West Bengal': [
    { name: 'Malda', path: 'M160,50 L300,55 L280,130 L150,120 Z', labelX: 225, labelY: 90, rainfall: 1450, temp: 30 },
    { name: 'Murshidabad', path: 'M150,140 L290,145 L275,215 L140,210 Z', labelX: 215, labelY: 180, rainfall: 1400, temp: 31 },
    { name: 'Nadia', path: 'M220,225 L340,230 L325,300 L210,295 Z', labelX: 275, labelY: 260, rainfall: 1420, temp: 31 },
    { name: 'Burdwan', path: 'M90,220 L210,225 L195,305 L80,295 Z', labelX: 145, labelY: 265, rainfall: 1350, temp: 32 },
    { name: 'Hooghly', path: 'M150,315 L270,315 L255,385 L140,380 Z', labelX: 205, labelY: 350, rainfall: 1520, temp: 31 },
    { name: 'Kolkata', path: 'M280,310 L400,315 L385,385 L270,380 Z', labelX: 335, labelY: 350, rainfall: 1750, temp: 32 },
  ],
  'Odisha': [
    { name: 'Sambalpur', path: 'M60,80 L185,85 L170,190 L50,180 Z', labelX: 120, labelY: 135, rainfall: 1450, temp: 33 },
    { name: 'Bargarh', path: 'M50,200 L175,205 L160,315 L40,305 Z', labelX: 110, labelY: 260, rainfall: 1380, temp: 34 },
    { name: 'Balasore', path: 'M280,60 L410,65 L390,165 L265,155 Z', labelX: 340, labelY: 110, rainfall: 1650, temp: 31 },
    { name: 'Cuttack', path: 'M210,180 L330,185 L315,280 L200,270 Z', labelX: 265, labelY: 230, rainfall: 1520, temp: 32 },
    { name: 'Bhubaneswar', path: 'M225,290 L345,295 L330,385 L215,380 Z', labelX: 280, labelY: 340, rainfall: 1540, temp: 32 },
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

  const districts = React.useMemo(() => {
    if (STATE_MAP_DATA[selectedState]) {
      return STATE_MAP_DATA[selectedState];
    }
    // Dynamic fallback for any state: generate clean interactive agro-zone tiles
    const defaultDistricts = [
      'North Zone', 'Central Zone', 'South Zone', 
      'East Zone', 'West Zone', 'River Basin'
    ];
    return defaultDistricts.map((name, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = 50 + col * 125;
      const y = 80 + row * 130;
      return {
        name,
        path: `M${x},${y} L${x + 115},${y} L${x + 115},${y + 110} L${x},${y + 110} Z`,
        labelX: x + 57,
        labelY: y + 55,
        rainfall: 800 + i * 150,
        temp: 30 + (i % 5)
      };
    });
  }, [selectedState]);

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
