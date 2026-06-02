import { getRandomChunk, loadSettings, saveSettings, getActiveWordList } from './utils';
import type { Settings } from './types';

// ── DOM Refs ──
const chunkDisplay = document.getElementById('chunkDisplay') as HTMLDivElement;
const wpmDisplay = document.getElementById('wpm') as HTMLDivElement;
const accuracyDisplay = document.getElementById('accuracy') as HTMLDivElement;
const consistencyDisplay = document.getElementById('consistency') as HTMLDivElement;
const streakDisplay = document.getElementById('streakDisplay') as HTMLDivElement;
const inputField = document.getElementById('inputField') as HTMLInputElement;
const timerDisplay = document.getElementById('timer') as HTMLDivElement;
const settingsBtn = document.getElementById('settingsBtn') as HTMLButtonElement;
const app = document.querySelector('.app') as HTMLDivElement;

// ── State ──
let settings: Settings = loadSettings();
let streakCounter = 0;
let targetText = '';
let userInput = '';
let startTime = 0;
let finished = false;
let typingStarted = false;
let wpmSamples: { time: number; wpm: number }[] = [];
let tickTimer: ReturnType<typeof setInterval> | null = null;
let elapsedSeconds = 0;

// ── Performance Container ──

const perfContainer = document.createElement('div');
perfContainer.id = 'performanceContainer';
perfContainer.style.display = 'none';

const perfTitle = document.createElement('h2');
perfTitle.textContent = 'Performance Summary';

const avgWpmDisplay = document.createElement('div');
avgWpmDisplay.id = 'avgWpmDisplay';

const durationDisplay = document.createElement('div');
durationDisplay.id = 'durationDisplay';

const chartTitle = document.createElement('h3');
chartTitle.textContent = 'WPM Over Time';

const chartContainer = document.createElement('div');
chartContainer.id = 'chartContainer';
chartContainer.style.position = 'relative';

const svgNS = 'http://www.w3.org/2000/svg';
const chartSvg = document.createElementNS(svgNS, 'svg');
chartSvg.setAttribute('width', '100%');
chartSvg.setAttribute('height', '100%');
chartSvg.style.display = 'block';
chartSvg.style.height = '200px';

const xAxisLabel = document.createElement('div');
xAxisLabel.textContent = 'Time (seconds)';
xAxisLabel.style.textAlign = 'center';
xAxisLabel.style.marginTop = '6px';
xAxisLabel.style.color = 'var(--text-secondary)';

const yAxisLabel = document.createElement('div');
yAxisLabel.textContent = 'Words Per Minute';
yAxisLabel.style.position = 'absolute';
yAxisLabel.style.left = '-36px';
yAxisLabel.style.top = '80px';
yAxisLabel.style.transform = 'rotate(-90deg)';
yAxisLabel.style.transformOrigin = 'left center';
yAxisLabel.style.color = 'var(--text-secondary)';
yAxisLabel.style.fontSize = '0.85rem';

chartContainer.appendChild(chartSvg);
chartContainer.appendChild(yAxisLabel);

const restartBtn = document.createElement('button');
restartBtn.textContent = 'Restart Test';
restartBtn.addEventListener('click', () => {
  perfContainer.style.display = 'none';
  app.style.display = 'block';
  resetTest();
});

perfContainer.appendChild(perfTitle);
perfContainer.appendChild(avgWpmDisplay);
perfContainer.appendChild(durationDisplay);
perfContainer.appendChild(chartTitle);
perfContainer.appendChild(chartContainer);
perfContainer.appendChild(xAxisLabel);
perfContainer.appendChild(restartBtn);
document.body.appendChild(perfContainer);

// ── Settings Modal ──

let settingsOverlay: HTMLDivElement;
let settingsModal: HTMLDivElement;
let settingsOpen = false;

