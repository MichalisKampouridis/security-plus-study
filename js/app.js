// =====================================================================
// Security+ SY0-701 Study App — Core Engine (Phase 2 + Phase 3)
// =====================================================================

window.APP = {
  questions: [],
  currentTest: [],
  currentAnswers: [],
  currentIndex: 0,
  mode: 'test', // 'test' | 'drill'
  drillNotice: null
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

// Objective titles, derived from the SY0-701 blueprint objective headings.
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

// ---------------------------------------------------------------------
// A. DATA LOADING
// ---------------------------------------------------------------------

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

// ---------------------------------------------------------------------
// B. DAILY TEST GENERATOR
// ---------------------------------------------------------------------

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

  // Compute per-domain quotas based on blueprint weights, scaled to `total`.
  const domainIds = [1, 2, 3, 4, 5];
  const quotas = {};
  let runningSum = 0;
  domainIds.forEach((d, i) => {
    if (i < domainIds.length - 1) {
      quotas[d] = Math.round(DOMAIN_WEIGHTS[d] * total);
      runningSum += quotas[d];
    }
  });
  // Last bucket absorbs the rounding remainder so quotas sum exactly to `total`.
  quotas[domainIds[domainIds.length - 1]] = total - runningSum;

  const selected = [];
  const usedIds = new Set();

  domainIds.forEach(d => {
    const domainQuestions = all.filter(q => q.domain === d);

    // Exclude questions seen within the last 7 days.
    let pool = domainQuestions.filter(q => {
      const ts = seen[q.id];
      return !ts || (now - new Date(ts).getTime()) > SEVEN_DAYS_MS;
    });

    // If the pool is too small for this domain's quota, relax the 7-day window.
    if (pool.length < quotas[d]) {
      pool = domainQuestions;
    }

    const picks = fisherYatesShuffle(pool).slice(0, quotas[d]);
    picks.forEach(q => usedIds.add(q.id));
    selected.push(...picks);
  });

  // If shortages occurred (a domain didn't have enough questions), fill the
  // remaining slots from any unused questions across all domains.
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

// ---------------------------------------------------------------------
// C. TEST RUNNER (shared by Daily Test and Drill Mode)
// ---------------------------------------------------------------------

function startTest() {
  window.APP.mode = 'test';
  window.APP.drillNotice = null;
  window.APP.currentTest = generateDailyTest(25);
  window.APP.currentAnswers = [];
  window.APP.currentIndex = 0;
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
      allBtns.forEach(b => (b.disabled = true));

      const correct = key === q.answer;
      btn.classList.add(correct ? 'correct' : 'incorrect');

      if (!correct) {
        const correctBtn = list.querySelector(`.option-btn[data-key="${q.answer}"]`);
        if (correctBtn) correctBtn.classList.add('correct');
      }

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
    difficulty: q.difficulty
  });

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
    saveSession(result);
    const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
    const previousPct = sessions.length >= 2 ? sessions[sessions.length - 2].pct : null;
    const streak = parseInt(localStorage.getItem('streak') || '0', 10);

    setActiveNav(null);
    showView('results');
    renderResults(result, answers, { streak, previousPct });
  }
}

// ---------------------------------------------------------------------
// D. SCORING + RESULTS VIEW
// ---------------------------------------------------------------------

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

// Builds the "Missed Questions Review" section shared by the daily test
// results view and the drill results view. Returns null if there are no
// misses.
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
    missedSection.appendChild(card);
  });

  return missedSection;
}

