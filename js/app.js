// =====================================================================
// Security+ SY0-701 Study App — Enhanced Edition
// =====================================================================

window.APP = {
  questions: [],
  currentTest: [],
  currentAnswers: [],
  currentIndex: 0,
  mode: 'test', // 'test' | 'drill' | 'exam-sim'
  drillNotice: null,
  keyboardSelected: null,
  examSim: null
};

const DOMAIN_NAMES = {
  1: "General Security Concepts",
  2: "Threats, Vulnerabilities & Mitigations",
  3: "Security Architecture",
  4: "Security Operations",
  5: "Security Program Management & Oversight"
};

const DOMAIN_WEIGHTS = {
  1: 0.12,
  2: 0.22,
  3: 0.18,
  4: 0.28,
  5: 0.20
};

const OBJECTIVES = {
  "1.1": { domain: 1, title: "Security Controls" },
  "1.2": { domain: 1, title: "Fundamental Security Concepts" },
  "1.3": { domain: 1, title: "Change Management" },
  "1.4": { domain: 1, title: "Cryptographic Solutions" },
  "2.1": { domain: 2, title: "Threat Actors & Motivations" },
  "2.2": { domain: 2, title: "Threat Vectors & Attack Surfaces" },
  "2.3": { domain: 2, title: "Types of Vulnerabilities" },
  "2.4": { domain: 2, title: "Indicators of Malicious Activity" },
  "2.5": { domain: 2, title: "Mitigation Techniques" },
  "3.1": { domain: 3, title: "Architecture Models" },
  "3.2": { domain: 3, title: "Securing Enterprise Infrastructure" },
  "3.3": { domain: 3, title: "Protecting Data" },
  "3.4": { domain: 3, title: "Resilience & Recovery" },
  "4.1": { domain: 4, title: "Securing Computing Resources" },
  "4.2": { domain: 4, title: "Asset Management" },
  "4.3": { domain: 4, title: "Vulnerability Management" },
  "4.4": { domain: 4, title: "Alerting & Monitoring" },
  "4.5": { domain: 4, title: "Enhancing Enterprise Security Capabilities" },
  "4.6": { domain: 4, title: "Identity & Access Management" },
  "4.7": { domain: 4, title: "Automation & Orchestration" },
  "4.8": { domain: 4, title: "Incident Response" },
  "4.9": { domain: 4, title: "Data Sources for Investigation" },
  "5.1": { domain: 5, title: "Security Governance" },
  "5.2": { domain: 5, title: "Risk Management" },
  "5.3": { domain: 5, title: "Third-Party Risk Management" },
  "5.4": { domain: 5, title: "Security Compliance" },
  "5.5": { domain: 5, title: "Audits & Assessments" },
  "5.6": { domain: 5, title: "Security Awareness Practices" }
};

const FORMAT_LABELS = {
  multiple_choice: "Multiple Choice",
  multi_select: "Multi-Select",
  pbq_scenario: "Scenario (PBQ)"
};

const PASS_THRESHOLD = 83;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

// =====================================================================
// A. DATA LOADING
// =====================================================================

async function loadQuestions() {
  const files = [1, 2, 3, 4, 5].map(n => `data/questions-${n}.json`);
  const results = await Promise.all(
    files.map(f => fetch(f).then(r => {
      if (!r.ok) throw new Error(`Failed to load ${f}: ${r.status}`);
      return r.json();
    }))
  );
  window.APP.questions = results.flat();
  window.ALL_QUESTIONS = window.APP.questions;
}

// =====================================================================
// B. DAILY TEST GENERATOR
// =====================================================================

function fisherYatesShuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getSeenIds() {
  return JSON.parse(localStorage.getItem('seen_question_ids') || '{}');
}

function markSeen(id) {
  const seen = getSeenIds();
  seen[id] = new Date().toISOString();
  localStorage.setItem('seen_question_ids', JSON.stringify(seen));
}

function declusterFormats(arr) {
  const a = arr.slice();
  for (let i = 1; i < a.length; i++) {
    if (a[i].format === a[i - 1].format) {
      for (let j = i + 1; j < a.length; j++) {
        if (a[j].format !== a[i - 1].format) {
          [a[i], a[j]] = [a[j], a[i]];
          break;
        }
      }
    }
  }
  return a;
}

function generateDailyTest(numQuestions = 25) {
  const all = window.ALL_QUESTIONS;
  const total = Math.min(numQuestions, all.length);
  const seen = getSeenIds();
  const now = Date.now();

  const domainIds = [1, 2, 3, 4, 5];
  const quotas = {};
  let runningSum = 0;
  domainIds.forEach((d, i) => {
    if (i < domainIds.length - 1) {
      quotas[d] = Math.round(DOMAIN_WEIGHTS[d] * total);
      runningSum += quotas[d];
    }
  });
  quotas[domainIds[domainIds.length - 1]] = total - runningSum;

  const selected = [];
  const usedIds = new Set();

  domainIds.forEach(d => {
    const domainQuestions = all.filter(q => q.domain === d);
    let pool = domainQuestions.filter(q => {
      const ts = seen[q.id];
      return !ts || (now - new Date(ts).getTime()) > SEVEN_DAYS_MS;
    });
    if (pool.length < quotas[d]) pool = domainQuestions;
    const picks = fisherYatesShuffle(pool).slice(0, quotas[d]);
    picks.forEach(q => usedIds.add(q.id));
    selected.push(...picks);
  });

  if (selected.length < total) {
    const leftover = fisherYatesShuffle(all.filter(q => !usedIds.has(q.id)));
    for (const q of leftover) {
      if (selected.length >= total) break;
      selected.push(q);
      usedIds.add(q.id);
    }
  }

  return declusterFormats(fisherYatesShuffle(selected));
}

// =====================================================================
// C. TEST RUNNER (Daily Test and Drill Mode)
// =====================================================================

function startTest() {
  window.APP.mode = 'test';
  window.APP.drillNotice = null;
  window.APP.currentTest = generateDailyTest(25);
  window.APP.currentAnswers = [];
  window.APP.currentIndex = 0;
  window.APP.keyboardSelected = null;
  setActiveNav('test');
  showView('test');
  renderQuestion();
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

function runnerContainerId() {
  return window.APP.mode === 'drill' ? 'view-drill' : 'view-test';
}

function addBackLink(container) {
  const back = document.createElement('a');
  back.href = '#';
  back.className = 'back-link';
  back.textContent = '← Back';
  back.addEventListener('click', e => {
    e.preventDefault();
    if (confirm('Are you sure? Progress will be lost.')) {
      setActiveNav('home');
      showView('home');
      renderHome();
    }
  });
  container.appendChild(back);
}

function renderQuestion() {
  const test = window.APP.currentTest;
  const idx = window.APP.currentIndex;
  const q = test[idx];
  const container = document.getElementById(runnerContainerId());
  container.innerHTML = '';
  window.APP.keyboardSelected = null;

  addBackLink(container);

  if (window.APP.mode === 'drill' && window.APP.drillNotice) {
    const notice = document.createElement('div');
    notice.className = 'placeholder-banner';
    notice.textContent = window.APP.drillNotice;
    container.appendChild(notice);
  }

  const progress = document.createElement('div');
  progress.className = 'test-progress';
  const label = window.APP.mode === 'drill' ? 'Drill Question' : 'Question';
  progress.textContent = `${label} ${idx + 1} of ${test.length}`;
  container.appendChild(progress);

  const card = document.createElement('div');
  card.className = 'question-card';

  // Bookmark button
  const bmBtn = document.createElement('button');
  bmBtn.className = `bookmark-btn${isBookmarked(q.id) ? ' bookmarked' : ''}`;
  bmBtn.title = isBookmarked(q.id) ? 'Remove Bookmark' : 'Bookmark this question';
  bmBtn.textContent = isBookmarked(q.id) ? '🔖 Bookmarked' : '🔖 Bookmark';
  bmBtn.addEventListener('click', () => {
    toggleBookmark(q.id);
    bmBtn.className = `bookmark-btn${isBookmarked(q.id) ? ' bookmarked' : ''}`;
    bmBtn.textContent = isBookmarked(q.id) ? '🔖 Bookmarked' : '🔖 Bookmark';
    bmBtn.title = isBookmarked(q.id) ? 'Remove Bookmark' : 'Bookmark this question';
  });
  card.appendChild(bmBtn);

  const badge = document.createElement('span');
  badge.className = `badge badge-${q.difficulty}`;
  badge.textContent = q.difficulty;
  card.appendChild(badge);

  if (q.format === 'pbq_scenario') {
    const pbqBadge = document.createElement('span');
    pbqBadge.className = 'badge badge-pbq';
    pbqBadge.textContent = 'Performance-Based Question';
    card.appendChild(pbqBadge);

    if (q.scenario) {
      const scenarioBox = document.createElement('div');
      scenarioBox.className = 'scenario-box';
      const scenarioLabel = document.createElement('div');
      scenarioLabel.className = 'scenario-label';
      scenarioLabel.textContent = '📋 SCENARIO';
      scenarioBox.appendChild(scenarioLabel);
      const scenarioText = document.createElement('p');
      scenarioText.className = 'scenario-text';
      scenarioText.textContent = q.scenario;
      scenarioBox.appendChild(scenarioText);
      card.appendChild(scenarioBox);
    }
  }

  const stem = document.createElement('p');
  stem.className = 'question-stem';
  stem.textContent = q.stem;
  card.appendChild(stem);

  const answerArea = document.createElement('div');
  answerArea.className = 'answer-area';
  card.appendChild(answerArea);

  container.appendChild(card);

  renderAnswerInput(q, answerArea);

  // Keyboard hint
  if (!localStorage.getItem('keyboard_hint_dismissed')) {
    const hint = document.createElement('div');
    hint.className = 'keyboard-hint';
    hint.innerHTML = `<span>⌨️ Tip: Press A–D to select, Enter to confirm, Esc to quit</span>`;
    const dismissBtn = document.createElement('button');
    dismissBtn.className = 'dismiss-hint';
    dismissBtn.textContent = 'Dismiss';
    dismissBtn.addEventListener('click', () => {
      localStorage.setItem('keyboard_hint_dismissed', '1');
      hint.remove();
    });
    hint.appendChild(dismissBtn);
    container.appendChild(hint);
  }
}

function renderAnswerInput(q, container) {
  switch (q.format) {
    case 'multi_select':
      renderMultiSelect(q, container);
      break;
    case 'multiple_choice':
    case 'pbq_scenario':
    default:
      if (Array.isArray(q.answer)) {
        renderMultiSelect(q, container);
      } else {
        renderMultipleChoice(q, container);
      }
      break;
  }
}

function renderMultipleChoice(q, container) {
  const list = document.createElement('div');
  list.className = 'options-list';

  Object.entries(q.options).forEach(([key, text]) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.dataset.key = key;
    btn.textContent = `${key}. ${text}`;
    btn.addEventListener('click', () => {
      const allBtns = list.querySelectorAll('.option-btn');
      allBtns.forEach(b => { b.disabled = true; b.classList.remove('keyboard-focus'); });

      const correct = key === q.answer;
      btn.classList.add(correct ? 'correct' : 'incorrect');

      if (!correct) {
        const correctBtn = list.querySelector(`.option-btn[data-key="${q.answer}"]`);
        if (correctBtn) correctBtn.classList.add('correct');
      }

      window.APP.keyboardSelected = null;
      finishAnswer(q, key, correct, container);
    });
    list.appendChild(btn);
  });

  container.appendChild(list);
}

function renderMultiSelect(q, container) {
  const correctAnswers = Array.isArray(q.answer) ? q.answer : [q.answer];

  const instruction = document.createElement('p');
  instruction.className = 'instruction';
  instruction.textContent = `Select ${correctAnswers.length === 2 ? 'TWO' : correctAnswers.length} option(s) that apply.`;
  container.appendChild(instruction);

  const list = document.createElement('div');
  list.className = 'options-list';

  const checkboxes = {};
  Object.entries(q.options).forEach(([key, text]) => {
    const label = document.createElement('label');
    label.className = 'checkbox-option';

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.value = key;
    checkboxes[key] = cb;

    label.appendChild(cb);
    label.appendChild(document.createTextNode(` ${key}. ${text}`));
    list.appendChild(label);
  });

  container.appendChild(list);

  const submitBtn = document.createElement('button');
  submitBtn.className = 'submit-btn';
  submitBtn.textContent = 'Submit Answer';
  submitBtn.addEventListener('click', () => {
    const selected = Object.entries(checkboxes)
      .filter(([, cb]) => cb.checked)
      .map(([key]) => key);

    Object.values(checkboxes).forEach(cb => (cb.disabled = true));
    submitBtn.disabled = true;

    const correctSet = new Set(correctAnswers);
    const selectedSet = new Set(selected);
    const correct =
      correctSet.size === selectedSet.size &&
      [...correctSet].every(k => selectedSet.has(k));

    Object.entries(checkboxes).forEach(([key, cb]) => {
      const label = cb.parentElement;
      if (correctSet.has(key)) {
        label.classList.add('correct');
      } else if (selectedSet.has(key)) {
        label.classList.add('incorrect');
      }
    });

    finishAnswer(q, selected, correct, container);
  });

  container.appendChild(submitBtn);
}