function buildSettingsModal(): void {
  settingsOverlay = document.createElement('div');
  settingsOverlay.className = 'settings-overlay';

  settingsModal = document.createElement('div');
  settingsModal.className = 'settings-modal';

  // Header
  const header = document.createElement('div');
  header.className = 'settings-header';
  const h2 = document.createElement('h2');
  h2.textContent = 'Settings';
  const closeBtn = document.createElement('button');
  closeBtn.className = 'settings-close';
  closeBtn.innerHTML = '&times;';
  closeBtn.addEventListener('click', closeSettings);
  header.appendChild(h2);
  header.appendChild(closeBtn);
  settingsModal.appendChild(header);

  const body = document.createElement('div');
  body.className = 'settings-body';

  // ── Word Count ──
  const wcSection = document.createElement('div');
  wcSection.className = 'settings-section';
  const wcTitle = document.createElement('h3');
  wcTitle.textContent = 'Word Count';
  wcSection.appendChild(wcTitle);

  const minRow = document.createElement('div');
  minRow.className = 'setting-row';
  const minLabel = document.createElement('label');
  minLabel.textContent = 'Min Words:';
  const minSlider = document.createElement('input');
  minSlider.type = 'range';
  minSlider.min = '10';
  minSlider.max = '50';
  minSlider.value = String(settings.minWords);
  const minVal = document.createElement('span');
  minVal.className = 'range-value';
  minVal.textContent = String(settings.minWords);
  minSlider.addEventListener('input', () => {
    const v = parseInt(minSlider.value, 10);
    const maxV = parseInt(maxSlider.value, 10);
    if (v > maxV) { minSlider.value = String(maxV); return; }
    settings.minWords = v;
    minVal.textContent = String(v);
    saveSettings(settings);
    updateWordCountInfo();
  });
  minRow.appendChild(minLabel);
  minRow.appendChild(minSlider);
  minRow.appendChild(minVal);
  wcSection.appendChild(minRow);

  const maxRow = document.createElement('div');
  maxRow.className = 'setting-row';
  const maxLabel = document.createElement('label');
  maxLabel.textContent = 'Max Words:';
  const maxSlider = document.createElement('input');
  maxSlider.type = 'range';
  maxSlider.min = '10';
  maxSlider.max = '50';
  maxSlider.value = String(settings.maxWords);
  const maxVal = document.createElement('span');
  maxVal.className = 'range-value';
  maxVal.textContent = String(settings.maxWords);
  maxSlider.addEventListener('input', () => {
    const v = parseInt(maxSlider.value, 10);
    const minV = parseInt(minSlider.value, 10);
    if (v < minV) { maxSlider.value = String(minV); return; }
    settings.maxWords = v;
    maxVal.textContent = String(v);
    saveSettings(settings);
    updateWordCountInfo();
  });
  maxRow.appendChild(maxLabel);
  maxRow.appendChild(maxSlider);
  maxRow.appendChild(maxVal);
  wcSection.appendChild(maxRow);

  body.appendChild(wcSection);

  // ── Custom Words ──
  const cwSection = document.createElement('div');
  cwSection.className = 'settings-section';
  const cwTitle = document.createElement('h3');
  cwTitle.textContent = 'Custom Words';
  cwSection.appendChild(cwTitle);

  const cwInputRow = document.createElement('div');
  cwInputRow.className = 'word-input-row';
  const cwInput = document.createElement('input');
  cwInput.type = 'text';
  cwInput.placeholder = 'Enter a word...';
  const cwAddBtn = document.createElement('button');
  cwAddBtn.textContent = 'Add';
  cwAddBtn.addEventListener('click', () => {
    const word = cwInput.value.trim();
    if (!word || word.includes(' ')) return;
    if (settings.customWords.includes(word)) return;
    settings.customWords.push(word);
    saveSettings(settings);
    refreshCustomWordsUI(cwTags, cwInput);
    cwInput.value = '';
    cwInput.focus();
    updateWordCountInfo();
    refreshExcludeSelect(excludeSelect, excludeTags);
  });
  cwInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') cwAddBtn.click();
  });
  cwInputRow.appendChild(cwInput);
  cwInputRow.appendChild(cwAddBtn);
  cwSection.appendChild(cwInputRow);

  const cwTags = document.createElement('div');
  cwTags.className = 'word-tags';
  cwSection.appendChild(cwTags);

  const cwClear = document.createElement('button');
  cwClear.className = 'clear-btn';
  cwClear.textContent = 'Clear All Custom Words';
  cwClear.addEventListener('click', () => {
    settings.customWords = [];
    saveSettings(settings);
    refreshCustomWordsUI(cwTags, cwInput);
    updateWordCountInfo();
    refreshExcludeSelect(excludeSelect, excludeTags);
  });
  cwSection.appendChild(cwClear);

  body.appendChild(cwSection);

  // ── Excluded Words ──
  const exSection = document.createElement('div');
  exSection.className = 'settings-section';
  const exTitle = document.createElement('h3');
  exTitle.textContent = 'Excluded Words';
  exSection.appendChild(exTitle);

  const exInputRow = document.createElement('div');
  exInputRow.className = 'word-input-row';
  const excludeSelect = document.createElement('select');
  const exAddBtn = document.createElement('button');
  exAddBtn.textContent = 'Exclude';
  exAddBtn.addEventListener('click', () => {
    const word = excludeSelect.value;
    if (!word) return;
    if (settings.excludedWords.includes(word)) return;
    settings.excludedWords.push(word);
    saveSettings(settings);
    refreshExcludeSelect(excludeSelect, excludeTags);
    updateWordCountInfo();
  });
  exInputRow.appendChild(excludeSelect);
  exInputRow.appendChild(exAddBtn);
  exSection.appendChild(exInputRow);

  const excludeTags = document.createElement('div');
  excludeTags.className = 'word-tags';
  exSection.appendChild(excludeTags);

  const exClear = document.createElement('button');
  exClear.className = 'clear-btn';
  exClear.textContent = 'Reset Excluded Words';
  exClear.addEventListener('click', () => {
    settings.excludedWords = [];
    saveSettings(settings);
    refreshExcludeSelect(excludeSelect, excludeTags);
    updateWordCountInfo();
  });
  exSection.appendChild(exClear);

  body.appendChild(exSection);

  // ── Appearance ──
  const apSection = document.createElement('div');
  apSection.className = 'settings-section';
  const apTitle = document.createElement('h3');
  apTitle.textContent = 'Appearance';
  apSection.appendChild(apTitle);

  // Theme
  const themeRow = document.createElement('div');
  themeRow.className = 'setting-row';
  const themeLabel = document.createElement('label');
  themeLabel.textContent = 'Theme:';
  const themeBtn = document.createElement('button');
  themeBtn.className = 'toggle-btn';
  themeBtn.textContent = settings.theme === 'light' ? '☀ Light' : '🌙 Dark';
  if (settings.theme === 'light') themeBtn.classList.add('active');
  themeBtn.addEventListener('click', () => {
    const newTheme = settings.theme === 'light' ? 'dark' : 'light';
    settings.theme = newTheme;
    saveSettings(settings);
    applyTheme(newTheme);
    themeBtn.textContent = newTheme === 'light' ? '☀ Light' : '🌙 Dark';
    themeBtn.classList.toggle('active', newTheme === 'light');
  });
  themeRow.appendChild(themeLabel);
  themeRow.appendChild(themeBtn);
  apSection.appendChild(themeRow);

  // Snowflakes
  const sfRow = document.createElement('div');
  sfRow.className = 'setting-row';
  const sfLabel = document.createElement('label');
  sfLabel.textContent = 'Snowflakes:';
  const sfBtn = document.createElement('button');
  sfBtn.className = 'toggle-btn';
  sfBtn.textContent = settings.snowflakes ? '❄ On' : '❄ Off';
  if (settings.snowflakes) sfBtn.classList.add('active');
  sfBtn.addEventListener('click', () => {
    settings.snowflakes = !settings.snowflakes;
    saveSettings(settings);
    if (settings.snowflakes) {
      createSnowflakes();
    } else {
      removeSnowflakes();
    }
    sfBtn.textContent = settings.snowflakes ? '❄ On' : '❄ Off';
    sfBtn.classList.toggle('active', settings.snowflakes);
  });
  sfRow.appendChild(sfLabel);
  sfRow.appendChild(sfBtn);
  apSection.appendChild(sfRow);

  body.appendChild(apSection);

  // ── Word Count Info ──
  const infoP = document.createElement('p');
  infoP.className = 'settings-info';
  infoP.id = 'wordCountInfo';
  body.appendChild(infoP);

  settingsModal.appendChild(body);
  settingsOverlay.appendChild(settingsModal);
  document.body.appendChild(settingsOverlay);

  // Close on overlay click
  settingsOverlay.addEventListener('click', (e) => {
    if (e.target === settingsOverlay) closeSettings();
  });

  function refreshCustomWordsUI(tags: HTMLDivElement, _input: HTMLInputElement): void {
    tags.innerHTML = '';
    for (const w of settings.customWords) {
      const tag = document.createElement('span');
      tag.className = 'word-tag';
      tag.textContent = w;
      const rm = document.createElement('button');
      rm.innerHTML = '&times;';
      rm.addEventListener('click', () => {
        settings.customWords = settings.customWords.filter(x => x !== w);
        saveSettings(settings);
        refreshCustomWordsUI(tags, _input);
        updateWordCountInfo();
        refreshExcludeSelect(excludeSelect, excludeTags);
      });
      tag.appendChild(rm);
      tags.appendChild(tag);
    }
  }

  function refreshExcludeSelect(sel: HTMLSelectElement, tags: HTMLDivElement): void {
    tags.innerHTML = '';
    const active = getActiveWordList(settings);
    const currentVal = sel.value;
    sel.innerHTML = '';
    for (const w of active) {
      const opt = document.createElement('option');
      opt.value = w;
      opt.textContent = w;
      sel.appendChild(opt);
    }
    if (sel.options.length > 0) {
      if ([...sel.options].some(o => o.value === currentVal)) sel.value = currentVal;
    }

    for (const w of settings.excludedWords) {
      const tag = document.createElement('span');
      tag.className = 'word-tag';
      tag.textContent = w;
      const rm = document.createElement('button');
      rm.innerHTML = '&times;';
      rm.addEventListener('click', () => {
        settings.excludedWords = settings.excludedWords.filter(x => x !== w);
        saveSettings(settings);
        refreshExcludeSelect(sel, tags);
        updateWordCountInfo();
      });
      tag.appendChild(rm);
      tags.appendChild(tag);
    }
  }

  function updateWordCountInfo(): void {
    const active = getActiveWordList(settings);
    const info = document.getElementById('wordCountInfo');
    if (info) info.textContent = `Active words in pool: ${active.length}`;
  }

  refreshCustomWordsUI(cwTags, cwInput);
  refreshExcludeSelect(excludeSelect, excludeTags);
  updateWordCountInfo();
}

