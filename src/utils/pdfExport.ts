import { jsPDF } from "jspdf";
import { CropCalendar, CropRotationData } from "../types";

// Helper to handle text wrapping and page breaks elegantly
class PDFGenerator {
  doc: jsPDF;
  y: number;
  margin: number;
  pageWidth: number;
  pageHeight: number;
  contentWidth: number;

  constructor() {
    this.doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });
    this.margin = 20;
    this.y = 20;
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.contentWidth = this.pageWidth - 2 * this.margin;
  }

  checkPageBreak(neededHeight: number) {
    if (this.y + neededHeight > this.pageHeight - this.margin) {
      this.doc.addPage();
      this.y = this.margin + 10;
      this.drawPageHeaderMini();
    }
  }

  drawPageHeaderMini() {
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(8);
    this.doc.setTextColor(150, 150, 150);
    this.doc.text("AgriSeva AI - Smart Farm Report", this.margin, this.y - 5);
    this.doc.setDrawColor(230, 230, 230);
    this.doc.setLineWidth(0.2);
    this.doc.line(this.margin, this.y - 3, this.pageWidth - this.margin, this.y - 3);
  }

  drawHeader(title: string, subtitle?: string) {
    // Top primary decorative bar (AgriSeva brand green)
    this.doc.setFillColor(21, 128, 61); // bg-primary / green-700
    this.doc.rect(0, 0, this.pageWidth, 12, "F");

    this.y = 25;

    // Title
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(22);
    this.doc.setTextColor(30, 30, 30);
    this.doc.text(title, this.margin, this.y);
    this.y += 8;

    // Subtitle
    if (subtitle) {
      this.doc.setFont("helvetica", "normal");
      this.doc.setFontSize(11);
      this.doc.setTextColor(100, 100, 100);
      this.doc.text(subtitle, this.margin, this.y);
      this.y += 6;
    }

    // Divider line
    this.doc.setDrawColor(21, 128, 61);
    this.doc.setLineWidth(0.8);
    this.doc.line(this.margin, this.y, this.pageWidth - this.margin, this.y);
    this.y += 10;
  }

  drawMetadataSection(items: { label: string; value: string }[]) {
    this.checkPageBreak(30);
    
    // Grey box background
    const boxHeight = 12 + Math.ceil(items.length / 2) * 8;
    this.doc.setFillColor(248, 248, 246);
    this.doc.roundedRect(this.margin, this.y, this.contentWidth, boxHeight, 3, 3, "F");
    this.doc.setDrawColor(230, 230, 225);
    this.doc.setLineWidth(0.3);
    this.doc.roundedRect(this.margin, this.y, this.contentWidth, boxHeight, 3, 3, "D");

    const startY = this.y + 6;
    this.doc.setFontSize(9);

    items.forEach((item, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const xPos = this.margin + 6 + col * (this.contentWidth / 2);
      const yPos = startY + row * 8;

      this.doc.setFont("helvetica", "bold");
      this.doc.setTextColor(80, 80, 80);
      this.doc.text(`${item.label}:`, xPos, yPos);

      this.doc.setFont("helvetica", "normal");
      this.doc.setTextColor(40, 40, 40);
      const labelWidth = this.doc.getTextWidth(`${item.label}: `);
      this.doc.text(item.value, xPos + labelWidth, yPos);
    });

    this.y += boxHeight + 10;
  }

  drawFooter() {
    const totalPages = this.doc.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i);
      this.doc.setFont("helvetica", "normal");
      this.doc.setFontSize(8);
      this.doc.setTextColor(150, 150, 150);
      
      // Footer text
      const dateStr = new Date().toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      this.doc.text(`Generated on ${dateStr} | AgriSeva AI`, this.margin, this.pageHeight - 10);
      
      // Page number
      const pageStr = `Page ${i} of ${totalPages}`;
      const pageStrWidth = this.doc.getTextWidth(pageStr);
      this.doc.text(pageStr, this.pageWidth - this.margin - pageStrWidth, this.pageHeight - 10);
    }
  }

  addTextWithWrap(text: string, fontSize: number, style: "normal" | "bold" | "italic", color: [number, number, number], spacingAfter: number = 6): number {
    this.doc.setFont("helvetica", style);
    this.doc.setFontSize(fontSize);
    this.doc.setTextColor(color[0], color[1], color[2]);
    
    const lines = this.doc.splitTextToSize(text, this.contentWidth - 10);
    const textHeight = lines.length * (fontSize * 0.35 + 1.5);
    this.checkPageBreak(textHeight + spacingAfter);

    lines.forEach((line: string) => {
      this.doc.text(line, this.margin + 5, this.y);
      this.y += (fontSize * 0.35 + 1.5);
    });

    this.y += spacingAfter;
    return textHeight;
  }

  save(filename: string) {
    this.drawFooter();
    this.doc.save(filename);
  }
}