function renderResults(result, answers, context) {
  const container = document.getElementById('view-results');
  container.innerHTML = '';

  // --- Score summary ---
  const summary = document.createElement('div');
  summary.className = `score-summary ${result.pass ? 'pass' : 'fail'}`;
  summary.innerHTML = `
    <h2>${result.pass ? 'PASS' : 'FAIL'}</h2>
    <p class="score-line">${result.score} / ${result.total} — ${result.pct.toFixed(0)}% — ${result.pass ? 'PASS' : 'FAIL'}</p>
    <p class="threshold-note">Passing threshold: ${PASS_THRESHOLD}%</p>
  `;
  container.appendChild(summary);

  // --- Domain breakdown ---
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

  // --- Missed questions review ---
  const missedSection = buildMissedSection(answers);
  if (missedSection) container.appendChild(missedSection);

  // --- Study tips ---
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

  // --- Action buttons ---
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

// ---------------------------------------------------------------------
// E. PERFORMANCE TIPS ENGINE
// ---------------------------------------------------------------------

function generateTips(result, answers, context) {
  context = context || {};
  const candidates = [];

  // 1. Streak tip
  if (context.streak >= 3) {
    candidates.push(
      `\u{1F525} ${context.streak}-day streak — consistency is your biggest advantage. Keep it going.`
    );
  }

  // 2. Improvement / regression tip vs. previous session
  if (context.previousPct !== null && context.previousPct !== undefined) {
    const diff = result.pct - context.previousPct;
    if (diff >= 5) {
      candidates.push(
        `\u{1F4C8} You improved ${diff.toFixed(0)} points since last session — great momentum.`
      );
    } else if (diff <= -5) {
      candidates.push(
        `\u{1F4C9} Score dipped ${Math.abs(diff).toFixed(0)} points from last session. Check if you're rushing answers.`
      );
    }
  }

  // 3. Near-pass tip
  if (result.pct >= 79 && result.pct <= 82) {
    const diff = PASS_THRESHOLD - result.pct;
    candidates.push(
      `You are within ${diff.toFixed(0)}% of passing. One or two more correct answers would have passed this test.`
    );
  }

  // 4. Weakest domain tip
  let weakestDomain = null;
  let weakestScore = Infinity;
  Object.entries(result.domainScores).forEach(([d, score]) => {
    if (score !== null && score < weakestScore) {
      weakestScore = score;
      weakestDomain = d;
    }
  });
  if (weakestDomain !== null) {
    candidates.push(
      `Your weakest domain this session was Domain ${weakestDomain} — ${DOMAIN_NAMES[weakestDomain]}. Focus your next study block there.`
    );
  }

  // 5. Objective miss tip (2+ misses on the same objective)
  const objCounts = {};
  const objTopics = {};
  answers.filter(a => !a.correct).forEach(a => {
    objCounts[a.objective] = (objCounts[a.objective] || 0) + 1;
    objTopics[a.objective] = a.topic;
  });
  Object.entries(objCounts).forEach(([obj, count]) => {
    if (count >= 2) {
      candidates.push(
        `You missed multiple questions on objective ${obj} (${objTopics[obj]}). Review that sub-topic specifically.`
      );
    }
  });

  // 6. Format struggle tip (<50% on a format with >=2 questions of that type)
  const formatStats = {};
  answers.forEach(a => {
    if (!formatStats[a.format]) formatStats[a.format] = { total: 0, correct: 0 };
    formatStats[a.format].total++;
    if (a.correct) formatStats[a.format].correct++;
  });
  Object.entries(formatStats).forEach(([fmt, stats]) => {
    if (stats.total >= 2 && stats.correct / stats.total < 0.5) {
      candidates.push(
        `You struggled with ${fmt.replace(/_/g, ' ')} questions. Practice that question style more.`
      );
    }
  });

  // 7. Difficulty tip (missed all or most hard questions)
  const hardAnswers = answers.filter(a => a.difficulty === 'hard');
  if (hardAnswers.length) {
    const hardCorrect = hardAnswers.filter(a => a.correct).length;
    if (hardCorrect / hardAnswers.length <= 0.5) {
      const domainForDrill = weakestDomain !== null ? weakestDomain : hardAnswers[0].domain;
      candidates.push(
        `Hard questions are a gap — try the Drill Mode on Domain ${domainForDrill} set to hard only.`
      );
    }
  }

  // Always-present general reinforcement tip (last priority slot).
  let reinforcement;
  if (result.pct >= PASS_THRESHOLD) {
    reinforcement = 'Great job — you passed! Keep reviewing misses to push toward 90%+.';
  } else if (result.pct >= 70) {
    reinforcement = "You're close to passing. One more focused session should get you there.";
  } else {
    reinforcement = "Don't worry — consistent daily practice builds retention. Review your misses and try again tomorrow.";
  }

  // Cap at 5 tips total: top 4 prioritized candidates + the reinforcement tip.
  const tips = candidates.slice(0, 4);
  tips.push(reinforcement);
  return tips;
}

// ---------------------------------------------------------------------
// F. PROGRESS PERSISTENCE
// ---------------------------------------------------------------------

function saveSession(result) {
  const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
  sessions.push({
    date: result.date,
    score: result.score,
    total: result.total,
    pct: result.pct,
    domain_scores: result.domainScores,
    domain_stats: result.domainStats,
    misses: result.misses
  });
  localStorage.setItem('sessions', JSON.stringify(sessions));

  updateStreak();
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
    // Already completed a session today; streak unchanged.
  } else if (!lastDateStr) {
    streak = 1;
  } else {
    const last = new Date(lastDateStr);
    const diffDays = Math.round((new Date(todayStr) - new Date(last.toDateString())) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      streak += 1;
    } else {
      // Last session was more than one day ago: reset, then count today.
      streak = 1;
    }
  }

  localStorage.setItem('streak', String(streak));
  localStorage.setItem('last_session_date', todayStr);
}