function openSettings(): void {
  settingsOpen = true;
  settingsOverlay.classList.add('open');
}

function closeSettings(): void {
  settingsOpen = false;
  settingsOverlay.classList.remove('open');
}

// ── Theme ──

function applyTheme(theme: 'dark' | 'light'): void {
  document.body.classList.toggle('light', theme === 'light');
}

// ── Snowflakes ──

let snowflakeContainer: HTMLDivElement | null = null;
let snowflakeAnimIds: number[] = [];

function createSnowflakes(): void {
  if (snowflakeContainer) return;
  snowflakeContainer = document.createElement('div');
  snowflakeContainer.id = 'snowflakeContainer';
  snowflakeContainer.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:9998;overflow:hidden;';
  document.body.appendChild(snowflakeContainer);

  const flakes = 60;
  for (let i = 0; i < flakes; i++) {
    const el = document.createElement('div');
    el.className = 'snowflake';
    el.textContent = '❄';
    el.style.left = `${Math.random() * 100}%`;
    el.style.fontSize = `${0.6 + Math.random() * 1}em`;
    el.style.opacity = `${0.3 + Math.random() * 0.5}`;
    el.style.animationDuration = `${5 + Math.random() * 10}s`;
    el.style.animationDelay = `${Math.random() * 5}s`;
    snowflakeContainer.appendChild(el);
  }
}

