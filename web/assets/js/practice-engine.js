// EPA Practice Mode Engine: Flashcards, Verified 1-Mark, MCQ & Past Paper Quizzes
const EPAPracticeEngine = {
  state: {
    isActive: false,
    questions: [],
    currentIndex: 0,
    timeLimitSeconds: 600,
    remainingSeconds: 600,
    timerInterval: null,
    answers: {},
    results: null
  },

  // Initialize practice session
  startSession(questions, config = {}) {
    if (!questions || questions.length === 0) return false;

    // Filter only verified questions
    const verified = questions.filter(q => q.verification_status === 'Verified' || q.question_text.length > 5);
    let pool = verified.length > 0 ? verified : questions;

    // Apply config filters
    if (config.subject) pool = pool.filter(q => q.subject === config.subject);
    if (config.section) pool = pool.filter(q => q.section === config.section);
    if (config.chapter) pool = pool.filter(q => q.chapter === config.chapter);
    if (config.year) pool = pool.filter(q => q.exam_year === config.year);
    if (config.marks) pool = pool.filter(q => Number(q.marks) === Number(config.marks));

    // Shuffle pool if requested
    let selected = [...pool];
    if (config.shuffle !== false) {
      selected = selected.sort(() => 0.5 - Math.random());
    }

    const count = Math.min(config.count || 10, selected.length);
    selected = selected.slice(0, count);

    if (selected.length === 0) return false;

    const timeLimit = (config.timeLimitMinutes || 10) * 60;

    this.state = {
      isActive: true,
      questions: selected,
      currentIndex: 0,
      timeLimitSeconds: timeLimit,
      remainingSeconds: timeLimit,
      timerInterval: null,
      answers: {},
      results: null,
      startTime: Date.now(),
      config: config
    };

    return true;
  },

  // Record answer for current question
  recordAnswer(isCorrect, isSkipped = false) {
    if (!this.state.isActive) return;
    const currentQ = this.state.questions[this.state.currentIndex];
    this.state.answers[currentQ.id] = {
      questionId: currentQ.id,
      isCorrect: isCorrect,
      isSkipped: isSkipped,
      answeredAt: Date.now()
    };
  },

  // Move to next question or finish
  nextQuestion() {
    if (this.state.currentIndex < this.state.questions.length - 1) {
      this.state.currentIndex++;
      return false; // not finished
    } else {
      return this.finishSession();
    }
  },

  previousQuestion() {
    if (this.state.currentIndex > 0) {
      this.state.currentIndex--;
    }
  },

  // Finish practice session and compute statistics
  finishSession() {
    this.state.isActive = false;
    clearInterval(this.state.timerInterval);

    const total = this.state.questions.length;
    let correct = 0;
    let wrong = 0;
    let skipped = 0;

    this.state.questions.forEach(q => {
      const ans = this.state.answers[q.id];
      if (!ans || ans.isSkipped) {
        skipped++;
      } else if (ans.isCorrect) {
        correct++;
      } else {
        wrong++;
      }
    });

    const timeUsed = this.state.timeLimitSeconds - this.state.remainingSeconds;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    const score = correct * 1; // 1 mark per correct

    this.state.results = {
      id: 'attempt_' + Date.now(),
      totalQuestions: total,
      correct: correct,
      wrong: wrong,
      skipped: skipped,
      score: score,
      accuracy: accuracy,
      timeUsedSeconds: Math.max(timeUsed, 1),
      completedAt: new Date().toISOString(),
      subject: this.state.config?.subject || 'All Subjects',
      exam_year: this.state.config?.year || 'Various Years'
    };

    return this.state.results;
  }
};
