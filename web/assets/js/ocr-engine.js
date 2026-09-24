// EPA OCR & Rule-Based Question Parser Engine
const EPAOcrEngine = {
  // Bengali to English digit converter
  bnToEnDigits(str) {
    if (!str) return '';
    const bn = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
    return str.replace(/[০-৯]/g, (d) => bn.indexOf(d));
  },

  // English to Bengali digit converter
  enToBnDigits(str) {
    if (str === null || str === undefined) return '';
    const bn = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
    return String(str).replace(/[0-9]/g, (d) => bn[parseInt(d)]);
  },

  // Detect Exam Year from text, headers, and filename
  detectExamYear(rawText, filename = '') {
    const combined = (filename + '\n' + (rawText ? rawText.slice(0, 1000) : '')).trim();
    
    // Look for academic/exam year indicators: পরীক্ষা - ২০২৪, সেশন ২০২১-২২, Exam 2023, Year 2024
    const explicitPatterns = [
      /(?:পরীক্ষা|সাল|সন|বছর|Year|Exam|Session|সেশন)[^\d০-৯\n]{0,15}(২০[১-৩][০-৯]|20[1-3][0-9])/i,
      /(?:২০[১-৩][০-৯]|20[1-3][0-9])\s*(?:সালের|সনের|এর)?\s*(?:ডিগ্রি|অনার্স|মাস্টার্স|এইচএসসি|পরীক্ষা|Exam)/i,
      /\b(20[1-3][0-9])[-–/](20[1-3][0-9]|[0-9]{2})\b/,
      /\b(২০[১-৩][০-৯])[-–/](২০[১-৩][০-৯]|[০-৯]{2})\b/
    ];

    for (const pattern of explicitPatterns) {
      const match = combined.match(pattern);
      if (match && match[1]) {
        return {
          year: this.bnToEnDigits(match[1]),
          confidence: 0.95,
          source: 'explicit_header'
        };
      }
    }

    // Secondary scan: check for standalone 4-digit years between 2000 and 2030 in the first 400 chars
    const firstBlock = combined.slice(0, 400);
    const yearMatches = firstBlock.match(/\b(20[1-3][0-9]|২০[১-৩][০-৯])\b/g);
    if (yearMatches && yearMatches.length > 0) {
      // Return first detected year
      return {
        year: this.bnToEnDigits(yearMatches[0]),
        confidence: 0.8,
        source: 'header_year'
      };
    }

    return {
      year: null,
      confidence: 0.0,
      source: 'Not detected. Please verify manually.'
    };
  },

  // Detect Subject from header text
  detectSubject(rawText) {
    const text = (rawText || '').slice(0, 1200);
    const subjects = [
      { name: 'ইসলামের ইতিহাস ও সংস্কৃতি', keywords: ['ইসলামের ইতিহাস', 'Islamic History', 'ইসলামের ইতিহাস ও সংস্কৃতি', 'হিজরত', 'উমাইয়া', 'আব্বাসীয়'] },
      { name: 'বাংলা', keywords: ['বাংলা ১ম পত্র', 'বাংলা ২য় পত্র', 'সাহিত্য', 'Bangla', 'বাংলা ভাষা'] },
      { name: 'ইংরেজি', keywords: ['English', 'English 1st', 'English 2nd', 'Grammar'] },
      { name: 'বাংলাদেশ ও আন্তর্জাতিক বিষয়াবলি', keywords: ['বাংলাদেশ বিষয়াবলি', 'আন্তর্জাতিক বিষয়াবলি', 'মুক্তিযুদ্ধ', 'সংবিধান'] },
      { name: 'রাষ্ট্রবিজ্ঞান', keywords: ['রাষ্ট্রবিজ্ঞান', 'Political Science', 'সার্বভৌমত্ব', 'সংবিধান'] },
      { name: 'অর্থনীতি', keywords: ['অর্থনীতি', 'Economics', 'চাহিদা', 'যোগান', 'মুদ্রাস্ফীতি'] }
    ];

    for (const subj of subjects) {
      for (const kw of subj.keywords) {
        if (text.includes(kw)) {
          return { subject: subj.name, confidence: 0.9 };
        }
      }
    }

    return { subject: null, confidence: 0.0 };
  },

  // Detect sections: ক বিভাগ, খ বিভাগ, গ বিভাগ or Part A, B, C
  detectSections(rawText) {
    const lines = rawText.split('\n');
    const sections = [];
    const sectionRegex = /^(?:[‘'"\s]*)(?:(ক|খ|গ|ঘ)\s*বিভাগ|Part\s*[-–:]?\s*([A-D])|Group\s*[-–:]?\s*([A-D]))/i;

    lines.forEach((line, index) => {
      const match = line.trim().match(sectionRegex);
      if (match) {
        const name = match[1] ? `${match[1]} বিভাগ` : `Part ${match[2] || match[3]}`;
        sections.push({
          lineIndex: index,
          name: name,
          rawLine: line.trim()
        });
      }
    });

    return sections;
  },

  // Extract questions with numbering patterns
  extractQuestions(rawText, metadata = {}) {
    if (!rawText) return [];
    const lines = rawText.split('\n');
    const extracted = [];
    
    let currentSection = 'ক বিভাগ'; // Default fallback
    let currentMarks = 1;
    let currentQuestion = null;
    let lineNumber = 0;

    // Regex for question starters: ১., ২., ১।, 1., (ক), ক., (a), a., 1)
    const qNumRegex = /^(?:[‘'"\s]*)(?:(\d{1,2}|[০-৯]{1,2})[\.\।\)\-]|(?:\(([০-৯]{1,2}|\d{1,2})\))|(?:([ক-হa-dA-D])[\.\।\)\-]))\s*(.*)$/;
    const sectionRegex = /(?:(ক|খ|গ|ঘ)\s*বিভাগ|Part\s*([A-D])|Group\s*([A-D]))/i;
    const marksRegex = /(?:মান\s*[:=]\s*(\d+|[০-৯]+)|(?:marks?|marks?)\s*[:=]\s*(\d+)|\[(\d+|[০-৯]+)\]|\((\d+|[০-৯]+)\s*(?:marks?|নম্বর)?\))/i;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      lineNumber++;

      // Check section header
      const secMatch = line.match(sectionRegex);
      if (secMatch) {
        currentSection = secMatch[1] ? `${secMatch[1]} বিভাগ` : `Part ${secMatch[2] || secMatch[3]}`;
        // Default marks by section standard in BD degree/honours:
        if (currentSection.includes('ক') || currentSection.includes('A')) currentMarks = 1;
        else if (currentSection.includes('খ') || currentSection.includes('B')) currentMarks = 4;
        else if (currentSection.includes('গ') || currentSection.includes('C')) currentMarks = 10;
        continue;
      }

      // Check explicit marks in line
      const markMatch = line.match(marksRegex);
      if (markMatch) {
        const found = markMatch[1] || markMatch[2] || markMatch[3] || markMatch[4];
        if (found) currentMarks = parseInt(this.bnToEnDigits(found)) || currentMarks;
      }

      // Check question starter
      const match = line.match(qNumRegex);
      if (match) {
        // Save previous question
        if (currentQuestion && currentQuestion.question_text.length > 5) {
          extracted.push(currentQuestion);
        }

        const rawNum = match[1] || match[2] || match[3] || '১';
        const initialText = (match[4] || '').trim();

        currentQuestion = {
          id: 'q_' + Date.now() + '_' + extracted.length,
          question_number: rawNum,
          question_text: initialText,
          original_ocr_text: line,
          verified_question_text: initialText,
          section: currentSection,
          marks: currentMarks,
          exam_year: metadata.exam_year || null,
          subject: metadata.subject || 'সাধারণ বিষয়',
          chapter: null,
          topic: null,
          page_number: metadata.page_number || 1,
          ocr_confidence: 0.88,
          verification_status: initialText.length > 10 ? 'Verified' : 'Needs Verification',
          created_at: new Date().toISOString()
        };
      } else if (currentQuestion) {
        // Append continuation line to current question
        currentQuestion.question_text += ' ' + line;
        currentQuestion.verified_question_text = currentQuestion.question_text;
        currentQuestion.original_ocr_text += '\n' + line;
      }
    }

    if (currentQuestion && currentQuestion.question_text.length > 5) {
      extracted.push(currentQuestion);
    }

    return extracted;
  }
};