function removeSnowflakes(): void {
  if (snowflakeContainer) {
    snowflakeContainer.remove();
    snowflakeContainer = null;
  }
}

// ── Text ──

function getRandomText(): string {
  const active = getActiveWordList(settings);
  if (active.length === 0) return 'the quick brown fox jumps over the lazy dog';
  return getRandomChunk(settings.minWords, settings.maxWords, active);
}

// ── Render ──

function renderText(): void {
  chunkDisplay.innerHTML = '';
  for (let i = 0; i < targetText.length; i++) {
    const span = document.createElement('span');
    span.textContent = targetText[i];
    if (i < userInput.length) {
      span.className = userInput[i] === targetText[i] ? 'correct' : 'incorrect';
    } else {
      span.className = 'ghost';
    }
    chunkDisplay.appendChild(span);
  }
}

// ── Stats ──

function countMatchingCharacters(target: string, input: string): number {
  let count = 0;
  for (let i = 0; i < input.length; i++) {
    if (input[i] === target[i]) count++;
  }
  return count;
}

function updateStats(): void {
  const elapsed = Date.now() - startTime;
  const correctChars = countMatchingCharacters(targetText, userInput);
  const accuracy = targetText.length > 0 ? Math.round((correctChars / targetText.length) * 100) : 0;
  const minutes = elapsed / 60000;
  const wpm = minutes > 0 ? Math.round((correctChars / 5) / minutes) : 0;

  wpmDisplay.textContent = `WPM: ${wpm}`;
  accuracyDisplay.textContent = `Accuracy: ${accuracy}%`;

  const averageWPM = getTrimmedAverageWPM(wpmSamples);
  const stdDev = standardDeviation(wpmSamples.map(s => s.wpm));
  const consistency = averageWPM > 0 ? Math.max(0, Math.round((1 - stdDev / averageWPM) * 100)) : 100;
  consistencyDisplay.textContent = `Consistency: ${consistency}%`;
}