function finishAnswer(q, userAnswer, correct, container) {
  window.APP.currentAnswers.push({
    question_id: q.id,
    user_answer: userAnswer,
    correct: correct,
    domain: q.domain,
    objective: q.objective,
    topic: q.topic,
    format: q.format,
    difficulty: q.difficulty,
    confidence: null
  });

  const answerIdx = window.APP.currentAnswers.length - 1;

  markSeen(q.id);

  const feedback = document.createElement('div');
  feedback.className = `feedback ${correct ? 'feedback-correct' : 'feedback-incorrect'}`;
  feedback.textContent = correct ? '✅ Correct!' : '❌ Incorrect';
  container.appendChild(feedback);

  if (q.format === 'pbq_scenario') {
    const whyLabel = document.createElement('div');
    whyLabel.className = 'why-label';
    whyLabel.textContent = '💡 Why this is correct:';
    container.appendChild(whyLabel);
  }

  const explanation = document.createElement('div');
  explanation.className = 'explanation';
  explanation.textContent = q.explanation;
  container.appendChild(explanation);

  if (q.comptia_logic_note) {
    const note = document.createElement('div');
    note.className = 'comptia-note';
    note.textContent = `💡 CompTIA Logic: ${q.comptia_logic_note}`;
    container.appendChild(note);
  }

  // Report Issue button
  renderReportButton(container, q);

  // Confidence rating (daily test and drill only)
  const confidenceRow = document.createElement('div');
  confidenceRow.className = 'confidence-row';

  const confLabel = document.createElement('span');
  confLabel.className = 'confidence-label';
  confLabel.textContent = 'How confident were you?';
  confidenceRow.appendChild(confLabel);

  [
    { key: 'guessed', label: '😰 Guessed' },
    { key: 'unsure', label: '🤔 Unsure' },
    { key: 'confident', label: '😊 Confident' }
  ].forEach(({ key, label }) => {
    const btn = document.createElement('button');
    btn.className = `confidence-btn ${key}`;
    btn.textContent = label;
    btn.addEventListener('click', () => {
      window.APP.currentAnswers[answerIdx].confidence = key;
      confidenceRow.querySelectorAll('.confidence-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
    confidenceRow.appendChild(btn);
  });

  container.appendChild(confidenceRow);

  const isLast = window.APP.currentIndex === window.APP.currentTest.length - 1;

  const nextBtn = document.createElement('button');
  nextBtn.className = 'next-btn';
  nextBtn.textContent = isLast
    ? (window.APP.mode === 'drill' ? 'See Drill Results' : 'See Results')
    : 'Next Question';
  nextBtn.addEventListener('click', () => {
    if (isLast) {
      finishRun();
    } else {
      window.APP.currentIndex++;
      renderQuestion();
    }
  });

  container.appendChild(nextBtn);
}

function finishRun() {
  const answers = window.APP.currentAnswers;
  const result = computeResults(answers);

  if (window.APP.mode === 'drill') {
    recordMisses(result.misses);
    setActiveNav('drill');
    showView('drill');
    renderDrillResults(result, answers);
  } else {
    saveSession(result, answers);
    const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
    const regularSessions = sessions.filter(s => !s.mode || s.mode === 'test');
    const previousPct = regularSessions.length >= 2
      ? regularSessions[regularSessions.length - 2].pct
      : null;
    const streak = parseInt(localStorage.getItem('streak') || '0', 10);

    setActiveNav(null);
    showView('results');
    renderResults(result, answers, { streak, previousPct });
  }
}

// =====================================================================
// D. SCORING + RESULTS VIEW
// =====================================================================

function computeResults(answers) {
  const total = answers.length;
  const correctCount = answers.filter(a => a.correct).length;
  const pct = total ? (correctCount / total) * 100 : 0;
  const pass = pct >= PASS_THRESHOLD;

  const domainStats = {};
  [1, 2, 3, 4, 5].forEach(d => (domainStats[d] = { total: 0, correct: 0 }));
  answers.forEach(a => {
    domainStats[a.domain].total++;
    if (a.correct) domainStats[a.domain].correct++;
  });

  const domainScores = {};
  Object.entries(domainStats).forEach(([d, s]) => {
    domainScores[d] = s.total ? (s.correct / s.total) * 100 : null;
  });

  const misses = answers
    .filter(a => !a.correct)
    .map(a => ({ objective: a.objective, topic: a.topic, domain: a.domain }));

  return {
    date: new Date().toISOString(),
    score: correctCount,
    total,
    pct,
    pass,
    domainStats,
    domainScores,
    misses
  };
}

function formatCorrectAnswer(q) {
  if (Array.isArray(q.answer)) {
    return q.answer.map(k => `${k}. ${q.options[k]}`).join(', ');
  }
  return `${q.answer}. ${q.options[q.answer]}`;
}

function formatUserAnswer(q, userAnswer) {
  if (Array.isArray(userAnswer)) {
    if (userAnswer.length === 0) return '(no selection)';
    return userAnswer.map(k => `${k}. ${q.options[k]}`).join(', ');
  }
  if (q.options && q.options[userAnswer] !== undefined) {
    return `${userAnswer}. ${q.options[userAnswer]}`;
  }
  return userAnswer || '(no answer)';
}

function buildMissedSection(answers) {
  const missed = answers.filter(a => !a.correct);
  if (!missed.length) return null;

  const missedSection = document.createElement('div');
  missedSection.className = 'missed-section';
  missedSection.innerHTML = '<h3>Missed Questions Review</h3>';

  missed.forEach(a => {
    const q = window.ALL_QUESTIONS.find(x => x.id === a.question_id);
    if (!q) return;

    const card = document.createElement('div');
    card.className = 'missed-card';

    let html = '';
    if (q.scenario) {
      html += `<div class="scenario-box">${escapeHtml(q.scenario)}</div>`;
    }
    html += `<p class="question-stem">${escapeHtml(q.stem)}</p>`;
    html += `<p><strong>Your answer:</strong> ${formatUserAnswer(q, a.user_answer)}</p>`;
    html += `<p><strong>Correct answer:</strong> ${formatCorrectAnswer(q)}</p>`;
    html += `<div class="explanation">${escapeHtml(q.explanation)}</div>`;
    if (q.comptia_logic_note) {
      html += `<div class="comptia-note">\u{1F4A1} CompTIA Logic: ${escapeHtml(q.comptia_logic_note)}</div>`;
    }

    card.innerHTML = html;

    // Report issue button (appended as DOM node after innerHTML)
    renderReportButton(card, q);

    missedSection.appendChild(card);
  });

  return missedSection;
}

function renderResults(result, answers, context) {
  const container = document.getElementById('view-results');
  container.innerHTML = '';

  const summary = document.createElement('div');
  summary.className = `score-summary ${result.pass ? 'pass' : 'fail'}`;
  summary.innerHTML = `
    <h2>${result.pass ? 'PASS' : 'FAIL'}</h2>
    <p class="score-line">${result.score} / ${result.total} — ${result.pct.toFixed(0)}% — ${result.pass ? 'PASS' : 'FAIL'}</p>
    <p class="threshold-note">Passing threshold: ${PASS_THRESHOLD}%</p>
  `;
  container.appendChild(summary);

  const domainSection = document.createElement('div');
  domainSection.className = 'domain-breakdown';
  domainSection.innerHTML = '<h3>Domain Breakdown</h3>';

  const table = document.createElement('table');
  table.className = 'domain-table';
  table.innerHTML = '<thead><tr><th>Domain</th><th>Questions</th><th>Correct</th><th>Score%</th><th>Pass/Fail</th></tr></thead>';

  const tbody = document.createElement('tbody');
  [1, 2, 3, 4, 5].forEach(d => {
    const stats = result.domainStats[d];
    if (stats.total === 0) return;
    const score = result.domainScores[d];

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>D${d} — ${escapeHtml(DOMAIN_NAMES[d])}</td>
      <td>${stats.total}</td>
      <td>${stats.correct}</td>
      <td>${score.toFixed(0)}%</td>
      <td class="${score >= PASS_THRESHOLD ? 'pass-text' : 'fail-text'}">${score >= PASS_THRESHOLD ? 'Pass' : 'Fail'}</td>
    `;
    tbody.appendChild(tr);

    const barRow = document.createElement('tr');
    const barCell = document.createElement('td');
    barCell.colSpan = 5;
    barCell.innerHTML = `<div class="progress-bar"><div class="progress-bar-fill" style="width:${score}%"></div></div>`;
    barRow.appendChild(barCell);
    tbody.appendChild(barRow);
  });

  table.appendChild(tbody);
  domainSection.appendChild(table);
  container.appendChild(domainSection);

  const missedSection = buildMissedSection(answers);
  if (missedSection) container.appendChild(missedSection);

  const tips = generateTips(result, answers, context);
  const tipsCard = document.createElement('div');
  tipsCard.className = 'tips-card';
  tipsCard.innerHTML = '<h3>\u{1F4CB} Study Tips for This Session</h3>';
  const ul = document.createElement('ul');
  tips.forEach(t => {
    const li = document.createElement('li');
    li.textContent = t;
    ul.appendChild(li);
  });
  tipsCard.appendChild(ul);
  container.appendChild(tipsCard);

  // Share with Claude
  container.appendChild(buildClaudeShareSection(result, answers, { mode: 'daily', tips }));

  const btnRow = document.createElement('div');
  btnRow.className = 'results-actions';

  const retakeBtn = document.createElement('button');
  retakeBtn.className = 'primary-btn';
  retakeBtn.textContent = 'Take Another Test';
  retakeBtn.addEventListener('click', () => startTest());

  const drillBtn = document.createElement('button');
  drillBtn.className = 'secondary-btn';
  drillBtn.textContent = 'Go to Drill Mode';
  drillBtn.addEventListener('click', () => {
    setActiveNav('drill');
    showView('drill');
    renderDrillConfig();
  });

  const progressBtn = document.createElement('button');
  progressBtn.className = 'secondary-btn';
  progressBtn.textContent = 'View Progress';
  progressBtn.addEventListener('click', () => {
    setActiveNav('progress');
    showView('progress');
    renderProgress();
  });

  btnRow.appendChild(retakeBtn);
  btnRow.appendChild(drillBtn);
  btnRow.appendChild(progressBtn);
  container.appendChild(btnRow);
}

// =====================================================================
// E. PERFORMANCE TIPS ENGINE
// =====================================================================

function generateTips(result, answers, context) {
  context = context || {};
  const candidates = [];

  if (context.streak >= 3) {
    candidates.push(`\u{1F525} ${context.streak}-day streak — consistency is your biggest advantage. Keep it going.`);
  }

  if (context.previousPct !== null && context.previousPct !== undefined) {
    const diff = result.pct - context.previousPct;
    if (diff >= 5) {
      candidates.push(`\u{1F4C8} You improved ${diff.toFixed(0)} points since last session — great momentum.`);
    } else if (diff <= -5) {
      candidates.push(`\u{1F4C9} Score dipped ${Math.abs(diff).toFixed(0)} points from last session. Check if you're rushing answers.`);
    }
  }

  if (result.pct >= 79 && result.pct <= 82) {
    const diff = PASS_THRESHOLD - result.pct;
    candidates.push(`You are within ${diff.toFixed(0)}% of passing. One or two more correct answers would have passed this test.`);
  }

  let weakestDomain = null;
  let weakestScore = Infinity;
  Object.entries(result.domainScores).forEach(([d, score]) => {
    if (score !== null && score < weakestScore) {
      weakestScore = score;
      weakestDomain = d;
    }
  });
  if (weakestDomain !== null) {
    candidates.push(`Your weakest domain this session was Domain ${weakestDomain} — ${DOMAIN_NAMES[weakestDomain]}. Focus your next study block there.`);
  }

  const objCounts = {};
  const objTopics = {};
  answers.filter(a => !a.correct).forEach(a => {
    objCounts[a.objective] = (objCounts[a.objective] || 0) + 1;
    objTopics[a.objective] = a.topic;
  });
  Object.entries(objCounts).forEach(([obj, count]) => {
    if (count >= 2) {
      candidates.push(`You missed multiple questions on objective ${obj} (${objTopics[obj]}). Review that sub-topic specifically.`);
    }
  });

  const formatStats = {};
  answers.forEach(a => {
    if (!formatStats[a.format]) formatStats[a.format] = { total: 0, correct: 0 };
    formatStats[a.format].total++;
    if (a.correct) formatStats[a.format].correct++;
  });
  Object.entries(formatStats).forEach(([fmt, stats]) => {
    if (stats.total >= 2 && stats.correct / stats.total < 0.5) {
      candidates.push(`You struggled with ${fmt.replace(/_/g, ' ')} questions. Practice that question style more.`);
    }
  });

  const hardAnswers = answers.filter(a => a.difficulty === 'hard');
  if (hardAnswers.length) {
    const hardCorrect = hardAnswers.filter(a => a.correct).length;
    if (hardCorrect / hardAnswers.length <= 0.5) {
      const domainForDrill = weakestDomain !== null ? weakestDomain : hardAnswers[0].domain;
      candidates.push(`Hard questions are a gap — try the Drill Mode on Domain ${domainForDrill} set to hard only.`);
    }
  }

  // Confidence-based tips
  const guessedRight = answers.filter(a => a.confidence === 'guessed' && a.correct).length;
  const confidentWrong = answers.filter(a => a.confidence === 'confident' && !a.correct).length;
  if (guessedRight >= 1) {
    candidates.push(`You guessed correctly on ${guessedRight} question${guessedRight > 1 ? 's' : ''} — review those topics to make sure the knowledge is solid, not lucky.`);
  }
  if (confidentWrong >= 1) {
    candidates.push(`You were confident but wrong on ${confidentWrong} question${confidentWrong > 1 ? 's' : ''} — these are dangerous blind spots. Review them carefully.`);
  }

  let reinforcement;
  if (result.pct >= PASS_THRESHOLD) {
    reinforcement = 'Great job — you passed! Keep reviewing misses to push toward 90%+.';
  } else if (result.pct >= 70) {
    reinforcement = "You're close to passing. One more focused session should get you there.";
  } else {
    reinforcement = "Don't worry — consistent daily practice builds retention. Review your misses and try again tomorrow.";
  }

  const tips = candidates.slice(0, 4);
  tips.push(reinforcement);
  return tips;
}

// =====================================================================
// F. PROGRESS PERSISTENCE
// =====================================================================

function saveSession(result, answers) {
  const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
  const sessionData = {
    date: result.date,
    score: result.score,
    total: result.total,
    pct: result.pct,
    domain_scores: result.domainScores,
    domain_stats: result.domainStats,
    misses: result.misses,
    mode: result.mode || 'test',
    answers: (answers || []).map(a => ({
      question_id: a.question_id,
      correct: a.correct,
      domain: a.domain,
      objective: a.objective,
      confidence: a.confidence || null
    }))
  };
  if (result.time_taken !== undefined) {
    sessionData.time_taken = result.time_taken;
  }
  sessions.push(sessionData);
  localStorage.setItem('sessions', JSON.stringify(sessions));

  if (!result.mode || result.mode === 'test') {
    updateStreak();
  }
  recordMisses(result.misses);
}

function recordMisses(misses) {
  if (!misses.length) return;
  const missCounts = JSON.parse(localStorage.getItem('objective_miss_counts') || '{}');
  misses.forEach(m => {
    missCounts[m.objective] = (missCounts[m.objective] || 0) + 1;
  });
  localStorage.setItem('objective_miss_counts', JSON.stringify(missCounts));
}

function updateStreak() {
  const lastDateStr = localStorage.getItem('last_session_date');
  let streak = parseInt(localStorage.getItem('streak') || '0', 10);
  const today = new Date();
  const todayStr = today.toDateString();

  if (lastDateStr === todayStr) {
    // Already completed a session today
  } else if (!lastDateStr) {
    streak = 1;
  } else {
    const last = new Date(lastDateStr);
    const diffDays = Math.round((new Date(todayStr) - new Date(last.toDateString())) / (1000 * 60 * 60 * 24));
    streak = diffDays === 1 ? streak + 1 : 1;
  }

  localStorage.setItem('streak', String(streak));
  localStorage.setItem('last_session_date', todayStr);
}

// =====================================================================
// G. HOME VIEW
// =====================================================================

function renderHome() {
  const container = document.getElementById('view-home');
  const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
  const streak = parseInt(localStorage.getItem('streak') || '0', 10);
  const last = sessions.length ? sessions[sessions.length - 1] : null;

  container.innerHTML = `
    <h2>Welcome to your Security+ SY0-701 Study App</h2>
    <p>
      Take a daily practice test of randomized questions weighted by the official
      SY0-701 domain percentages. Every question includes a full explanation, and
      your results come with personalized study tips based on this session's
      performance.
    </p>
    <div class="streak-badge">\u{1F525} ${streak} day streak</div>
    <p class="last-score">
      ${last
        ? `Last score: ${last.pct.toFixed(0)}% — ${last.pct >= PASS_THRESHOLD ? 'PASS' : 'FAIL'}`
        : 'No sessions yet — take your first test to get started!'}
    </p>
    <div class="home-actions">
      <button id="btn-start-test" class="primary-btn">Start Today's Test</button>
      <div class="home-exam-block">
        <button id="btn-start-exam-sim" class="exam-sim-btn">🎯 Exam Simulation</button>
        <div class="exam-sim-subtitle">90 questions · 90 minutes · No feedback until the end</div>
      </div>
      <button id="btn-drill-home" class="secondary-btn">Drill Mode</button>
      <button id="btn-progress-home" class="secondary-btn">View Progress</button>
    </div>
  `;

  document.getElementById('btn-start-test').addEventListener('click', () => startTest());
  document.getElementById('btn-start-exam-sim').addEventListener('click', () => startExamSim());
  document.getElementById('btn-drill-home').addEventListener('click', () => {
    setActiveNav('drill');
    showView('drill');
    renderDrillConfig();
  });
  document.getElementById('btn-progress-home').addEventListener('click', () => {
    setActiveNav('progress');
    showView('progress');
    renderProgress();
  });
}

// =====================================================================
// H. PROGRESS VIEW
// =====================================================================

function renderProgress() {
  const container = document.getElementById('view-progress');
  const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
  const streak = parseInt(localStorage.getItem('streak') || '0', 10);
  const missCounts = JSON.parse(localStorage.getItem('objective_miss_counts') || '{}');

  container.innerHTML = '';

  const heading = document.createElement('h2');
  heading.textContent = 'Progress';
  container.appendChild(heading);

  const avgPct = sessions.length
    ? sessions.reduce((sum, s) => sum + s.pct, 0) / sessions.length
    : 0;

  const statsRow = document.createElement('div');
  statsRow.className = 'stats-row';
  statsRow.innerHTML = `
    <div class="stat-card">
      <div class="stat-value">\u{1F525} ${streak}</div>
      <div class="stat-label">Day Streak</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">\u{1F4DD} ${sessions.length}</div>
      <div class="stat-label">Total Sessions</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">\u{1F4CA} ${avgPct.toFixed(0)}%</div>
      <div class="stat-label">Average Score</div>
    </div>
  `;
  container.appendChild(statsRow);

  // Domain Mastery Badges (above mastery table per spec)
  container.appendChild(buildDomainMasteryBadges(sessions));

  container.appendChild(buildScoreChart(sessions));
  container.appendChild(buildDomainMasteryTable(sessions));
  container.appendChild(buildConfidenceAccuracyTable(sessions));
  container.appendChild(buildFocusAreasTable(missCounts));
  container.appendChild(buildSessionHistoryTable(sessions));
  container.appendChild(buildReportsSection());

  const resetWrap = document.createElement('div');
  resetWrap.className = 'reset-section';
  const resetBtn = document.createElement('button');
  resetBtn.className = 'secondary-btn reset-btn';
  resetBtn.textContent = 'Reset Progress';
  resetBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset all progress? This will permanently delete your session history, streak, and miss counts. This cannot be undone.')) {
      ['sessions', 'streak', 'last_session_date', 'objective_miss_counts', 'seen_question_ids'].forEach(k => localStorage.removeItem(k));
      renderProgress();
    }
  });
  resetWrap.appendChild(resetBtn);
  container.appendChild(resetWrap);

  const backRow = document.createElement('div');
  backRow.className = 'results-actions';
  const homeBtn = document.createElement('button');
  homeBtn.className = 'primary-btn';
  homeBtn.textContent = 'Back to Home';
  homeBtn.addEventListener('click', () => {
    setActiveNav('home');
    showView('home');
    renderHome();
  });
  backRow.appendChild(homeBtn);
  container.appendChild(backRow);
}

