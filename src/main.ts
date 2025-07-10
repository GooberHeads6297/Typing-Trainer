import { getRandomChunk } from './utils';

const chunkDisplay = document.getElementById('chunkDisplay') as HTMLDivElement;
const wpmDisplay = document.getElementById('wpm') as HTMLDivElement;
const accuracyDisplay = document.getElementById('accuracy') as HTMLDivElement;
const consistencyDisplay = document.getElementById('consistency') as HTMLDivElement;
const streakDisplay = document.getElementById('streakDisplay') as HTMLDivElement;
const inputField = document.getElementById('inputField') as HTMLInputElement;
const app = document.querySelector('.app') as HTMLDivElement;

let streakCounter = 0;
let targetText = '';
let userInput = '';
let startTime = 0;
let finished = false;
let typingStarted = false;
let wpmSamples: { time: number; wpm: number }[] = [];

const performanceContainer = document.createElement('div');
performanceContainer.id = 'performanceContainer';
performanceContainer.style.display = 'none';

const performanceTitle = document.createElement('h2');
performanceTitle.textContent = 'Performance Summary';

const avgWpmDisplay = document.createElement('div');
avgWpmDisplay.id = 'avgWpmDisplay';

const durationDisplay = document.createElement('div');
durationDisplay.id = 'durationDisplay';
durationDisplay.style.margin = '0.5rem 0';
durationDisplay.style.fontSize = '1.2rem';
durationDisplay.style.color = '#aaa';

const chartTitle = document.createElement('h3');
chartTitle.textContent = 'WPM Over Time';

const chartContainer = document.createElement('div');
chartContainer.id = 'chartContainer';
chartContainer.style.position = 'relative';

const svgNS = 'http://www.w3.org/2000/svg';
const svg = document.createElementNS(svgNS, 'svg');
svg.setAttribute('width', '100%');
svg.setAttribute('height', '100%');
svg.style.display = 'block';
svg.style.height = '200px';

const xAxisLabel = document.createElement('div');
xAxisLabel.textContent = 'Time (seconds)';
xAxisLabel.style.textAlign = 'center';
xAxisLabel.style.marginTop = '6px';
xAxisLabel.style.color = '#ccc';

const yAxisLabel = document.createElement('div');
yAxisLabel.textContent = 'Words Per Minute';
yAxisLabel.style.position = 'absolute';
yAxisLabel.style.left = '-36px';
yAxisLabel.style.top = '80px';
yAxisLabel.style.transform = 'rotate(-90deg)';
yAxisLabel.style.transformOrigin = 'left center';
yAxisLabel.style.color = '#ccc';
yAxisLabel.style.fontSize = '0.85rem';

chartContainer.appendChild(svg);
chartContainer.appendChild(yAxisLabel);

const restartBtn = document.createElement('button');
restartBtn.textContent = 'Restart Test';
restartBtn.addEventListener('click', () => {
  performanceContainer.style.display = 'none';
  app.style.display = 'block';
  resetTest();
});

performanceContainer.appendChild(performanceTitle);
performanceContainer.appendChild(avgWpmDisplay);
performanceContainer.appendChild(durationDisplay);
performanceContainer.appendChild(chartTitle);
performanceContainer.appendChild(chartContainer);
performanceContainer.appendChild(xAxisLabel);
performanceContainer.appendChild(restartBtn);
document.body.appendChild(performanceContainer);

function getRandomText(): string {
  return getRandomChunk(25, 35);
}

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

function showConfetti(): void {
  const confettiContainer = document.createElement('div');
  confettiContainer.className = 'confetti-container';
  for (let i = 0; i < 80; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = Math.random() * 100 + '%';
    confetti.style.background = `hsl(${Math.random() * 360}, 100%, 60%)`;
    confetti.style.animationDelay = Math.random() * 0.5 + 's';
    confettiContainer.appendChild(confetti);
  }
  document.body.appendChild(confettiContainer);
  setTimeout(() => confettiContainer.remove(), 1800);
}

function updateStats(): void {
  const elapsed = Date.now() - startTime;
  const correctChars = countMatchingCharacters(targetText, userInput);
  const accuracy = Math.round((correctChars / targetText.length) * 100);
  const wordCount = targetText.split(' ').length;
  const minutes = elapsed / 60000;
  const wpm = Math.round(wordCount / minutes);

  wpmDisplay.textContent = `WPM: ${wpm}`;
  accuracyDisplay.textContent = `Accuracy: ${accuracy}%`;

  if (!finished && typingStarted && elapsed > 2000 && wpm > 0 && wpm <= 200) {
    wpmSamples.push({ time: elapsed, wpm });
  }

  const averageWPM = getTrimmedAverageWPM(wpmSamples);
  const stdDev = standardDeviation(wpmSamples.map(s => s.wpm));
  const consistency = Math.max(0, Math.round((1 - stdDev / (averageWPM || 1)) * 100));
  consistencyDisplay.textContent = `Consistency: ${consistency}%`;
}