function getTrimmedAverageWPM(samples: { time: number; wpm: number }[]): number {
  if (samples.length === 0) return 0;
  const sorted = [...samples].sort((a, b) => a.wpm - b.wpm);
  const trimCount = Math.floor(samples.length * 0.2);
  const trimmed = sorted.slice(trimCount, samples.length - trimCount);
  if (trimmed.length === 0) return Math.round(sorted.reduce((a, b) => a + b.wpm, 0) / sorted.length);
  const sum = trimmed.reduce((acc, cur) => acc + cur.wpm, 0);
  return Math.round(sum / trimmed.length);
}

function standardDeviation(arr: number[]): number {
  if (arr.length === 0) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const variance = arr.reduce((a, b) => a + (b - mean) ** 2, 0) / arr.length;
  return Math.sqrt(variance);
}

// ── Chart ──

function renderChart(): void {
  while (chartSvg.firstChild) chartSvg.removeChild(chartSvg.firstChild);

  if (wpmSamples.length === 0) return;

  const maxWPM = Math.max(...wpmSamples.map(s => s.wpm), 1);
  const svgWidth = Math.max(chartContainer.clientWidth || 600, 100);
  const svgHeight = 200;
  chartSvg.setAttribute('width', `${svgWidth}`);
  chartSvg.setAttribute('height', `${svgHeight}`);
  chartSvg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);

  const oldTooltip = document.getElementById('wpmTooltip');
  if (oldTooltip) oldTooltip.remove();

  const tooltip = document.createElement('div');
  tooltip.id = 'wpmTooltip';
  tooltip.style.visibility = 'hidden';
  chartContainer.appendChild(tooltip);

  // Gridlines
  const gridColor = getComputedStyle(document.body).getPropertyValue('--border').trim() || '#333';
  for (let g = 1; g <= 4; g++) {
    const y = (svgHeight / 4) * g;
    const line = document.createElementNS(svgNS, 'line');
    line.setAttribute('x1', '0');
    line.setAttribute('y1', String(y));
    line.setAttribute('x2', String(svgWidth));
    line.setAttribute('y2', String(y));
    line.setAttribute('stroke', gridColor);
    line.setAttribute('stroke-width', '1');
    line.setAttribute('stroke-dasharray', '4,4');
    chartSvg.appendChild(line);

    const label = (maxWPM / 4) * (4 - g);
    const text = document.createElementNS(svgNS, 'text');
    text.setAttribute('x', '-5');
    text.setAttribute('y', String(y + 4));
    text.setAttribute('text-anchor', 'end');
    text.setAttribute('fill', gridColor);
    text.setAttribute('font-size', '11');
    text.textContent = String(Math.round(label));
    chartSvg.appendChild(text);
  }

  // Bars
  const barWidth = Math.max(svgWidth / wpmSamples.length, 4);

  wpmSamples.forEach((sample, i) => {
    const barHeight = Math.max((sample.wpm / maxWPM) * svgHeight, 1);
    const x = i * barWidth;

    const rect = document.createElementNS(svgNS, 'rect');
    rect.setAttribute('x', String(x + 1));
    rect.setAttribute('y', String(svgHeight - barHeight));
    rect.setAttribute('width', String(Math.max(barWidth - 2, 2)));
    rect.setAttribute('height', String(barHeight));
    rect.style.fill = 'var(--accent)';
    rect.setAttribute('rx', '2');
    rect.style.transition = 'opacity 0.3s';

    rect.addEventListener('mouseenter', (event) => {
      const rect_ = chartContainer.getBoundingClientRect();
      tooltip.textContent = `WPM: ${sample.wpm} at ${(sample.time / 1000).toFixed(1)}s`;
      tooltip.style.left = `${event.clientX - rect_.left + 10}px`;
      tooltip.style.top = `${event.clientY - rect_.top - 10}px`;
      tooltip.style.visibility = 'visible';
    });

    rect.addEventListener('mousemove', (event) => {
      const rect_ = chartContainer.getBoundingClientRect();
      tooltip.style.left = `${event.clientX - rect_.left + 10}px`;
      tooltip.style.top = `${event.clientY - rect_.top - 10}px`;
    });

    rect.addEventListener('mouseleave', () => {
      tooltip.style.visibility = 'hidden';
    });

    chartSvg.appendChild(rect);
  });
}