function buildScoreChart(sessions) {
  const wrap = document.createElement('div');
  wrap.className = 'chart-section';
  wrap.innerHTML = '<h3>Score History</h3>';

  if (!sessions.length) {
    wrap.appendChild(Object.assign(document.createElement('p'), {
      textContent: 'No sessions yet — complete a test to start building your score history.'
    }));
    return wrap;
  }

  const recent = sessions.slice(-10);
  const chart = document.createElement('div');
  chart.className = 'bar-chart';

  const passLine = document.createElement('div');
  passLine.className = 'pass-line';
  passLine.style.bottom = `${PASS_THRESHOLD}%`;
  passLine.innerHTML = `<span class="pass-line-label">${PASS_THRESHOLD}% Pass</span>`;
  chart.appendChild(passLine);

  recent.forEach(s => {
    const barCol = document.createElement('div');
    barCol.className = 'bar-col';

    const bar = document.createElement('div');
    bar.className = `bar ${s.pct >= PASS_THRESHOLD ? 'bar-pass' : 'bar-fail'}`;
    bar.style.height = '0%';

    const label = document.createElement('div');
    label.className = 'bar-label';
    label.textContent = `${s.pct.toFixed(0)}%`;
    bar.appendChild(label);

    const date = document.createElement('div');
    date.className = 'bar-date';
    const d = new Date(s.date);
    date.textContent = `${d.getMonth() + 1}/${d.getDate()}`;
    bar.appendChild(date);

    barCol.appendChild(bar);
    chart.appendChild(barCol);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        bar.style.height = `${Math.max(s.pct, 2)}%`;
      });
    });
  });

  wrap.appendChild(chart);
  return wrap;
}

function buildDomainMasteryTable(sessions) {
  const wrap = document.createElement('div');
  wrap.className = 'mastery-section';
  wrap.innerHTML = '<h3>Domain Mastery</h3>';

  if (!sessions.length) {
    wrap.appendChild(Object.assign(document.createElement('p'), {
      textContent: 'Complete a test to see your domain mastery breakdown.'
    }));
    return wrap;
  }

  const totals = {};
  [1, 2, 3, 4, 5].forEach(d => (totals[d] = { total: 0, correct: 0 }));
  sessions.forEach(s => {
    if (!s.domain_stats) return;
    [1, 2, 3, 4, 5].forEach(d => {
      const ds = s.domain_stats[d];
      if (ds) {
        totals[d].total += ds.total;
        totals[d].correct += ds.correct;
      }
    });
  });

  const last = sessions[sessions.length - 1];
  const prev = sessions.length >= 2 ? sessions[sessions.length - 2] : null;

  const tableWrap = document.createElement('div');
  tableWrap.className = 'table-scroll';
  const table = document.createElement('table');
  table.className = 'domain-table';
  table.innerHTML = '<thead><tr><th>Domain</th><th>Total Attempted</th><th>Total Correct</th><th>Mastery %</th><th>Trend</th></tr></thead>';
  const tbody = document.createElement('tbody');

  let anyRows = false;
  [1, 2, 3, 4, 5].forEach(d => {
    const t = totals[d];
    if (t.total === 0) return;
    anyRows = true;

    const mastery = (t.correct / t.total) * 100;
    let masteryClass = 'mastery-low';
    if (mastery >= PASS_THRESHOLD) masteryClass = 'mastery-high';
    else if (mastery >= 70) masteryClass = 'mastery-mid';

    let trendSymbol = '→';
    let trendClass = 'trend-flat';
    const lastScore = last.domain_scores ? last.domain_scores[d] : null;
    const prevScore = prev && prev.domain_scores ? prev.domain_scores[d] : null;
    if (lastScore !== null && lastScore !== undefined && prevScore !== null && prevScore !== undefined) {
      if (lastScore > prevScore) { trendSymbol = '↑'; trendClass = 'trend-up'; }
      else if (lastScore < prevScore) { trendSymbol = '↓'; trendClass = 'trend-down'; }
    }

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>D${d} — ${escapeHtml(DOMAIN_NAMES[d])}</td>
      <td>${t.total}</td>
      <td>${t.correct}</td>
      <td class="${masteryClass}">${mastery.toFixed(0)}%</td>
      <td class="${trendClass}">${trendSymbol}</td>
    `;
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  tableWrap.appendChild(table);
  wrap.appendChild(tableWrap);

  if (!anyRows) {
    wrap.appendChild(Object.assign(document.createElement('p'), {
      textContent: 'Complete a test to see your domain mastery breakdown.'
    }));
  }

  return wrap;
}

function buildFocusAreasTable(missCounts) {
  const wrap = document.createElement('div');
  wrap.className = 'focus-section';
  wrap.innerHTML = '<h3>Focus Areas — Most-Missed Objectives</h3>';

  const entries = Object.entries(missCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  if (!entries.length) {
    wrap.appendChild(Object.assign(document.createElement('p'), {
      textContent: 'No missed questions yet. Keep up the great work!'
    }));
    return wrap;
  }

  const tableWrap = document.createElement('div');
  tableWrap.className = 'table-scroll';
  const table = document.createElement('table');
  table.className = 'domain-table';
  table.innerHTML = '<thead><tr><th>Objective</th><th>Topic</th><th>Domain</th><th>Times Missed</th><th></th></tr></thead>';
  const tbody = document.createElement('tbody');

  entries.forEach(([obj, count]) => {
    const info = OBJECTIVES[obj];
    const domain = info ? info.domain : '?';
    const topic = info ? info.title : '—';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(obj)}</td>
      <td>${escapeHtml(topic)}</td>
      <td>D${escapeHtml(String(domain))}</td>
      <td>${count}</td>
      <td><button class="drill-this-btn" data-objective="${escapeHtml(obj)}">Drill This</button></td>
    `;
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  tableWrap.appendChild(table);
  wrap.appendChild(tableWrap);

  tableWrap.querySelectorAll('.drill-this-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const objective = btn.dataset.objective;
      setActiveNav('drill');
      showView('drill');
      startDrill({
        scope: 'objective',
        domain: null,
        objective: objective,
        difficulties: ['easy', 'medium', 'hard'],
        formats: Object.keys(FORMAT_LABELS),
        count: 10
      });
    });
  });

  return wrap;
}