export const exportCropCalendarPDF = (data: CropCalendar, lang: string = "en") => {
  const gen = new PDFGenerator();
  
  // Choose headers based on language
  const title = lang === "hi" ? "फसल कैलेंडर रिपोर्ट" : lang === "ta" ? "பயிர் காலண்டர் அறிக்கை" : "Crop Calendar Report";
  const subtitle = lang === "hi" ? "AgriSeva AI द्वारा व्यक्तिगत कृषि मार्गदर्शन" : lang === "ta" ? "AgriSeva AI இன் தனிப்பயனாக்கப்பட்ட விவசாய வழிகாட்டி" : "Personalized farming schedule by AgriSeva AI";
  
  gen.drawHeader(title, subtitle);

  const metaItems = [
    { label: lang === "hi" ? "फसल" : lang === "ta" ? "பயிர்" : "Crop", value: data.crop },
    { label: lang === "hi" ? "स्थान" : lang === "ta" ? "இடம்" : "Location", value: data.location },
    { label: lang === "hi" ? "रिपोर्ट प्रकार" : lang === "ta" ? "அறிக்கை வகை" : "Report Type", value: "Crop Timeline" }
  ];
  gen.drawMetadataSection(metaItems);

  // Section header
  gen.checkPageBreak(15);
  gen.doc.setFont("helvetica", "bold");
  gen.doc.setFontSize(14);
  gen.doc.setTextColor(21, 128, 61);
  gen.doc.text(lang === "hi" ? "महीनेवार कृषि गतिविधियां" : lang === "ta" ? "மாதாந்திர விவசாய நடவடிக்கைகள்" : "Monthly Farming Activities", gen.margin, gen.y);
  gen.y += 8;

  data.events.forEach((event, index) => {
    // Check height needed: 10 (title/type) + description wrap height + some margin
    const descLines = gen.doc.splitTextToSize(event.description, gen.contentWidth - 16);
    const descHeight = descLines.length * 4.5;
    const neededHeight = 15 + descHeight + 10;
    
    gen.checkPageBreak(neededHeight);

    // Timeline event card background
    gen.doc.setFillColor(252, 252, 251);
    gen.doc.roundedRect(gen.margin, gen.y, gen.contentWidth, neededHeight - 6, 2, 2, "F");
    gen.doc.setDrawColor(240, 240, 235);
    gen.doc.setLineWidth(0.2);
    gen.doc.roundedRect(gen.margin, gen.y, gen.contentWidth, neededHeight - 6, 2, 2, "D");

    // Decorative type side bar
    const typeColor = event.type === 'planting' ? [59, 130, 246] : event.type === 'cultivation' ? [249, 115, 22] : [34, 197, 94];
    gen.doc.setFillColor(typeColor[0], typeColor[1], typeColor[2]);
    gen.doc.rect(gen.margin, gen.y, 1.5, neededHeight - 6, "F");

    // Event month
    gen.doc.setFont("helvetica", "bold");
    gen.doc.setFontSize(10);
    gen.doc.setTextColor(typeColor[0], typeColor[1], typeColor[2]);
    gen.doc.text(event.month.toUpperCase(), gen.margin + 5, gen.y + 6);

    // Event type badge
    gen.doc.setFont("helvetica", "bold");
    gen.doc.setFontSize(8);
    const typeLabel = event.type.toUpperCase();
    const labelWidth = gen.doc.getTextWidth(typeLabel);
    gen.doc.setFillColor(245, 245, 245);
    gen.doc.roundedRect(gen.pageWidth - gen.margin - labelWidth - 6, gen.y + 3, labelWidth + 3, 4.5, 1, 1, "F");
    gen.doc.setTextColor(100, 100, 100);
    gen.doc.text(typeLabel, gen.pageWidth - gen.margin - labelWidth - 4.5, gen.y + 6.2);

    // Activity title
    gen.doc.setFont("helvetica", "bold");
    gen.doc.setFontSize(11);
    gen.doc.setTextColor(40, 40, 40);
    gen.doc.text(event.activity, gen.margin + 5, gen.y + 12);

    // Description text
    gen.doc.setFont("helvetica", "normal");
    gen.doc.setFontSize(9);
    gen.doc.setTextColor(80, 80, 80);
    let tempY = gen.y + 17;
    descLines.forEach((line: string) => {
      gen.doc.text(line, gen.margin + 5, tempY);
      tempY += 4.5;
    });

    gen.y += neededHeight;
  });

  const safeFilename = `${data.crop.toLowerCase().replace(/\s+/g, "_")}_crop_calendar.pdf`;
  gen.save(safeFilename);
};