// ── Timer ──

function startTickTimer(): void {
  elapsedSeconds = 0;
  timerDisplay.textContent = '0s';
  if (tickTimer !== null) clearInterval(tickTimer);

  tickTimer = setInterval(() => {
    elapsedSeconds++;
    const totalElapsed = Date.now() - startTime;
    timerDisplay.textContent = `${elapsedSeconds}s`;

    if (typingStarted && !finished) {
      const correctChars = countMatchingCharacters(targetText, userInput);
      const minutes = totalElapsed / 60000;
      const wpm = minutes > 0 ? Math.round((correctChars / 5) / minutes) : 0;

      if (wpm > 0 && wpm <= 200) {
        wpmSamples.push({ time: totalElapsed, wpm });
        if (wpmSamples.length > 60) wpmSamples.shift();
      }

      wpmDisplay.textContent = `WPM: ${wpm}`;

      const accuracy = targetText.length > 0 ? Math.round((correctChars / targetText.length) * 100) : 0;
      accuracyDisplay.textContent = `Accuracy: ${accuracy}%`;

      const avgWPM = getTrimmedAverageWPM(wpmSamples);
      const stdDev = standardDeviation(wpmSamples.map(s => s.wpm));
      const consistency = avgWPM > 0 ? Math.max(0, Math.round((1 - stdDev / avgWPM) * 100)) : 100;
      consistencyDisplay.textContent = `Consistency: ${consistency}%`;
    }
  }, 1000);
}