function buildSessionHistoryTable(sessions) {
  const wrap = document.createElement('div');
  wrap.className = 'session-history-section';
  wrap.innerHTML = '<h3>Session History</h3>';

  if (!sessions.length) {
    wrap.appendChild(Object.assign(document.createElement('p'), { textContent: 'No sessions yet.' }));
    return wrap;
  }

  const tableWrap = document.createElement('div');
  tableWrap.className = 'table-scroll';
  const table = document.createElement('table');
  table.className = 'domain-table';
  table.innerHTML = '<thead><tr><th>Date</th><th>Mode</th><th>Score</th><th>Total</th><th>%</th><th>Pass/Fail</th></tr></thead>';
  const tbody = document.createElement('tbody');

  sessions.slice(-10).reverse().forEach(s => {
    const pass = s.pct >= PASS_THRESHOLD;
    const modeLabel = s.mode === 'exam_sim' ? '🎯 Exam Sim' : '📝 Daily Test';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(new Date(s.date).toLocaleString())}</td>
      <td>${modeLabel}</td>
      <td>${s.score}</td>
      <td>${s.total}</td>
      <td>${s.pct.toFixed(0)}%</td>
      <td class="${pass ? 'pass-text' : 'fail-text'}">${pass ? 'Pass' : 'Fail'}</td>
    `;
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  tableWrap.appendChild(table);
  wrap.appendChild(tableWrap);
  return wrap;
}

// =====================================================================
// I. DRILL MODE
// =====================================================================

function filterQuestionsByConfig(config) {
  let pool = window.ALL_QUESTIONS.slice();

  if (config.scope === 'domain' && config.domain) {
    pool = pool.filter(q => q.domain === config.domain);
  } else if (config.scope === 'objective' && config.objective) {
    pool = pool.filter(q => q.objective === config.objective);
  } else if (config.scope === 'weakest') {
    const missCounts = JSON.parse(localStorage.getItem('objective_miss_counts') || '{}');
    const top20 = Object.entries(missCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([obj]) => obj);
    if (top20.length) pool = pool.filter(q => top20.includes(q.objective));
  } else if (config.scope === 'bookmarks') {
    const bm = getBookmarks();
    pool = pool.filter(q => bm.has(q.id));
  }

  if (config.difficulties && config.difficulties.length) {
    pool = pool.filter(q => config.difficulties.includes(q.difficulty));
  }
  if (config.formats && config.formats.length) {
    pool = pool.filter(q => config.formats.includes(q.format));
  }

  return pool;
}

function startDrill(config) {
  const pool = filterQuestionsByConfig(config);
  const requested = config.count || 10;
  const count = Math.min(requested, pool.length);
  const questions = fisherYatesShuffle(pool).slice(0, count);

  window.APP.mode = 'drill';
  window.APP.currentTest = questions;
  window.APP.currentAnswers = [];
  window.APP.currentIndex = 0;
  window.APP.keyboardSelected = null;
  window.APP.drillNotice = (pool.length > 0 && pool.length < requested)
    ? `Only ${pool.length} question(s) matched your filters — showing all of them.`
    : null;

  setActiveNav('drill');
  showView('drill');

  if (questions.length === 0) {
    renderDrillEmpty();
    return;
  }

  renderQuestion();
}

function renderDrillEmpty() {
  const container = document.getElementById('view-drill');
  container.innerHTML = `
    <h2>Drill Mode</h2>
    <p>No questions match your selected filters. Try widening your criteria (difficulty, format, or scope).</p>
    <div class="results-actions">
      <button id="btn-back-to-drill-config" class="primary-btn">Back to Drill Config</button>
    </div>
  `;
  document.getElementById('btn-back-to-drill-config').addEventListener('click', () => renderDrillConfig());
}

function renderDrillResults(result, answers) {
  const container = document.getElementById('view-drill');
  container.innerHTML = '';

  const summary = document.createElement('div');
  summary.className = `score-summary ${result.pass ? 'pass' : 'fail'}`;
  summary.innerHTML = `
    <h2>Drill Complete</h2>
    <p class="score-line">${result.score} / ${result.total} correct (${result.pct.toFixed(0)}%)</p>
  `;
  container.appendChild(summary);

  const missedSection = buildMissedSection(answers);
  if (missedSection) container.appendChild(missedSection);

  const btnRow = document.createElement('div');
  btnRow.className = 'results-actions';

  const againBtn = document.createElement('button');
  againBtn.className = 'primary-btn';
  againBtn.textContent = 'Configure Another Drill';
  againBtn.addEventListener('click', () => renderDrillConfig());

  const homeBtn = document.createElement('button');
  homeBtn.className = 'secondary-btn';
  homeBtn.textContent = 'Go Home';
  homeBtn.addEventListener('click', () => {
    setActiveNav('home');
    showView('home');
    renderHome();
  });

  btnRow.appendChild(againBtn);
  btnRow.appendChild(homeBtn);
  container.appendChild(btnRow);
}

function renderDrillConfig() {
  const container = document.getElementById('view-drill');
  container.innerHTML = '';

  const heading = document.createElement('h2');
  heading.textContent = 'Drill Mode';
  container.appendChild(heading);

  const intro = document.createElement('p');
  intro.textContent = 'Build a custom practice set by domain, objective, or your weakest areas.';
  container.appendChild(intro);

  const panel = document.createElement('div');
  panel.className = 'drill-config';

  const objectiveOptgroups = [1, 2, 3, 4, 5].map(d => {
    const opts = Object.entries(OBJECTIVES)
      .filter(([, info]) => info.domain === d)
      .map(([id, info]) => `<option value="${escapeHtml(id)}">${escapeHtml(id)} — ${escapeHtml(info.title)}</option>`)
      .join('');
    return `<optgroup label="Domain ${d} — ${escapeHtml(DOMAIN_NAMES[d])}">${opts}</optgroup>`;
  }).join('');

  const domainOptions = [1, 2, 3, 4, 5]
    .map(d => `<option value="${d}">Domain ${d} — ${escapeHtml(DOMAIN_NAMES[d])}</option>`)
    .join('');

  const formatCheckboxes = Object.entries(FORMAT_LABELS)
    .map(([fmt, label]) => `<label><input type="checkbox" class="drill-format" value="${fmt}" checked> ${escapeHtml(label)}</label>`)
    .join('');

  panel.innerHTML = `
    <div class="config-group">
      <div class="config-label">Scope</div>
      <div class="radio-row">
        <label><input type="radio" name="drill-scope" value="domain" checked> By Domain</label>
        <label><input type="radio" name="drill-scope" value="objective"> By Objective</label>
        <label><input type="radio" name="drill-scope" value="weakest"> Weakest 20</label>
      </div>
    </div>
    <div class="config-group" id="drill-domain-group">
      <label class="config-label" for="drill-domain-select">Domain</label>
      <select id="drill-domain-select">
        <option value="">All Domains</option>
        ${domainOptions}
      </select>
    </div>
    <div class="config-group" id="drill-objective-group" style="display:none">
      <label class="config-label" for="drill-objective-select">Objective</label>
      <select id="drill-objective-select">
        ${objectiveOptgroups}
      </select>
    </div>
    <div class="config-group">
      <div class="config-label">Difficulty</div>
      <div class="checkbox-row">
        <label><input type="checkbox" class="drill-difficulty" value="easy" checked> Easy</label>
        <label><input type="checkbox" class="drill-difficulty" value="medium" checked> Medium</label>
        <label><input type="checkbox" class="drill-difficulty" value="hard" checked> Hard</label>
      </div>
    </div>
    <div class="config-group">
      <div class="config-label">Format</div>
      <div class="checkbox-row">
        ${formatCheckboxes}
      </div>
    </div>
    <div class="config-group">
      <label class="config-label" for="drill-count">Number of Questions: <span id="drill-count-label">10</span></label>
      <input type="range" id="drill-count" min="5" max="20" step="5" value="10">
    </div>
    <button id="btn-start-drill" class="primary-btn">Start Drill</button>
  `;

  container.appendChild(panel);

  const domainGroup = panel.querySelector('#drill-domain-group');
  const objectiveGroup = panel.querySelector('#drill-objective-group');
  panel.querySelectorAll('input[name="drill-scope"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const val = panel.querySelector('input[name="drill-scope"]:checked').value;
      domainGroup.style.display = val === 'domain' ? '' : 'none';
      objectiveGroup.style.display = val === 'objective' ? '' : 'none';
    });
  });

  const countSlider = panel.querySelector('#drill-count');
  const countLabel = panel.querySelector('#drill-count-label');
  countSlider.addEventListener('input', () => { countLabel.textContent = countSlider.value; });

  panel.querySelector('#btn-start-drill').addEventListener('click', () => {
    const scope = panel.querySelector('input[name="drill-scope"]:checked').value;
    const domainVal = panel.querySelector('#drill-domain-select').value;
    const objectiveVal = panel.querySelector('#drill-objective-select').value;
    const difficulties = [...panel.querySelectorAll('.drill-difficulty:checked')].map(c => c.value);
    const formats = [...panel.querySelectorAll('.drill-format:checked')].map(c => c.value);
    const count = parseInt(countSlider.value, 10);

    startDrill({
      scope,
      domain: domainVal ? parseInt(domainVal, 10) : null,
      objective: objectiveVal || null,
      difficulties,
      formats,
      count
    });
  });
}

// =====================================================================
// J. COLOR MODE
// =====================================================================

function applyColorMode(mode) {
  if (mode === 'light') {
    document.body.classList.add('light-mode');
    const btn = document.getElementById('btn-color-mode');
    if (btn) btn.textContent = '☀️';
  } else {
    document.body.classList.remove('light-mode');
    const btn = document.getElementById('btn-color-mode');
    if (btn) btn.textContent = '🌙';
  }
}

function toggleColorMode() {
  const current = localStorage.getItem('color_mode') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  localStorage.setItem('color_mode', next);
  applyColorMode(next);
}

// =====================================================================
// K. TOAST SYSTEM
// =====================================================================

function showToast(message, duration) {
  duration = duration === undefined ? 5000 : duration;
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span>${escapeHtml(message)}</span>`;

  const closeBtn = document.createElement('button');
  closeBtn.className = 'toast-close';
  closeBtn.textContent = '✕';
  closeBtn.addEventListener('click', () => dismissToast(toast));
  toast.appendChild(closeBtn);

  container.appendChild(toast);

  if (duration > 0) {
    setTimeout(() => dismissToast(toast), duration);
  }
}

function dismissToast(toast) {
  if (!toast.parentNode) return;
  toast.classList.add('toast-out');
  setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 280);
}

// =====================================================================
// L. KEYBOARD NAVIGATION
// =====================================================================

function initKeyboardNav() {
  document.addEventListener('keydown', handleKeydown);
}

function handleKeydown(e) {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

  const mode = window.APP.mode;

  if (mode === 'test' || mode === 'drill') {
    handleTestKeydown(e, mode);
  } else if (mode === 'exam-sim') {
    handleExamSimKeydown(e);
  }
}

