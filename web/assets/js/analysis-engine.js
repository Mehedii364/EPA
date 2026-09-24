// EPA Analytics Engine: Duplicates, Similarity, Frequencies, and Historical Dates
const EPAAnalysisEngine = {
  // Text Normalizer for Bangla and English
  normalizeText(text) {
    if (!text) return '';
    return text
      .toLowerCase()
      // Remove punctuation: ।, ?, !, ., ,, :, ;, ", ', (, ), -, —, etc.
      .replace(/[।\?\!\.\,\:\;\"\'\(\)\-\—\–\[\]\{\}\/\\`~@#$%^&*+=<>]/g, ' ')
      // Normalize Bengali hasant / nukta if needed
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      // Remove multiple whitespaces
      .replace(/\s+/g, ' ')
      .trim();
  },

  // Tokenize normalized text into set of unique words
  tokenize(text) {
    const norm = this.normalizeText(text);
    if (!norm) return [];
    // Filter common Bangla stop-words for semantic similarity
    const stopWords = new Set(['কি', 'কাকে', 'বলে', 'বলতে', 'কী', 'বোঝ', 'বুঝায়', 'আলোচনা', 'কর', 'করো', 'ব্যাখ্যা', 'বর্ণনা', 'দাও', 'কত', 'কোন', 'কোথায়', 'কে', 'কবে', 'কেন', 'এবং', 'ও', 'বা']);
    return norm.split(' ').filter(w => w.length > 1 && !stopWords.has(w));
  },

  // Calculate Jaccard / Token overlap similarity (0 to 100%)
  calculateSimilarity(text1, text2) {
    const tokens1 = this.tokenize(text1);
    const tokens2 = this.tokenize(text2);

    if (tokens1.length === 0 || tokens2.length === 0) return 0;

    const set1 = new Set(tokens1);
    const set2 = new Set(tokens2);

    let intersectionCount = 0;
    for (const t of set1) {
      if (set2.has(t)) intersectionCount++;
    }

    const unionCount = new Set([...tokens1, ...tokens2]).size;
    if (unionCount === 0) return 0;

    // Combined Jaccard + Overlap coefficient
    const jaccard = intersectionCount / unionCount;
    const overlap = intersectionCount / Math.min(set1.size, set2.size);
    const blended = (jaccard * 0.4 + overlap * 0.6) * 100;

    return Math.round(blended);
  },

  // Detect Exact Repeats across all questions
  findExactRepeats(questions) {
    const map = new Map();

    questions.forEach(q => {
      const norm = this.normalizeText(q.verified_question_text || q.question_text);
      if (norm.length < 6) return;
      if (!map.has(norm)) {
        map.set(norm, []);
      }
      map.get(norm).push(q);
    });

    const repeats = [];
    map.forEach((items, normText) => {
      if (items.length > 1) {
        // Collect distinct years
        const years = [...new Set(items.map(i => i.exam_year).filter(Boolean))].sort();
        if (years.length > 1 || items.length > 1) {
          repeats.push({
            normalizedText: normText,
            sampleQuestion: items[0],
            firstAppeared: years[0] || 'Unknown',
            alsoAppeared: years.slice(1),
            allYears: years,
            totalOccurrences: items.length,
            questions: items
          });
        }
      }
    });

    // Sort by most repeated
    return repeats.sort((a, b) => b.totalOccurrences - a.totalOccurrences);
  },

  // Detect Similar Questions with configurable threshold
  findSimilarQuestions(questions, threshold = 70) {
    const pairs = [];
    const n = questions.length;

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const q1 = questions[i];
        const q2 = questions[j];

        const norm1 = this.normalizeText(q1.verified_question_text || q1.question_text);
        const norm2 = this.normalizeText(q2.verified_question_text || q2.question_text);

        // Skip exact identical (which belong to exact repeats)
        if (norm1 === norm2) continue;

        const sim = this.calculateSimilarity(norm1, norm2);
        if (sim >= threshold) {
          pairs.push({
            id: `sim_${q1.id}_${q2.id}`,
            question1: q1,
            question2: q2,
            similarity: sim,
            years: [q1.exam_year, q2.exam_year].filter(Boolean)
          });
        }
      }
    }

    return pairs.sort((a, b) => b.similarity - a.similarity);
  },

  // Analyze Questions by Year
  analyzeYearDistribution(questions, filters = {}) {
    let filtered = questions;
    if (filters.subject) filtered = filtered.filter(q => q.subject === filters.subject);
    if (filters.section) filtered = filtered.filter(q => q.section === filters.section);
    if (filters.chapter) filtered = filtered.filter(q => q.chapter === filters.chapter);
    if (filters.topic) filtered = filtered.filter(q => q.topic === filters.topic);
    if (filters.marks) filtered = filtered.filter(q => Number(q.marks) === Number(filters.marks));

    const yearCounts = {};
    filtered.forEach(q => {
      const yr = q.exam_year || 'Undated';
      yearCounts[yr] = (yearCounts[yr] || 0) + 1;
    });

    const sortedYears = Object.keys(yearCounts).sort();
    return {
      years: sortedYears,
      counts: sortedYears.map(y => yearCounts[y]),
      total: filtered.length
    };
  },

  // Analyze Topic Frequency
  analyzeTopicFrequency(questions, filters = {}) {
    let filtered = questions;
    if (filters.subject) filtered = filtered.filter(q => q.subject === filters.subject);
    if (filters.year) filtered = filtered.filter(q => q.exam_year === filters.year);

    const topicMap = new Map();

    filtered.forEach(q => {
      const topic = q.topic || 'সাধারণ প্রশ্নাবলি';
      if (!topicMap.has(topic)) {
        topicMap.set(topic, { topic, count: 0, years: new Set(), questions: [] });
      }
      const entry = topicMap.get(topic);
      entry.count++;
      if (q.exam_year) entry.years.add(q.exam_year);
      entry.questions.push(q);
    });

    const total = filtered.length || 1;
    const list = Array.from(topicMap.values()).map(e => ({
      topic: e.topic,
      count: e.count,
      percentage: Math.round((e.count / total) * 100),
      years: Array.from(e.years).sort(),
      questions: e.questions
    }));

    return list.sort((a, b) => b.count - a.count);
  },

  // Analyze Chapter Distribution
  analyzeChapterFrequency(questions, filters = {}) {
    let filtered = questions;
    if (filters.subject) filtered = filtered.filter(q => q.subject === filters.subject);

    const chapterMap = new Map();

    filtered.forEach(q => {
      const chapter = q.chapter || 'অধ্যায় নির্ধারিত হয়নি';
      if (!chapterMap.has(chapter)) {
        chapterMap.set(chapter, { chapter, count: 0, years: new Set(), questions: [] });
      }
      const entry = chapterMap.get(chapter);
      entry.count++;
      if (q.exam_year) entry.years.add(q.exam_year);
      entry.questions.push(q);
    });

    const total = filtered.length || 1;
    return Array.from(chapterMap.values()).map(e => ({
      chapter: e.chapter,
      count: e.count,
      percentage: Math.round((e.count / total) * 100),
      years: Array.from(e.years).sort(),
      questions: e.questions
    })).sort((a, b) => b.count - a.count);
  },

  // Analyze Marks Distribution
  analyzeMarksDistribution(questions, filters = {}) {
    let filtered = questions;
    if (filters.subject) filtered = filtered.filter(q => q.subject === filters.subject);

    const marksMap = { '1 Mark': 0, '4 Marks': 0, '5 Marks': 0, '10 Marks': 0, 'Other': 0 };

    filtered.forEach(q => {
      const m = parseInt(q.marks) || 1;
      if (m === 1) marksMap['1 Mark']++;
      else if (m === 4) marksMap['4 Marks']++;
      else if (m === 5) marksMap['5 Marks']++;
      else if (m === 10) marksMap['10 Marks']++;
      else marksMap['Other']++;
    });

    const total = filtered.length || 1;
    return Object.entries(marksMap).map(([label, count]) => ({
      label,
      count,
      percentage: Math.round((count / total) * 100)
    }));
  },

  // Extract Historical Dates (Important Years mentioned in question content, NOT Exam Year)
  extractHistoricalDates(questions) {
    const historical = [];
    
    // Patterns for historical dates inside questions:
    // e.g., ৬২২ খ্রিস্টাব্দে, 622 CE, 1757 সালে, পলাশীর যুদ্ধ (১৭৫৭), 1952 সালের ভাষা আন্দোলন, 1971
    const dateRegexes = [
      /(\d{3,4}|[০-৯]{3,4})\s*(?:খ্রিস্টাব্দে|খ্রিঃ|সালে|সনে|খ্রিস্টাব্দ|সালের|BC|BCE|CE|AD)/i,
      /(?:হিজরি|হিজরী)\s*(\d{1,3}|[০-৯]{1,3})/i,
      /\((\d{3,4}|[০-৯]{3,4})\s*(?:খ্রিঃ|খ্রিস্টাব্দ)?\)/i
    ];

    questions.forEach(q => {
      const text = q.verified_question_text || q.question_text || '';
      for (const regex of dateRegexes) {
        const match = text.match(regex);
        if (match && match[1]) {
          const rawDate = match[1];
          const enDate = EPAOcrEngine.bnToEnDigits(rawDate);
          const dateNum = parseInt(enDate);

          // Historical dates are usually < 2000, or explicitly historical events (like 1952, 1971)
          if (!isNaN(dateNum) && (dateNum < 2000 || text.includes('আন্দোলন') || text.includes('যুদ্ধ') || text.includes('হিজরত') || text.includes('সনদ') || text.includes('চুক্তি'))) {
            // Check if not already extracted for this question
            if (!historical.some(h => h.question_id === q.id && h.historical_date === enDate)) {
              historical.push({
                id: 'hd_' + q.id + '_' + enDate,
                question_id: q.id,
                question_text: text,
                historical_date: enDate,
                bengali_date: EPAOcrEngine.enToBnDigits(enDate),
                event_hint: this.extractEventHint(text, match[0]),
                exam_year: q.exam_year,
                subject: q.subject,
                section: q.section,
                marks: q.marks
              });
            }
          }
        }
      }
    });

    return historical.sort((a, b) => parseInt(a.historical_date) - parseInt(b.historical_date));
  },

  extractEventHint(text, matchStr) {
    // Extract surrounding words around date match
    const idx = text.indexOf(matchStr);
    if (idx === -1) return text.slice(0, 50);
    const start = Math.max(0, idx - 25);
    const end = Math.min(text.length, idx + matchStr.length + 35);
    return text.substring(start, end).trim();
  }
};