function stopTickTimer(): void {
  if (tickTimer !== null) {
    clearInterval(tickTimer);
    tickTimer = null;
  }
}

// ── Performance ──

function showPerformance(): void {
  app.style.display = 'none';
  perfContainer.style.display = 'block';
  inputField.blur();
  inputField.disabled = true;

  const averageWPM = getTrimmedAverageWPM(wpmSamples);
  avgWpmDisplay.textContent = `Average WPM: ${averageWPM}`;

  const durationSeconds = wpmSamples.length > 0
    ? (wpmSamples[wpmSamples.length - 1].time / 1000).toFixed(1)
    : ((Date.now() - startTime) / 1000).toFixed(1);

  durationDisplay.textContent = `Test Duration: ${durationSeconds} second${parseFloat(durationSeconds) !== 1 ? 's' : ''}`;

  renderChart();
}

// ── Confetti ──

function showConfetti(): void {
  const confettiContainer = document.createElement('div');
  confettiContainer.className = 'confetti-container';
  for (let i = 0; i < 80; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = `${Math.random() * 100}%`;
    confetti.style.background = `hsl(${Math.random() * 360}, 100%, 60%)`;
    confetti.style.animationDelay = `${Math.random() * 0.5}s`;
    confettiContainer.appendChild(confetti);
  }
  document.body.appendChild(confettiContainer);
  setTimeout(() => confettiContainer.remove(), 1800);
}

// ── Input Handling ──

inputField.addEventListener('input', () => {
  if (finished) return;

  if (!typingStarted) {
    typingStarted = true;
    startTime = Date.now();
    startTickTimer();
  }

  userInput = inputField.value;

  if (userInput.length > targetText.length) {
    userInput = userInput.slice(0, targetText.length);
    inputField.value = userInput;
  }

  renderText();
  updateStats();

  if (userInput.length === targetText.length) {
    finished = true;
    stopTickTimer();
    inputField.classList.add('finished');

    if (userInput === targetText) {
      streakCounter++;
      streakDisplay.textContent = `Streak: ${streakCounter}`;
      showConfetti();
    } else {
      streakCounter = 0;
      streakDisplay.textContent = `Streak: 0`;
    }

    setTimeout(() => showPerformance(), 500);
  }
});

inputField.addEventListener('keydown', (e) => {
  if (finished && e.key === 'Enter') {
    if (perfContainer.style.display === 'block') {
      perfContainer.style.display = 'none';
      app.style.display = 'block';
      resetTest();
    } else {
      showPerformance();
    }
  }
});

// ── Settings Button ──

settingsBtn.addEventListener('click', openSettings);

// ── Reset ──

function resetTest(): void {
  settings = loadSettings();
  targetText = getRandomText();
  userInput = '';
  inputField.value = '';
  finished = false;
  typingStarted = false;
  wpmSamples = [];
  stopTickTimer();
  elapsedSeconds = 0;
  timerDisplay.textContent = '0s';
  streakDisplay.textContent = `Streak: ${streakCounter}`;
  inputField.disabled = false;
  inputField.classList.remove('finished');
  renderText();
  wpmDisplay.textContent = 'WPM: 0';
  accuracyDisplay.textContent = 'Accuracy: 0%';
  consistencyDisplay.textContent = 'Consistency: 0%';
  inputField.focus();
}

// ── Init ──

applyTheme(settings.theme);
buildSettingsModal();
if (settings.snowflakes) createSnowflakes();
resetTest();
