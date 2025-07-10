import { wordList } from './data/wordList';
export function getRandomChunk(min, max) {
    const chunkSize = Math.floor(Math.random() * (max - min + 1)) + min;
    const words = [];
    for (let i = 0; i < chunkSize; i++) {
        const randomWord = wordList[Math.floor(Math.random() * wordList.length)];
        words.push(randomWord);
    }
    return words.join(' ');
}