function handleTestKeydown(e, mode) {
  const key = e.key.toUpperCase();
  const viewId = mode === 'drill' ? 'view-drill' : 'view-test';
  const container = document.getElementById(viewId);
  if (!container) return;

  if (['A', 'B', 'C', 'D'].includes(key)) {
    e.preventDefault();
    const allBtns = container.querySelectorAll('.option-btn:not(:disabled)');
    if (!allBtns.length) return;

    allBtns.forEach(b => b.classList.remove('keyboard-focus'));
    const target = container.querySelector(`.option-btn[data-key="${key}"]:not(:disabled)`);
    if (target) {
      target.classList.add('keyboard-focus');
      window.APP.keyboardSelected = key;
    }
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (window.APP.keyboardSelected) {
      const target = container.querySelector(`.option-btn[data-key="${window.APP.keyboardSelected}"]:not(:disabled)`);
      if (target) {
        target.click();
        window.APP.keyboardSelected = null;
        return;
      }
    }
    // If no option selected, try clicking next button
    const nextBtn = container.querySelector('.next-btn:not(:disabled)');
    if (nextBtn) nextBtn.click();
  } else if (e.key === 'Escape') {
    e.preventDefault();
    const backLink = container.querySelector('.back-link');
    if (backLink) backLink.click();
  }
}

function handleExamSimKeydown(e) {
  const key = e.key.toUpperCase();

  if (['A', 'B', 'C', 'D'].includes(key)) {
    e.preventDefault();
    selectExamSimOption(key);
  } else if (e.key === 'ArrowRight') {
    e.preventDefault();
    navigateExamSim(1);
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault();
    navigateExamSim(-1);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    navigateExamSim(1);
  } else if (e.key === 'b' || e.key === 'B') {
    e.preventDefault();
    if (window.APP.examSim) {
      const q = window.APP.examSim.questions[window.APP.examSim.currentIndex];
      if (q) {
        toggleBookmark(q.id);
        const nowBm = isBookmarked(q.id);
        updateExamGrid();
        updateExamBookmarkBtn(q.id);
        saveExamSimProgress();
        showToast(nowBm ? '🔖 Bookmarked' : '🔖 Bookmark removed', 2000);
      }
    }
  } else if (e.key === 'Escape') {
    e.preventDefault();
    if (confirm('Quit exam? Your progress is saved and you can resume later.')) {
      stopExamTimer();
      setActiveNav('home');
      showView('home');
      renderHome();
    }
  }
}

// =====================================================================
// M. CONFIDENCE RATING (helpers already in finishAnswer above)
// =====================================================================

// =====================================================================
// N. BOOKMARKING
// =====================================================================

function getBookmarks() {
  const raw = localStorage.getItem('bookmarked_questions');
  return new Set(raw ? JSON.parse(raw) : []);
}

function saveBookmarks(set) {
  localStorage.setItem('bookmarked_questions', JSON.stringify([...set]));
}

function isBookmarked(qId) {
  return getBookmarks().has(qId);
}

function toggleBookmark(qId) {
  const bm = getBookmarks();
  if (bm.has(qId)) {
    bm.delete(qId);
  } else {
    bm.add(qId);
  }
  saveBookmarks(bm);
}

function renderBookmarks() {
  const container = document.getElementById('view-bookmarks');
  container.innerHTML = '';

  const heading = document.createElement('h2');
  heading.textContent = '📚 Bookmarked Questions';
  container.appendChild(heading);

  const bm = getBookmarks();
  const bookmarkedQs = window.ALL_QUESTIONS
    ? window.ALL_QUESTIONS.filter(q => bm.has(q.id))
    : [];

  const actionsRow = document.createElement('div');
  actionsRow.className = 'bookmarks-actions';

  if (bookmarkedQs.length) {
    const drillBtn = document.createElement('button');
    drillBtn.className = 'primary-btn';
    drillBtn.textContent = '📚 Drill Bookmarks';
    drillBtn.addEventListener('click', () => {
      setActiveNav('drill');
      showView('drill');
      startDrill({
        scope: 'bookmarks',
        difficulties: ['easy', 'medium', 'hard'],
        formats: Object.keys(FORMAT_LABELS),
        count: bookmarkedQs.length
      });
    });
    actionsRow.appendChild(drillBtn);

    const clearBtn = document.createElement('button');
    clearBtn.className = 'secondary-btn reset-btn';
    clearBtn.textContent = 'Clear All Bookmarks';
    clearBtn.addEventListener('click', () => {
      if (confirm('Remove all bookmarks?')) {
        saveBookmarks(new Set());
        renderBookmarks();
      }
    });
    actionsRow.appendChild(clearBtn);
  }

  container.appendChild(actionsRow);

  if (!bookmarkedQs.length) {
    const p = document.createElement('p');
    p.textContent = 'No bookmarks yet. Bookmark questions during tests by clicking 🔖 Bookmark on any question card.';
    container.appendChild(p);
    return;
  }

  bookmarkedQs.forEach(q => {
    const card = document.createElement('div');
    card.className = 'bookmark-card';

    const header = document.createElement('div');
    header.className = 'bookmark-card-header';

    const stem = document.createElement('div');
    stem.className = 'bookmark-card-stem';
    stem.title = q.stem;
    stem.textContent = q.stem;

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'secondary-btn';
    toggleBtn.style.fontSize = '0.8rem';
    toggleBtn.style.padding = '0.3rem 0.7rem';
    toggleBtn.style.flexShrink = '0';
    toggleBtn.textContent = '▼ Expand';

    const body = document.createElement('div');
    body.className = 'bookmark-card-body';
    body.style.display = 'none';

    // Fill body with question details
    let html = '';
    if (q.scenario) {
      html += `<div class="scenario-box">${escapeHtml(q.scenario)}</div>`;
    }
    html += `<p class="question-stem">${escapeHtml(q.stem)}</p>`;
    if (q.options) {
      html += `<div class="options-list">`;
      Object.entries(q.options).forEach(([k, v]) => {
        const isCorrect = Array.isArray(q.answer)
          ? q.answer.includes(k)
          : q.answer === k;
        html += `<div class="option-btn${isCorrect ? ' correct' : ''}" style="pointer-events:none">${escapeHtml(k)}. ${escapeHtml(v)}</div>`;
      });
      html += `</div>`;
    }
    html += `<div class="explanation">${escapeHtml(q.explanation)}</div>`;

    body.innerHTML = html;

    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-bookmark-btn';
    removeBtn.textContent = '🗑 Remove';
    removeBtn.addEventListener('click', e => {
      e.stopPropagation();
      toggleBookmark(q.id);
      renderBookmarks();
    });
    body.appendChild(removeBtn);

    toggleBtn.addEventListener('click', () => {
      const expanded = body.style.display !== 'none';
      body.style.display = expanded ? 'none' : 'block';
      toggleBtn.textContent = expanded ? '▼ Expand' : '▲ Collapse';
    });

    header.addEventListener('click', () => toggleBtn.click());

    header.appendChild(stem);
    header.appendChild(toggleBtn);
    card.appendChild(header);
    card.appendChild(body);
    container.appendChild(card);
  });
}

// =====================================================================
// O. EXAM SIMULATION
// =====================================================================

const EXAM_SIM_TOTAL = 90;
const EXAM_SIM_DURATION = 5400; // 90 minutes in seconds
const EXAM_SIM_SESSION_KEY = 'exam_sim_state';

function generateExamSimTest() {
  const all = window.ALL_QUESTIONS;
  const eligible = all.filter(q =>
    ['multiple_choice', 'multi_select', 'pbq_scenario'].includes(q.format)
  );

  const total = Math.min(EXAM_SIM_TOTAL, eligible.length);
  const domainIds = [1, 2, 3, 4, 5];
  const quotas = {};
  let runningSum = 0;
  domainIds.forEach((d, i) => {
    if (i < domainIds.length - 1) {
      quotas[d] = Math.round(DOMAIN_WEIGHTS[d] * total);
      runningSum += quotas[d];
    }
  });
  quotas[domainIds[domainIds.length - 1]] = total - runningSum;

  const pbqs = [];
  const nonPbqs = [];
  const usedIds = new Set();

  domainIds.forEach(d => {
    const domainQ = eligible.filter(q => q.domain === d);
    const picks = fisherYatesShuffle(domainQ).slice(0, quotas[d]);
    picks.forEach(q => {
      usedIds.add(q.id);
      if (q.format === 'pbq_scenario') pbqs.push(q);
      else nonPbqs.push(q);
    });
  });

  // Fill shortages
  if (pbqs.length + nonPbqs.length < total) {
    const leftover = fisherYatesShuffle(eligible.filter(q => !usedIds.has(q.id)));
    for (const q of leftover) {
      if (pbqs.length + nonPbqs.length >= total) break;
      if (q.format === 'pbq_scenario') pbqs.push(q);
      else nonPbqs.push(q);
    }
  }

  return [...pbqs, ...fisherYatesShuffle(nonPbqs)].slice(0, total);
}

function saveExamSimProgress() {
  if (!window.APP.examSim) return;
  const state = {
    questionIds: window.APP.examSim.questions.map(q => q.id),
    answers: window.APP.examSim.answers,
    currentIndex: window.APP.examSim.currentIndex,
    timerRemaining: window.APP.examSim.timerRemaining,
    warningShown30: window.APP.examSim.warningShown30,
    warningShown10: window.APP.examSim.warningShown10,
    startTime: window.APP.examSim.startTime
  };
  sessionStorage.setItem(EXAM_SIM_SESSION_KEY, JSON.stringify(state));
}