export const exportCropRotationPDF = (data: CropRotationData, lang: string = "en") => {
  const gen = new PDFGenerator();
  
  const title = lang === "hi" ? "फसल चक्र योजना रिपोर्ट" : lang === "ta" ? "பயிர் சுழற்சி திட்ட அறிக்கை" : "Crop Rotation Advisory";
  const subtitle = lang === "hi" ? "मृदा स्वास्थ्य को बढ़ावा देने वाली फसल चक्र सिफारिशें" : lang === "ta" ? "மண் வளம் காக்கும் சிறந்த பயிர் சுழற்சி பரிந்துரைகள்" : "Farming suggestions to optimize soil nutrition and yield";
  
  gen.drawHeader(title, subtitle);

  const metaItems = [
    { label: lang === "hi" ? "वर्तमान फसल" : lang === "ta" ? "தற்போதைய பயிர்" : "Current Crop", value: data.currentCrop },
    { label: lang === "hi" ? "स्थान" : lang === "ta" ? "இடம்" : "Location", value: data.location },
    { label: lang === "hi" ? "मिट्टी का प्रकार" : lang === "ta" ? "மண் வகை" : "Soil Type", value: data.soilType || "Standard" }
  ];
  gen.drawMetadataSection(metaItems);

  // Recommendations section header
  gen.checkPageBreak(15);
  gen.doc.setFont("helvetica", "bold");
  gen.doc.setFontSize(14);
  gen.doc.setTextColor(21, 128, 61);
  gen.doc.text(lang === "hi" ? "सुझाई गई वैकल्पिक फसलें" : lang === "ta" ? "பரிந்துரைக்கப்பட்ட மாற்று பயிர்கள்" : "Recommended Next Crops", gen.margin, gen.y);
  gen.y += 8;

  data.suggestions.forEach((suggestion, index) => {
    // Pre-calculate heights
    const reasoningLines = gen.doc.splitTextToSize(suggestion.reasoning, gen.contentWidth - 10);
    const reasoningHeight = reasoningLines.length * 4.5;
    
    // Calculate space needed for benefits & risks
    const benefitsHeight = Math.max(suggestion.benefits.length * 4, 15);
    const risksHeight = Math.max(suggestion.risks.length * 4, 15);
    const listsHeight = Math.max(benefitsHeight, risksHeight) + 10;

    const neededHeight = 15 + reasoningHeight + listsHeight + 12;

    gen.checkPageBreak(neededHeight);

    // Box outer border
    gen.doc.setFillColor(253, 253, 252);
    gen.doc.roundedRect(gen.margin, gen.y, gen.contentWidth, neededHeight - 6, 2, 2, "F");
    gen.doc.setDrawColor(230, 230, 220);
    gen.doc.setLineWidth(0.3);
    gen.doc.roundedRect(gen.margin, gen.y, gen.contentWidth, neededHeight - 6, 2, 2, "D");

    // Left green ribbon accent
    gen.doc.setFillColor(21, 128, 61);
    gen.doc.rect(gen.margin, gen.y, 2, neededHeight - 6, "F");

    // Crop option title
    gen.doc.setFont("helvetica", "bold");
    gen.doc.setFontSize(12);
    gen.doc.setTextColor(21, 128, 61);
    gen.doc.text(`${index + 1}. ${suggestion.crop}`, gen.margin + 5, gen.y + 7);

    // Recommendation badge
    gen.doc.setFont("helvetica", "bold");
    gen.doc.setFontSize(8);
    const badgeLabel = `RECOMMENDED OPTION`;
    const bWidth = gen.doc.getTextWidth(badgeLabel);
    gen.doc.setFillColor(240, 248, 241);
    gen.doc.roundedRect(gen.pageWidth - gen.margin - bWidth - 6, gen.y + 3.5, bWidth + 3, 4.5, 1, 1, "F");
    gen.doc.setTextColor(21, 128, 61);
    gen.doc.text(badgeLabel, gen.pageWidth - gen.margin - bWidth - 4.5, gen.y + 6.7);

    // Reasoning
    gen.doc.setFont("helvetica", "italic");
    gen.doc.setFontSize(9.5);
    gen.doc.setTextColor(70, 70, 70);
    let tempY = gen.y + 13;
    reasoningLines.forEach((line: string) => {
      gen.doc.text(line, gen.margin + 5, tempY);
      tempY += 4.5;
    });

    // Draw benefits & risks side by side
    const colWidth = (gen.contentWidth - 15) / 2;
    const col1X = gen.margin + 5;
    const col2X = gen.margin + 10 + colWidth;
    let listYStart = tempY + 4;

    // Col 1: Benefits
    gen.doc.setFont("helvetica", "bold");
    gen.doc.setFontSize(9);
    gen.doc.setTextColor(22, 101, 52); // green text
    gen.doc.text(lang === "hi" ? "लाभ / फायदे" : lang === "ta" ? "நன்மைகள்" : "Benefits & Advantages", col1X, listYStart);
    
    gen.doc.setFont("helvetica", "normal");
    gen.doc.setFontSize(8.5);
    gen.doc.setTextColor(80, 80, 80);
    let listY = listYStart + 5;
    suggestion.benefits.forEach((benefit) => {
      const bLines = gen.doc.splitTextToSize(`• ${benefit}`, colWidth);
      bLines.forEach((line: string) => {
        gen.doc.text(line, col1X, listY);
        listY += 4;
      });
    });

    // Col 2: Risks
    gen.doc.setFont("helvetica", "bold");
    gen.doc.setFontSize(9);
    gen.doc.setTextColor(194, 65, 12); // orange-700
    gen.doc.text(lang === "hi" ? "जोखिम / सावधानियां" : lang === "ta" ? "சவால்கள்" : "Potential Risks & Challenges", col2X, listYStart);
    
    gen.doc.setFont("helvetica", "normal");
    gen.doc.setFontSize(8.5);
    gen.doc.setTextColor(80, 80, 80);
    let listY2 = listYStart + 5;
    suggestion.risks.forEach((risk) => {
      const rLines = gen.doc.splitTextToSize(`• ${risk}`, colWidth);
      rLines.forEach((line: string) => {
        gen.doc.text(line, col2X, listY2);
        listY2 += 4;
      });
    });

    gen.y += neededHeight;
  });

  const safeFilename = `crop_rotation_${data.currentCrop.toLowerCase().replace(/\s+/g, "_")}.pdf`;
  gen.save(safeFilename);
};
