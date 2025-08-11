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
let lastSampleTime = 0;

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

function countMatchingCharacters(target: string, input: string): number {
  let count = 0;
  for (let i = 0; i < input.length; i++) {
    if (input[i] === target[i]) count++;
  }
  return count;
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
    confetti.style.left = `${Math.random() * 100}%`;
    confetti.style.background = `hsl(${Math.random() * 360}, 100%, 60%)`;
    confetti.style.animationDelay = `${Math.random() * 0.5}s`;
    confettiContainer.appendChild(confetti);
  }
  document.body.appendChild(confettiContainer);
  setTimeout(() => confettiContainer.remove(), 1800);
}

function updateStats(): void {
  const elapsed = Date.now() - startTime;
  const correctChars = countMatchingCharacters(targetText, userInput);
  const accuracy = Math.round((correctChars / targetText.length) * 100);
  const minutes = elapsed / 60000;
  const wpm = minutes > 0 ? Math.round((correctChars / 5) / minutes) : 0;

  wpmDisplay.textContent = `WPM: ${wpm}`;
  accuracyDisplay.textContent = `Accuracy: ${accuracy}%`;

  if (!finished && typingStarted && elapsed - lastSampleTime >= 1000 && wpm > 0 && wpm <= 200) {
    wpmSamples.push({ time: elapsed, wpm });
    lastSampleTime = elapsed;

    if (wpmSamples.length > 30) {
      wpmSamples.shift();
    }
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

  const durationSeconds = wpmSamples.length
    ? (wpmSamples[wpmSamples.length - 1].time / 1000).toFixed(3)
    : ((Date.now() - startTime) / 1000).toFixed(3);

  durationDisplay.textContent = `Test Duration: ${durationSeconds} second${parseFloat(durationSeconds) !== 1 ? 's' : ''}`;

  while (svg.firstChild) svg.removeChild(svg.firstChild);

  if (wpmSamples.length === 0) return;

  const maxWPM = Math.max(...wpmSamples.map(s => s.wpm));
  const svgWidth = chartContainer.clientWidth || 600;
  const svgHeight = 200;
  svg.setAttribute('width', `${svgWidth}`);
  svg.setAttribute('height', `${svgHeight}`);
  svg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);

  const barWidth = svgWidth / wpmSamples.length;

  const oldTooltip = document.getElementById('wpmTooltip');
  if (oldTooltip) oldTooltip.remove();

  const tooltip = document.createElement('div');
  tooltip.id = 'wpmTooltip';
  tooltip.style.position = 'absolute';
  tooltip.style.background = '#222';
  tooltip.style.color = '#0ff';
  tooltip.style.padding = '0.3rem 0.6rem';
  tooltip.style.borderRadius = '5px';
  tooltip.style.visibility = 'hidden';
  tooltip.style.pointerEvents = 'none';
  tooltip.style.fontSize = '0.9rem';
  tooltip.style.userSelect = 'none';
  tooltip.style.whiteSpace = 'nowrap';

  chartContainer.appendChild(tooltip);

  wpmSamples.forEach((sample, i) => {
    const barHeight = (sample.wpm / maxWPM) * svgHeight;

    const rect = document.createElementNS(svgNS, 'rect');
    rect.setAttribute('x', (i * barWidth).toString());
    rect.setAttribute('y', (svgHeight - barHeight).toString());
    rect.setAttribute('width', `${barWidth - 2}`);
    rect.setAttribute('height', barHeight.toString());
    rect.setAttribute('fill', '#0ff');
    rect.style.transition = 'fill 0.3s ease';

    rect.addEventListener('mouseenter', (event) => {
      tooltip.textContent = `WPM: ${sample.wpm} at ${(sample.time / 1000).toFixed(1)}s`;
      tooltip.style.left = `${(event.clientX - chartContainer.getBoundingClientRect().left + 10)}px`;
      tooltip.style.top = `${(event.clientY - chartContainer.getBoundingClientRect().top - 40)}px`;
      tooltip.style.visibility = 'visible';
    });

    rect.addEventListener('mouseleave', () => {
      tooltip.style.visibility = 'hidden';
    });

    svg.appendChild(rect);
  });
}

function resetTest(): void {
  targetText = getRandomText();
  userInput = '';
  inputField.value = '';
  finished = false;
  typingStarted = false;
  wpmSamples = [];
  lastSampleTime = 0;
  streakDisplay.textContent = `Streak: ${streakCounter}`;
  inputField.disabled = false;
  inputField.classList.remove('finished');
  renderText();
  wpmDisplay.textContent = 'WPM: 0';
  accuracyDisplay.textContent = 'Accuracy: 0%';
  consistencyDisplay.textContent = 'Consistency: 0%';
  inputField.focus();
}

function getTrimmedAverageWPM(samples: { time: number; wpm: number }[]): number {
  if (samples.length === 0) return 0;
  const sorted = [...samples].sort((a, b) => a.wpm - b.wpm);
  const trimCount = Math.floor(samples.length * 0.2);
  const trimmed = sorted.slice(trimCount, samples.length - trimCount);
  const sum = trimmed.reduce((acc, cur) => acc + cur.wpm, 0);
  return Math.round(sum / trimmed.length);
}

function standardDeviation(arr: number[]): number {
  if (arr.length === 0) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const variance = arr.reduce((a, b) => a + (b - mean) ** 2, 0) / arr.length;
  return Math.sqrt(variance);
}

resetTest();