inputField.addEventListener('input', () => {
  if (finished) return;

  if (!typingStarted) {
    typingStarted = true;
    startTime = Date.now();
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
    if (performanceContainer.style.display === 'block') {
      performanceContainer.style.display = 'none';
      app.style.display = 'block';
      resetTest();
    } else {
      showPerformance();
    }
  }
});

function showPerformance(): void {
  app.style.display = 'none';
  performanceContainer.style.display = 'block';
  inputField.blur();
  inputField.disabled = true;

  const averageWPM = getTrimmedAverageWPM(wpmSamples);
  avgWpmDisplay.textContent = `Average WPM: ${averageWPM}`;

  const durationSeconds = (wpmSamples[wpmSamples.length - 1].time / 1000).toFixed(3);
  durationDisplay.textContent = `Test Duration: ${durationSeconds} second${parseFloat(durationSeconds) !== 1 ? 's' : ''}`;

  while (svg.firstChild) svg.removeChild(svg.firstChild);

  const maxWPM = Math.max(...wpmSamples.map(s => s.wpm));
  const svgWidth = chartContainer.clientWidth || 600;
  const svgHeight = 200;
  svg.setAttribute('width', `${svgWidth}`);
  svg.setAttribute('height', `${svgHeight}`);
  svg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);

  const barWidth = svgWidth / wpmSamples.length;

  const tooltip = document.createElement('div');
  tooltip.id = 'wpmTooltip';
  tooltip.style.position = 'absolute';
  tooltip.style.background = '#222';
  tooltip.style.color = '#0ff';
  tooltip.style.padding = '0.3rem 0.6rem';
  tooltip.style.borderRadius = '5px';
  tooltip.style.fontSize = '0.9rem';
  tooltip.style.display = 'none';
  tooltip.style.pointerEvents = 'none';
  chartContainer.appendChild(tooltip);

  let circle: SVGCircleElement | null = null;

  wpmSamples.forEach((sample, i) => {
    const barHeight = (sample.wpm / maxWPM) * svgHeight;
    const x = i * barWidth;
    const y = svgHeight - barHeight;

    const rect = document.createElementNS(svgNS, 'rect');
    rect.setAttribute('x', `${x}`);
    rect.setAttribute('y', `${y}`);
    rect.setAttribute('width', `${barWidth - 2}`);
    rect.setAttribute('height', `${barHeight}`);
    rect.setAttribute('fill', '#0ff');
    svg.appendChild(rect);
  });

  svg.addEventListener('click', (e) => {
    const rect = svg.getBoundingClientRect();
    const xClick = e.clientX - rect.left;
    const index = Math.floor((xClick / svgWidth) * wpmSamples.length);
    const barX = index * barWidth;
    const barHeight = (wpmSamples[index].wpm / maxWPM) * svgHeight;
    const barY = svgHeight - barHeight;

    if (circle) svg.removeChild(circle);
    circle = document.createElementNS(svgNS, 'circle');
    circle.setAttribute('cx', `${barX + barWidth / 2}`);
    circle.setAttribute('cy', `${barY}`);
    circle.setAttribute('r', '6');
    circle.setAttribute('fill', '#f00');
    svg.appendChild(circle);

    const selectedTime = (wpmSamples[index].time / 1000).toFixed(3);
    tooltip.style.left = `${barX + barWidth / 2}px`;
    tooltip.style.top = `${barY - 30}px`;
    tooltip.textContent = `WPM: ${wpmSamples[index].wpm}, Time: ${selectedTime}s`;
    tooltip.style.display = 'block';
  });
}

function resetTest(): void {
  targetText = getRandomText();
  userInput = '';
  finished = false;
  typingStarted = false;
  wpmSamples = [];
  startTime = 0;
  inputField.value = '';
  inputField.classList.remove('finished');
  inputField.disabled = false;
  inputField.focus();

  renderText();
  wpmDisplay.textContent = 'WPM: 0';
  accuracyDisplay.textContent = 'Accuracy: 100%';
  consistencyDisplay.textContent = 'Consistency: 100%';
  streakDisplay.textContent = `Streak: ${streakCounter}`;
}

function getTrimmedAverageWPM(samples: { time: number; wpm: number }[]): number {
  const filtered = samples
    .filter(s => s.time >= 2000 && s.wpm >= 10 && s.wpm <= 200)
    .map(s => s.wpm);

  if (filtered.length === 0) return 0;

  const sorted = filtered.sort((a, b) => a - b);
  const trimCount = Math.floor(sorted.length * 0.1);
  const trimmed = sorted.slice(trimCount, sorted.length - trimCount);
  const average = trimmed.reduce((a, b) => a + b, 0) / trimmed.length;

  return Math.round(average);
}

function standardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const squareDiffs = values.map(value => Math.pow(value - avg, 2));
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(avgSquareDiff);
}

function countMatchingCharacters(expected: string, typed: string): number {
  let correct = 0;
  const len = Math.min(expected.length, typed.length);
  for (let i = 0; i < len; i++) {
    if (expected[i] === typed[i]) correct++;
  }
  return correct;
}

resetTest();