function loadExamSimProgress() {
  const raw = sessionStorage.getItem(EXAM_SIM_SESSION_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function clearExamSimProgress() {
  sessionStorage.removeItem(EXAM_SIM_SESSION_KEY);
}

function startExamSim(forceNew) {
  const saved = forceNew ? null : loadExamSimProgress();

  if (saved && !forceNew) {
    const resume = confirm(
      `You have an exam in progress (${Object.keys(saved.answers).length}/${saved.questionIds.length} answered, ` +
      `${Math.floor(saved.timerRemaining / 60)}:${String(saved.timerRemaining % 60).padStart(2, '0')} remaining).\n\n` +
      `Click OK to resume, or Cancel to start a fresh exam.`
    );
    if (resume) {
      const questions = saved.questionIds.map(id =>
        window.ALL_QUESTIONS.find(q => q.id === id)
      ).filter(Boolean);

      window.APP.examSim = {
        questions,
        answers: saved.answers,
        currentIndex: saved.currentIndex || 0,
        timerRemaining: saved.timerRemaining,
        timerInterval: null,
        warningShown30: saved.warningShown30 || false,
        warningShown10: saved.warningShown10 || false,
        startTime: saved.startTime || Date.now(),
        submitted: false
      };
      window.APP.mode = 'exam-sim';
      setActiveNav('exam-sim');
      showView('exam-sim');
      renderExamSimQuestion(window.APP.examSim.currentIndex);
      startExamTimer();
      return;
    }
  }

  // Start fresh
  const questions = generateExamSimTest();
  window.APP.examSim = {
    questions,
    answers: {},
    currentIndex: 0,
    timerRemaining: EXAM_SIM_DURATION,
    timerInterval: null,
    warningShown30: false,
    warningShown10: false,
    startTime: Date.now(),
    submitted: false
  };
  window.APP.mode = 'exam-sim';
  clearExamSimProgress();
  setActiveNav('exam-sim');
  showView('exam-sim');
  renderExamSimQuestion(0);
  startExamTimer();
}

function startExamTimer() {
  if (window.APP.examSim.timerInterval) clearInterval(window.APP.examSim.timerInterval);
  window.APP.examSim.timerInterval = setInterval(tickExamTimer, 1000);
}

function stopExamTimer() {
  if (window.APP.examSim && window.APP.examSim.timerInterval) {
    clearInterval(window.APP.examSim.timerInterval);
    window.APP.examSim.timerInterval = null;
  }
}

function tickExamTimer() {
  if (!window.APP.examSim || window.APP.examSim.submitted) return;

  window.APP.examSim.timerRemaining = Math.max(0, window.APP.examSim.timerRemaining - 1);
  saveExamSimProgress();

  const remaining = window.APP.examSim.timerRemaining;
  updateExamTimerDisplay(remaining);

  if (remaining <= 0) {
    stopExamTimer();
    showToast("⏰ Time's up! Your exam has been auto-submitted.");
    executeExamSubmit();
    return;
  }

  if (remaining <= 600 && !window.APP.examSim.warningShown10) {
    window.APP.examSim.warningShown10 = true;
    showToast('🚨 10 minutes remaining — consider submitting soon');
  } else if (remaining <= 1800 && !window.APP.examSim.warningShown30) {
    window.APP.examSim.warningShown30 = true;
    showToast('⚠️ 30 minutes remaining');
  }
}

function updateExamTimerDisplay(remaining) {
  const el = document.getElementById('exam-timer');
  if (!el) return;

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  el.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  el.className = 'exam-timer';
  if (remaining <= 600) {
    el.classList.add('timer-danger');
  } else if (remaining <= 1800) {
    el.classList.add('timer-warning');
  }
}

// Pause timer when tab is hidden
document.addEventListener('visibilitychange', () => {
  if (!window.APP.examSim || window.APP.examSim.submitted) return;

  if (document.hidden) {
    stopExamTimer();
    saveExamSimProgress();
  } else {
    if (window.APP.examSim.timerRemaining > 0) {
      startExamTimer();
    }
  }
});

function renderExamSimQuestion(idx) {
  const sim = window.APP.examSim;
  if (!sim) return;

  sim.currentIndex = idx;
  const q = sim.questions[idx];
  const container = document.getElementById('view-exam-sim');
  container.innerHTML = '';

  // Exam header
  const header = document.createElement('div');
  header.className = 'exam-header';

  const progressLabel = document.createElement('div');
  progressLabel.className = 'exam-progress-label';
  progressLabel.textContent = `Question ${idx + 1} of ${sim.questions.length}`;

  const bookmarkBtn = document.createElement('button');
  bookmarkBtn.id = 'exam-bookmark-btn';
  bookmarkBtn.className = `bookmark-btn${isBookmarked(q.id) ? ' bookmarked' : ''}`;
  bookmarkBtn.textContent = isBookmarked(q.id) ? '🔖 Bookmarked' : '🔖 Bookmark';
  bookmarkBtn.addEventListener('click', () => {
    toggleBookmark(q.id);
    updateExamBookmarkBtn(q.id);
    updateExamGrid();
    saveExamSimProgress();
  });

  const timerEl = document.createElement('div');
  timerEl.id = 'exam-timer';
  timerEl.className = 'exam-timer';
  const rem = sim.timerRemaining;
  timerEl.textContent = `${String(Math.floor(rem / 60)).padStart(2, '0')}:${String(rem % 60).padStart(2, '0')}`;
  if (rem <= 600) timerEl.classList.add('timer-danger');
  else if (rem <= 1800) timerEl.classList.add('timer-warning');

  header.appendChild(progressLabel);
  header.appendChild(bookmarkBtn);
  header.appendChild(timerEl);
  container.appendChild(header);

  // Question grid (collapsible)
  const gridPanel = document.createElement('details');
  gridPanel.className = 'exam-grid-panel';
  const gridSummary = document.createElement('summary');
  const answeredCount = Object.keys(sim.answers).length;
  gridSummary.textContent = `Question Navigator (${answeredCount}/${sim.questions.length} answered) — Click to expand`;
  gridPanel.appendChild(gridSummary);

  const grid = document.createElement('div');
  grid.className = 'exam-grid';
  sim.questions.forEach((gq, gIdx) => {
    const btn = document.createElement('button');
    btn.className = 'grid-btn';
    btn.textContent = String(gIdx + 1);
    btn.dataset.gridIdx = gIdx;

    if (isBookmarked(gq.id)) {
      btn.classList.add('grid-bookmarked');
    } else if (sim.answers[gIdx] !== undefined) {
      btn.classList.add('grid-answered');
    }
    if (gIdx === idx) btn.classList.add('grid-current');

    btn.addEventListener('click', () => {
      saveExamSimProgress();
      renderExamSimQuestion(gIdx);
    });
    grid.appendChild(btn);
  });
  gridPanel.appendChild(grid);
  container.appendChild(gridPanel);

  // Question card
  const card = document.createElement('div');
  card.className = 'question-card';

  const diffBadge = document.createElement('span');
  diffBadge.className = `badge badge-${q.difficulty}`;
  diffBadge.textContent = q.difficulty;
  card.appendChild(diffBadge);

  if (q.format === 'pbq_scenario') {
    const pbqBadge = document.createElement('span');
    pbqBadge.className = 'badge badge-pbq';
    pbqBadge.textContent = 'Performance-Based Question';
    card.appendChild(pbqBadge);

    if (q.scenario) {
      const scenarioBox = document.createElement('div');
      scenarioBox.className = 'scenario-box';
      const scenarioLabel = document.createElement('div');
      scenarioLabel.className = 'scenario-label';
      scenarioLabel.textContent = '📋 SCENARIO';
      scenarioBox.appendChild(scenarioLabel);
      const scenarioText = document.createElement('p');
      scenarioText.className = 'scenario-text';
      scenarioText.textContent = q.scenario;
      scenarioBox.appendChild(scenarioText);
      card.appendChild(scenarioBox);
    }
  }

  const stem = document.createElement('p');
  stem.className = 'question-stem';
  stem.textContent = q.stem;
  card.appendChild(stem);

  // Answer area
  const answerArea = document.createElement('div');
  answerArea.className = 'answer-area';

  const savedAnswer = sim.answers[idx];
  const isMulti = Array.isArray(q.answer) || q.format === 'multi_select';

  if (isMulti) {
    renderExamSimMultiSelect(q, answerArea, idx, savedAnswer);
  } else {
    renderExamSimMultipleChoice(q, answerArea, idx, savedAnswer);
  }

  card.appendChild(answerArea);
  container.appendChild(card);

  // Keyboard hint (exam sim)
  if (!localStorage.getItem('keyboard_hint_dismissed')) {
    const hint = document.createElement('div');
    hint.className = 'keyboard-hint';
    hint.innerHTML = `<span>⌨️ Tip: A–D to select, ←→ to navigate, B to bookmark, Esc to quit</span>`;
    const db = document.createElement('button');
    db.className = 'dismiss-hint';
    db.textContent = 'Dismiss';
    db.addEventListener('click', () => {
      localStorage.setItem('keyboard_hint_dismissed', '1');
      hint.remove();
    });
    hint.appendChild(db);
    container.appendChild(hint);
  }

  // Navigation footer
  const navRow = document.createElement('div');
  navRow.className = 'exam-nav-row';

  const prevBtn = document.createElement('button');
  prevBtn.className = 'exam-prev-btn secondary-btn';
  prevBtn.textContent = '← Previous';
  prevBtn.disabled = idx === 0;
  prevBtn.addEventListener('click', () => navigateExamSim(-1));

  const nextBtn = document.createElement('button');
  nextBtn.className = 'exam-next-btn secondary-btn';
  nextBtn.textContent = 'Next →';
  nextBtn.disabled = idx === sim.questions.length - 1;
  nextBtn.addEventListener('click', () => navigateExamSim(1));

  const submitExamBtn = document.createElement('button');
  submitExamBtn.className = 'exam-submit-btn';
  submitExamBtn.textContent = 'Submit Exam';
  submitExamBtn.addEventListener('click', () => confirmSubmitExam());

  navRow.appendChild(prevBtn);
  navRow.appendChild(nextBtn);
  navRow.appendChild(submitExamBtn);
  container.appendChild(navRow);
}

function renderExamSimMultipleChoice(q, container, idx, savedAnswer) {
  const sim = window.APP.examSim;
  const list = document.createElement('div');
  list.className = 'options-list';

  Object.entries(q.options).forEach(([key, text]) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.dataset.key = key;
    btn.textContent = `${key}. ${text}`;

    if (savedAnswer === key) btn.classList.add('selected');

    btn.addEventListener('click', () => {
      list.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected', 'keyboard-focus'));
      btn.classList.add('selected');
      sim.answers[idx] = key;
      saveExamSimProgress();
      updateExamGrid();
    });
    list.appendChild(btn);
  });

  container.appendChild(list);
}

function renderExamSimMultiSelect(q, container, idx, savedAnswer) {
  const sim = window.APP.examSim;
  const savedArr = Array.isArray(savedAnswer) ? savedAnswer : [];

  const instruction = document.createElement('p');
  instruction.className = 'instruction';
  const correctAnswers = Array.isArray(q.answer) ? q.answer : [q.answer];
  instruction.textContent = `Select ${correctAnswers.length === 2 ? 'TWO' : correctAnswers.length} option(s) that apply.`;
  container.appendChild(instruction);

  const list = document.createElement('div');
  list.className = 'options-list';

  const checkboxes = {};
  Object.entries(q.options).forEach(([key, text]) => {
    const label = document.createElement('label');
    label.className = `checkbox-option${savedArr.includes(key) ? ' selected' : ''}`;

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.value = key;
    cb.checked = savedArr.includes(key);
    checkboxes[key] = cb;

    cb.addEventListener('change', () => {
      label.classList.toggle('selected', cb.checked);
      const selected = Object.entries(checkboxes)
        .filter(([, c]) => c.checked)
        .map(([k]) => k);
      sim.answers[idx] = selected;
      saveExamSimProgress();
      updateExamGrid();
    });

    label.appendChild(cb);
    label.appendChild(document.createTextNode(` ${key}. ${text}`));
    list.appendChild(label);
  });

  container.appendChild(list);
}

function selectExamSimOption(key) {
  const sim = window.APP.examSim;
  if (!sim) return;

  const idx = sim.currentIndex;
  const q = sim.questions[idx];
  if (!q) return;

  const container = document.getElementById('view-exam-sim');
  const btn = container.querySelector(`.option-btn[data-key="${key}"]`);
  if (btn) {
    btn.click();
    return;
  }

  // Multi-select: toggle the checkbox for that key
  const cb = container.querySelector(`input[value="${key}"]`);
  if (cb) {
    cb.click();
  }
}

function navigateExamSim(direction) {
  const sim = window.APP.examSim;
  if (!sim) return;

  const newIdx = sim.currentIndex + direction;
  if (newIdx < 0 || newIdx >= sim.questions.length) return;

  saveExamSimProgress();
  renderExamSimQuestion(newIdx);
}

function updateExamGrid() {
  const sim = window.APP.examSim;
  if (!sim) return;

  const grid = document.querySelector('.exam-grid');
  if (!grid) return;

  const btns = grid.querySelectorAll('.grid-btn');
  btns.forEach((btn, gIdx) => {
    btn.className = 'grid-btn';
    const gq = sim.questions[gIdx];
    if (gq && isBookmarked(gq.id)) {
      btn.classList.add('grid-bookmarked');
    } else if (sim.answers[gIdx] !== undefined) {
      btn.classList.add('grid-answered');
    }
    if (gIdx === sim.currentIndex) btn.classList.add('grid-current');
  });

  const answeredCount = Object.keys(sim.answers).length;
  const summary = document.querySelector('.exam-grid-panel summary');
  if (summary) {
    summary.textContent = `Question Navigator (${answeredCount}/${sim.questions.length} answered) — Click to expand`;
  }
}

function updateExamBookmarkBtn(qId) {
  const btn = document.getElementById('exam-bookmark-btn');
  if (!btn) return;
  const active = isBookmarked(qId);
  btn.className = `bookmark-btn${active ? ' bookmarked' : ''}`;
  btn.textContent = active ? '🔖 Bookmarked' : '🔖 Bookmark';
}

function confirmSubmitExam() {
  const sim = window.APP.examSim;
  if (!sim) return;

  const answered = Object.keys(sim.answers).length;
  const unanswered = sim.questions.length - answered;
  const msg = unanswered > 0
    ? `You have ${unanswered} unanswered question(s). Submit anyway? You cannot change answers after submitting.`
    : 'Submit your exam? You cannot change answers after submitting.';

  if (confirm(msg)) {
    executeExamSubmit();
  }
}

function executeExamSubmit() {
  const sim = window.APP.examSim;
  if (!sim || sim.submitted) return;

  sim.submitted = true;
  stopExamTimer();
  clearExamSimProgress();

  const timeTaken = EXAM_SIM_DURATION - sim.timerRemaining;

  // Build answers array for scoring
  const answers = sim.questions.map((q, idx) => {
    const userAnswer = sim.answers[idx];
    const correctAnswers = Array.isArray(q.answer) ? q.answer : [q.answer];
    let correct = false;

    if (userAnswer === undefined || userAnswer === null) {
      correct = false;
    } else if (Array.isArray(userAnswer)) {
      const correctSet = new Set(correctAnswers);
      const selectedSet = new Set(userAnswer);
      correct = correctSet.size === selectedSet.size && [...correctSet].every(k => selectedSet.has(k));
    } else {
      correct = userAnswer === q.answer;
    }

    return {
      question_id: q.id,
      user_answer: userAnswer,
      correct,
      domain: q.domain,
      objective: q.objective,
      topic: q.topic,
      format: q.format,
      difficulty: q.difficulty,
      confidence: null
    };
  });

  const result = computeResults(answers);
  result.mode = 'exam_sim';
  result.time_taken = timeTaken;

  saveSession(result, answers);

  const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
  const streak = parseInt(localStorage.getItem('streak') || '0', 10);

  setActiveNav(null);
  showView('exam-results');
  renderExamSimResults(result, answers, sim.questions, timeTaken, streak);
}

function renderExamSimResults(result, answers, questions, timeTaken, streak) {
  const container = document.getElementById('view-exam-results');
  container.innerHTML = '';

  const heading = document.createElement('h2');
  heading.textContent = '🎯 Exam Simulation Results';
  container.appendChild(heading);

  const timeMins = Math.floor(timeTaken / 60);
  const timeSecs = timeTaken % 60;

  const summary = document.createElement('div');
  summary.className = `score-summary ${result.pass ? 'pass' : 'fail'}`;
  summary.innerHTML = `
    <h2>${result.pass ? '✅ PASS' : '❌ FAIL'}</h2>
    <p class="score-line">${result.score} / ${result.total} — ${result.pct.toFixed(0)}%</p>
    <p class="threshold-note">Passing threshold: ${PASS_THRESHOLD}% &nbsp;|&nbsp; Time taken: ${timeMins}m ${timeSecs}s</p>
  `;
  container.appendChild(summary);

  // Domain breakdown
  const domainSection = document.createElement('div');
  domainSection.className = 'domain-breakdown';
  domainSection.innerHTML = '<h3>Domain Breakdown</h3>';

  const table = document.createElement('table');
  table.className = 'domain-table';
  table.innerHTML = '<thead><tr><th>Domain</th><th>Questions</th><th>Correct</th><th>Score%</th><th>Pass/Fail</th></tr></thead>';
  const tbody = document.createElement('tbody');

  [1, 2, 3, 4, 5].forEach(d => {
    const stats = result.domainStats[d];
    if (stats.total === 0) return;
    const score = result.domainScores[d];
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>D${d} — ${escapeHtml(DOMAIN_NAMES[d])}</td>
      <td>${stats.total}</td>
      <td>${stats.correct}</td>
      <td>${score.toFixed(0)}%</td>
      <td class="${score >= PASS_THRESHOLD ? 'pass-text' : 'fail-text'}">${score >= PASS_THRESHOLD ? 'Pass' : 'Fail'}</td>
    `;
    tbody.appendChild(tr);

    const barRow = document.createElement('tr');
    const barCell = document.createElement('td');
    barCell.colSpan = 5;
    barCell.innerHTML = `<div class="progress-bar"><div class="progress-bar-fill" style="width:${score}%"></div></div>`;
    barRow.appendChild(barCell);
    tbody.appendChild(barRow);
  });

  table.appendChild(tbody);
  domainSection.appendChild(table);
  container.appendChild(domainSection);

  // Missed questions review
  const missedSection = buildMissedSection(answers);
  if (missedSection) container.appendChild(missedSection);

  // Tips
  const tips = generateTips(result, answers, { streak });
  const tipsCard = document.createElement('div');
  tipsCard.className = 'tips-card';
  tipsCard.innerHTML = '<h3>📋 Study Tips</h3>';
  const ul = document.createElement('ul');
  tips.forEach(t => {
    const li = document.createElement('li');
    li.textContent = t;
    ul.appendChild(li);
  });
  tipsCard.appendChild(ul);
  container.appendChild(tipsCard);

  // Share with Claude
  container.appendChild(buildClaudeShareSection(result, answers, {
    mode: 'exam_sim',
    timeTaken,
    tips
  }));

  // Action buttons
  const btnRow = document.createElement('div');
  btnRow.className = 'results-actions';

  const retakeBtn = document.createElement('button');
  retakeBtn.className = 'exam-sim-btn';
  retakeBtn.textContent = '🎯 Retake Exam';
  retakeBtn.addEventListener('click', () => startExamSim(true));

  const testBtn = document.createElement('button');
  testBtn.className = 'primary-btn';
  testBtn.textContent = 'Take Daily Test';
  testBtn.addEventListener('click', () => startTest());

  const progressBtn = document.createElement('button');
  progressBtn.className = 'secondary-btn';
  progressBtn.textContent = 'View Progress';
  progressBtn.addEventListener('click', () => {
    setActiveNav('progress');
    showView('progress');
    renderProgress();
  });

  const homeBtn = document.createElement('button');
  homeBtn.className = 'secondary-btn';
  homeBtn.textContent = 'Home';
  homeBtn.addEventListener('click', () => {
    setActiveNav('home');
    showView('home');
    renderHome();
  });

  btnRow.appendChild(retakeBtn);
  btnRow.appendChild(testBtn);
  btnRow.appendChild(progressBtn);
  btnRow.appendChild(homeBtn);
  container.appendChild(btnRow);
}

// =====================================================================
// O-2. SHARE WITH CLAUDE — EXPORT SESSION RESULTS
// =====================================================================

function generateClaudeExport(result, answers, opts) {
  opts = opts || {};
  const mode = opts.mode || 'daily';
  const timeTaken = (opts.timeTaken !== undefined && opts.timeTaken !== null) ? opts.timeTaken : null;
  const tips = opts.tips || [];

  const lines = [];

  // ── Header ──
  const dateStr = new Date(result.date).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const modeLabel = mode === 'exam_sim' ? 'Exam Simulation' : 'Daily Practice Test';
  const passLabel = result.pass ? 'PASS ✅' : 'FAIL ❌';

  lines.push('## 📊 Security+ SY0-701 Study Session Results');
  lines.push(`**Date:** ${dateStr}`);
  lines.push(`**Mode:** ${modeLabel}`);
  lines.push(`**Score:** ${result.score} / ${result.total} correct — ${result.pct.toFixed(0)}% — ${passLabel}`);

  if (timeTaken !== null) {
    const mins = Math.floor(timeTaken / 60);
    const secs = timeTaken % 60;
    lines.push(`**Time taken:** ${mins} minutes ${secs} seconds`);
  }

  lines.push('');
  lines.push('---');
  lines.push('');

  // ── Domain breakdown ──
  lines.push('## 📈 Domain Breakdown');
  lines.push('| Domain | Name | Score | Pass/Fail |');
  lines.push('|--------|------|-------|-----------|');

  [1, 2, 3, 4, 5].forEach(d => {
    const stats = result.domainStats[d];
    if (!stats || stats.total === 0) return;
    const score = result.domainScores[d];
    const pf = score >= PASS_THRESHOLD ? '✅' : '❌';
    lines.push(`| ${d} | ${DOMAIN_NAMES[d]} | ${stats.correct}/${stats.total} (${score.toFixed(0)}%) | ${pf} |`);
  });

  lines.push('');
  lines.push('---');
  lines.push('');

  // ── Missed questions ──
  const missed = answers.filter(a => !a.correct);
  lines.push(`## ❌ Missed Questions (${missed.length} total)`);

  if (missed.length === 0) {
    lines.push('');
    lines.push('🎉 No missed questions — perfect score!');
  } else {
    const cap = Math.min(missed.length, 30);

    missed.slice(0, cap).forEach((a, i) => {
      const q = window.ALL_QUESTIONS ? window.ALL_QUESTIONS.find(x => x.id === a.question_id) : null;
      if (!q) return;

      lines.push('');

      // PBQ scenario prefix
      if (q.format === 'pbq_scenario' && q.scenario) {
        lines.push(`**Q${i + 1}.**`);
        lines.push(`📋 Scenario: ${q.scenario}`);
        lines.push(`Question: ${q.stem}`);
      } else {
        lines.push(`**Q${i + 1}. ${q.stem}**`);
      }

      // My answer
      let myAnswer;
      if (Array.isArray(a.user_answer)) {
        if (!a.user_answer.length) {
          myAnswer = '(no selection)';
        } else {
          myAnswer = a.user_answer
            .map(k => (q.options && q.options[k]) ? `${k}. ${q.options[k]}` : k)
            .join(', ');
        }
      } else if (a.user_answer && q.options && q.options[a.user_answer]) {
        myAnswer = `${a.user_answer}. ${q.options[a.user_answer]}`;
      } else {
        myAnswer = a.user_answer || '(no answer)';
      }

      // Correct answer
      let correctAnswer;
      if (Array.isArray(q.answer)) {
        correctAnswer = q.answer
          .map(k => (q.options && q.options[k]) ? `${k}. ${q.options[k]}` : k)
          .join(', ');
      } else if (q.options && q.options[q.answer]) {
        correctAnswer = `${q.answer}. ${q.options[q.answer]}`;
      } else {
        correctAnswer = String(q.answer);
      }

      lines.push(`- **My answer:** ${myAnswer}`);
      lines.push(`- **Correct answer:** ${correctAnswer}`);

      const objInfo = OBJECTIVES[q.objective];
      const objTitle = objInfo ? `${q.objective} — ${objInfo.title}` : q.objective;
      lines.push(`- **Objective:** ${objTitle}`);
      lines.push(`- **Difficulty:** ${q.difficulty}`);
      lines.push(`- **Explanation:** ${q.explanation}`);

      if (q.comptia_logic_note) {
        lines.push(`- 💡 **CompTIA Logic:** ${q.comptia_logic_note}`);
      }
    });

    if (missed.length > 30) {
      lines.push('');
      lines.push(`[${missed.length - 30} more missed questions not shown — focus on the ones above first]`);
    }
  }

  lines.push('');
  lines.push('---');
  lines.push('');

  // ── Confidence breakdown (daily test only, when data exists) ──
  const hasConfidence = answers.some(a => a.confidence !== null && a.confidence !== undefined);
  if (hasConfidence) {
    const confStats = {
      guessed:   { total: 0, correct: 0 },
      unsure:    { total: 0, correct: 0 },
      confident: { total: 0, correct: 0 }
    };
    answers.forEach(a => {
      if (a.confidence && confStats[a.confidence]) {
        confStats[a.confidence].total++;
        if (a.correct) confStats[a.confidence].correct++;
      }
    });

    lines.push('## 😰 Confidence Breakdown');
    lines.push('| Confidence | Total | Correct | Accuracy |');
    lines.push('|------------|-------|---------|----------|');

    [
      { key: 'guessed',   label: 'Guessed 😰'   },
      { key: 'unsure',    label: 'Unsure 🤔'     },
      { key: 'confident', label: 'Confident 😊'  }
    ].forEach(({ key, label }) => {
      const s = confStats[key];
      const acc = s.total > 0 ? `${((s.correct / s.total) * 100).toFixed(0)}%` : '—';
      lines.push(`| ${label} | ${s.total} | ${s.correct} | ${acc} |`);
    });

    lines.push('');
    lines.push('---');
    lines.push('');
  }

  // ── Study tips ──
  lines.push('## 🎯 App Study Tips');
  tips.forEach(t => lines.push(`- ${t}`));
  lines.push('');

  return lines.join('\n');
}

function buildClaudeShareSection(result, answers, opts) {
  opts = opts || {};

  const section = document.createElement('div');
  section.className = 'claude-share-section';

  const btn = document.createElement('button');
  btn.className = 'btn-claude';
  btn.textContent = '🤖 Share with Claude — Get Study Notes';

  const subtitle = document.createElement('p');
  subtitle.textContent = 'Copies a summary you can paste into Claude chat';

  section.appendChild(btn);
  section.appendChild(subtitle);

  btn.addEventListener('click', () => {
    const text = generateClaudeExport(result, answers, opts);

    navigator.clipboard.writeText(text).then(() => {
      // Success path
      btn.textContent = '✅ Copied! Paste into Claude chat';
      btn.classList.add('copied');
      // Remove any fallback textarea that might exist
      const existing = section.querySelector('.claude-fallback-textarea');
      if (existing) existing.remove();
      const existingNote = section.querySelector('.claude-fallback-note');
      if (existingNote) existingNote.remove();

      setTimeout(() => {
        btn.textContent = '🤖 Share with Claude — Get Study Notes';
        btn.classList.remove('copied');
      }, 3000);
    }).catch(() => {
      // Failure path — show textarea fallback
      const text2 = generateClaudeExport(result, answers, opts);

      const note = document.createElement('p');
      note.className = 'claude-fallback-note';
      note.textContent = 'Clipboard access blocked — select all and copy manually (Ctrl+C)';

      const label = document.createElement('p');
      label.textContent = 'Copy this text and paste it into Claude chat:';
      label.style.marginTop = '0.75rem';

      const ta = document.createElement('textarea');
      ta.className = 'claude-fallback-textarea';
      ta.readOnly = true;
      ta.value = text2;

      // Remove previously appended fallback elements if re-clicked
      section.querySelectorAll('.claude-fallback-note, .claude-fallback-textarea, .claude-fallback-label')
        .forEach(el => el.remove());

      label.className = 'claude-fallback-label';
      section.appendChild(note);
      section.appendChild(label);
      section.appendChild(ta);

      // Auto-select so student can Ctrl+C immediately
      ta.focus();
      ta.select();
    });
  });

  return section;
}

// =====================================================================
// P. REPORT ISSUE
// =====================================================================

function getReports() {
  return JSON.parse(localStorage.getItem('question_reports') || '[]');
}

function saveReport(report) {
  const reports = getReports();
  reports.push(report);
  localStorage.setItem('question_reports', JSON.stringify(reports));
}

function renderReportButton(container, q) {
  const reportBtn = document.createElement('button');
  reportBtn.className = 'report-btn';
  reportBtn.textContent = '⚑ Report Issue';

  let formEl = null;

  reportBtn.addEventListener('click', () => {
    if (formEl) {
      formEl.remove();
      formEl = null;
      return;
    }

    formEl = document.createElement('div');
    formEl.className = 'report-form';

    const title = document.createElement('div');
    title.className = 'report-form-title';
    title.textContent = `Report an issue with question ${q.id}`;
    formEl.appendChild(title);

    const issueTypes = [
      { value: 'confusing', label: 'Question is confusing' },
      { value: 'wrong_answer', label: 'Answer seems incorrect' },
      { value: 'unclear_explanation', label: 'Explanation is unclear' },
      { value: 'other', label: 'Other' }
    ];

    const radioRow = document.createElement('div');
    radioRow.className = 'report-radio-row';

    issueTypes.forEach(({ value, label }) => {
      const lbl = document.createElement('label');
      const inp = document.createElement('input');
      inp.type = 'radio';
      inp.name = `report-type-${q.id}`;
      inp.value = value;
      if (value === 'confusing') inp.checked = true;
      lbl.appendChild(inp);
      lbl.appendChild(document.createTextNode(` ${label}`));
      radioRow.appendChild(lbl);
    });

    formEl.appendChild(radioRow);

    const note = document.createElement('textarea');
    note.className = 'report-note';
    note.placeholder = 'Describe the issue (optional)...';
    formEl.appendChild(note);

    const actions = document.createElement('div');
    actions.className = 'report-actions';

    const submitBtn = document.createElement('button');
    submitBtn.className = 'report-submit-btn';
    submitBtn.textContent = 'Submit Report';
    submitBtn.addEventListener('click', () => {
      const issueType = formEl.querySelector(`input[name="report-type-${q.id}"]:checked`);
      saveReport({
        question_id: q.id,
        question_stem: q.stem.slice(0, 100),
        issue_type: issueType ? issueType.value : 'other',
        note: note.value.trim(),
        date: new Date().toISOString()
      });
      showToast('✅ Report submitted. Thanks for the feedback!', 3000);
      formEl.remove();
      formEl = null;
    });

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'report-cancel-btn secondary-btn';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => {
      formEl.remove();
      formEl = null;
    });

    actions.appendChild(submitBtn);
    actions.appendChild(cancelBtn);
    formEl.appendChild(actions);

    container.appendChild(formEl);
  });

  container.appendChild(reportBtn);
}

function buildReportsSection() {
  const wrap = document.createElement('div');
  wrap.className = 'reports-section';
  wrap.innerHTML = '<h3>⚑ Reported Questions</h3>';

  const reports = getReports();
  if (!reports.length) {
    wrap.appendChild(Object.assign(document.createElement('p'), {
      textContent: 'No reported questions yet. Use ⚑ Report Issue on any question card to flag issues.'
    }));
    return wrap;
  }

  const tableWrap = document.createElement('div');
  tableWrap.className = 'table-scroll';
  const table = document.createElement('table');
  table.className = 'domain-table';
  table.innerHTML = '<thead><tr><th>Q-ID</th><th>Issue</th><th>Date</th><th>Note</th></tr></thead>';
  const tbody = document.createElement('tbody');

  const ISSUE_LABELS = {
    confusing: 'Confusing',
    wrong_answer: 'Wrong Answer',
    unclear_explanation: 'Unclear Explanation',
    other: 'Other'
  };

  reports.slice(-20).reverse().forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${escapeHtml(r.question_id)}</strong></td>
      <td>${escapeHtml(ISSUE_LABELS[r.issue_type] || r.issue_type)}</td>
      <td>${escapeHtml(new Date(r.date).toLocaleDateString())}</td>
      <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${escapeHtml(r.note || '')}">${escapeHtml(r.note || '—')}</td>
    `;
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  tableWrap.appendChild(table);
  wrap.appendChild(tableWrap);

  const clearBtn = document.createElement('button');
  clearBtn.className = 'secondary-btn reset-btn';
  clearBtn.style.marginTop = '0.75rem';
  clearBtn.textContent = 'Clear Reports';
  clearBtn.addEventListener('click', () => {
    if (confirm('Clear all reported questions?')) {
      localStorage.removeItem('question_reports');
      renderProgress();
    }
  });
  wrap.appendChild(clearBtn);

  return wrap;
}

// =====================================================================
// Q. DOMAIN MASTERY BADGES
// =====================================================================

function buildDomainMasteryBadges(sessions) {
  const wrap = document.createElement('div');
  wrap.className = 'badges-section';
  wrap.innerHTML = '<h3>Domain Mastery Badges</h3>';

  if (!sessions.length) {
    wrap.appendChild(Object.assign(document.createElement('p'), {
      textContent: 'Complete tests to unlock domain mastery badges.'
    }));
    return wrap;
  }

  // Compute current mastery from all sessions
  const currentTotals = {};
  [1, 2, 3, 4, 5].forEach(d => (currentTotals[d] = { total: 0, correct: 0 }));
  sessions.forEach(s => {
    if (!s.domain_stats) return;
    [1, 2, 3, 4, 5].forEach(d => {
      const ds = s.domain_stats[d];
      if (ds) {
        currentTotals[d].total += ds.total;
        currentTotals[d].correct += ds.correct;
      }
    });
  });

  // Compute previous mastery (all sessions except last) for unlock detection
  const prevTotals = {};
  [1, 2, 3, 4, 5].forEach(d => (prevTotals[d] = { total: 0, correct: 0 }));
  if (sessions.length > 1) {
    sessions.slice(0, -1).forEach(s => {
      if (!s.domain_stats) return;
      [1, 2, 3, 4, 5].forEach(d => {
        const ds = s.domain_stats[d];
        if (ds) {
          prevTotals[d].total += ds.total;
          prevTotals[d].correct += ds.correct;
        }
      });
    });
  }

  const grid = document.createElement('div');
  grid.className = 'badges-grid';

  const unlocked = [];

  [1, 2, 3, 4, 5].forEach(d => {
    const t = currentTotals[d];
    const mastery = t.total > 0 ? (t.correct / t.total) * 100 : 0;

    const pt = prevTotals[d];
    const prevMastery = pt.total > 0 ? (pt.correct / pt.total) * 100 : 0;

    let state;
    if (mastery >= PASS_THRESHOLD) state = 'mastered';
    else if (mastery >= 70) state = 'progress';
    else state = 'locked';

    let icon;
    if (state === 'mastered') icon = '✅';
    else if (state === 'progress') icon = '🎯';
    else icon = '🔒';

    const card = document.createElement('div');
    card.className = `domain-badge-card badge-${state}`;

    const pct = t.total > 0 ? mastery : 0;
    const barPct = Math.min((pct / PASS_THRESHOLD) * 100, 100);

    card.innerHTML = `
      <div class="domain-badge-icon">${icon}</div>
      <div class="domain-badge-name">Domain ${d}</div>
      <div class="domain-badge-pct">${pct.toFixed(0)}%</div>
      <div class="domain-badge-state">${state === 'mastered' ? 'Mastered' : state === 'progress' ? 'In Progress' : 'Locked'}</div>
      <div class="domain-badge-bar"><div class="domain-badge-bar-fill" style="width:${barPct}%"></div></div>
    `;

    grid.appendChild(card);

    // Check for newly unlocked (prev < 83, current >= 83)
    if (prevMastery < PASS_THRESHOLD && mastery >= PASS_THRESHOLD && t.total > 0) {
      unlocked.push(d);
    }
  });

  wrap.appendChild(grid);

  // Show congratulations toast for each newly mastered domain (delayed to render first)
  setTimeout(() => {
    unlocked.forEach(d => {
      showToast(`🎉 Domain ${d} Mastered! Great work on ${DOMAIN_NAMES[d]}!`, 7000);
    });
  }, 400);

  return wrap;
}

// =====================================================================
// R. CONFIDENCE VS ACCURACY (Progress Sub-section)
// =====================================================================

function buildConfidenceAccuracyTable(sessions) {
  const wrap = document.createElement('div');
  wrap.className = 'confidence-section';
  wrap.innerHTML = '<h3>Confidence vs Accuracy</h3>';

  const stats = {
    guessed: { total: 0, correct: 0 },
    unsure: { total: 0, correct: 0 },
    confident: { total: 0, correct: 0 }
  };

  let hasData = false;
  sessions.forEach(s => {
    if (!s.answers) return;
    s.answers.forEach(a => {
      if (a.confidence && stats[a.confidence]) {
        hasData = true;
        stats[a.confidence].total++;
        if (a.correct) stats[a.confidence].correct++;
      }
    });
  });

  if (!hasData) {
    wrap.appendChild(Object.assign(document.createElement('p'), {
      textContent: 'Rate your confidence after each question to see accuracy patterns here.'
    }));
    return wrap;
  }

  const tableWrap = document.createElement('div');
  tableWrap.className = 'table-scroll';
  const table = document.createElement('table');
  table.className = 'domain-table';
  table.innerHTML = '<thead><tr><th>Confidence Level</th><th>Total</th><th>Correct</th><th>Accuracy %</th></tr></thead>';
  const tbody = document.createElement('tbody');

  [
    { key: 'guessed', label: '😰 Guessed' },
    { key: 'unsure', label: '🤔 Unsure' },
    { key: 'confident', label: '😊 Confident' }
  ].forEach(({ key, label }) => {
    const s = stats[key];
    const acc = s.total > 0 ? (s.correct / s.total) * 100 : 0;
    let cls = 'mastery-low';
    if (acc >= PASS_THRESHOLD) cls = 'mastery-high';
    else if (acc >= 70) cls = 'mastery-mid';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${label}</td>
      <td>${s.total}</td>
      <td>${s.correct}</td>
      <td class="${s.total > 0 ? cls : ''}">${s.total > 0 ? acc.toFixed(0) + '%' : '—'}</td>
    `;
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  tableWrap.appendChild(table);
  wrap.appendChild(tableWrap);
  return wrap;
}

// =====================================================================
// Navigation / View Switching
// =====================================================================

function showView(name) {
  document.querySelectorAll('.view').forEach(s => (s.style.display = 'none'));
  const el = document.getElementById(`view-${name}`);
  if (el) el.style.display = 'block';
}

function setActiveNav(viewName) {
  document.querySelectorAll('.nav-link').forEach(a => {
    a.classList.toggle('active', a.dataset.view === viewName);
  });
}

function initNav() {
  document.querySelectorAll('.nav-link').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const view = a.dataset.view;

      // Warn if an exam sim is in progress
      if (window.APP.mode === 'exam-sim' && window.APP.examSim && !window.APP.examSim.submitted) {
        if (view !== 'exam-sim') {
          if (!confirm('Leave the exam? Your progress is saved in this browser tab.')) return;
          stopExamTimer();
          saveExamSimProgress();
          window.APP.mode = 'test';
        }
      }

      setActiveNav(view);

      if (view === 'test') {
        startTest();
      } else if (view === 'exam-sim') {
        if (window.APP.examSim && !window.APP.examSim.submitted) {
          showView('exam-sim');
        } else {
          startExamSim();
        }
      } else if (view === 'drill') {
        showView('drill');
        renderDrillConfig();
      } else if (view === 'progress') {
        showView('progress');
        renderProgress();
      } else if (view === 'bookmarks') {
        showView('bookmarks');
        renderBookmarks();
      } else {
        showView('home');
        renderHome();
      }
    });
  });

  const colorBtn = document.getElementById('btn-color-mode');
  if (colorBtn) {
    colorBtn.addEventListener('click', toggleColorMode);
  }
}

// =====================================================================
// Init
// =====================================================================

document.addEventListener('DOMContentLoaded', () => {
  // Apply saved color mode before render (no flash)
  const savedMode = localStorage.getItem('color_mode') || 'dark';
  applyColorMode(savedMode);

  initNav();
  initKeyboardNav();

  loadQuestions()
    .then(() => {
      showView('home');
      renderHome();
    })
    .catch(err => {
      console.error('Failed to load questions:', err);
      const home = document.getElementById('view-home');
      home.innerHTML = `<h2>Error loading questions</h2><p>${escapeHtml(err.message)}</p>`;
      showView('home');
    });
});