// ---------------------------------------------------------------------
// G. HOME VIEW
// ---------------------------------------------------------------------

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
      <button id="btn-drill-home" class="secondary-btn">Drill Mode</button>
      <button id="btn-progress-home" class="secondary-btn">View Progress</button>
    </div>
  `;

  document.getElementById('btn-start-test').addEventListener('click', () => startTest());
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

// ---------------------------------------------------------------------
// H. PROGRESS VIEW (full dashboard)
// ---------------------------------------------------------------------

function renderProgress() {
  const container = document.getElementById('view-progress');
  const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
  const streak = parseInt(localStorage.getItem('streak') || '0', 10);
  const missCounts = JSON.parse(localStorage.getItem('objective_miss_counts') || '{}');

  container.innerHTML = '';

  const heading = document.createElement('h2');
  heading.textContent = 'Progress';
  container.appendChild(heading);

  // 1. Header stat cards
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

  // 2. Score history chart
  container.appendChild(buildScoreChart(sessions));

  // 3. Domain mastery table
  container.appendChild(buildDomainMasteryTable(sessions));

  // 4. Focus areas (weakest objectives)
  container.appendChild(buildFocusAreasTable(missCounts));

  // 5. Session history
  container.appendChild(buildSessionHistoryTable(sessions));

  // 6. Reset progress
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

  // Back to home
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
    const p = document.createElement('p');
    p.textContent = 'No sessions yet — complete a test to start building your score history.';
    wrap.appendChild(p);
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

    // Trigger the grow animation after layout.
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
    const p = document.createElement('p');
    p.textContent = 'Complete a test to see your domain mastery breakdown.';
    wrap.appendChild(p);
    return wrap;
  }

  // Aggregate totals across ALL sessions.
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
    const p = document.createElement('p');
    p.textContent = 'Complete a test to see your domain mastery breakdown.';
    wrap.appendChild(p);
  }

  return wrap;
}

function buildFocusAreasTable(missCounts) {
  const wrap = document.createElement('div');
  wrap.className = 'focus-section';
  wrap.innerHTML = '<h3>Focus Areas — Most-Missed Objectives</h3>';

  const entries = Object.entries(missCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  if (!entries.length) {
    const p = document.createElement('p');
    p.textContent = 'No missed questions yet. Keep up the great work!';
    wrap.appendChild(p);
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
    const p = document.createElement('p');
    p.textContent = 'No sessions yet.';
    wrap.appendChild(p);
    return wrap;
  }

  const tableWrap = document.createElement('div');
  tableWrap.className = 'table-scroll';
  const table = document.createElement('table');
  table.className = 'domain-table';
  table.innerHTML = '<thead><tr><th>Date</th><th>Score</th><th>Total</th><th>%</th><th>Pass/Fail</th></tr></thead>';
  const tbody = document.createElement('tbody');

  sessions.slice(-10).reverse().forEach(s => {
    const pass = s.pct >= PASS_THRESHOLD;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(new Date(s.date).toLocaleString())}</td>
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

// ---------------------------------------------------------------------
// I. DRILL MODE
// ---------------------------------------------------------------------

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
    if (top20.length) {
      pool = pool.filter(q => top20.includes(q.objective));
    }
    // If there's no miss history yet, fall through and use the full pool.
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

  // Toggle domain/objective dropdowns based on scope selection.
  const domainGroup = panel.querySelector('#drill-domain-group');
  const objectiveGroup = panel.querySelector('#drill-objective-group');
  panel.querySelectorAll('input[name="drill-scope"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const val = panel.querySelector('input[name="drill-scope"]:checked').value;
      domainGroup.style.display = val === 'domain' ? '' : 'none';
      objectiveGroup.style.display = val === 'objective' ? '' : 'none';
    });
  });

  // Slider label
  const countSlider = panel.querySelector('#drill-count');
  const countLabel = panel.querySelector('#drill-count-label');
  countSlider.addEventListener('input', () => {
    countLabel.textContent = countSlider.value;
  });

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

// ---------------------------------------------------------------------
// Navigation / view switching
// ---------------------------------------------------------------------

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
      setActiveNav(view);

      if (view === 'test') {
        startTest();
      } else if (view === 'drill') {
        showView('drill');
        renderDrillConfig();
      } else if (view === 'progress') {
        showView('progress');
        renderProgress();
      } else {
        showView('home');
        renderHome();
      }
    });
  });
}

// ---------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  initNav();
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
