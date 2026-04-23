let dialogues = [];
let rawLines = [];
let episodeMap = {};
let currentQuestion = null;
let streak = 0;
let bestStreak = 0;
let totalAnswered = 0;
let difficulty = 'easy';
let selectedCharacters = new Set();
let allCharacters = [];
let hintUsed = false;
let answered = false;

const DIFFICULTY_CONFIG = {
   easy: { options: 4, minLen: 4, maxLen: 30, sameSpeaker: true },
   medium: { options: 4, minLen: 3, maxLen: 50, sameSpeaker: false },
   hard: { options: 4, minLen: 2, maxLen: 999, sameSpeaker: false }
};

function toggleSearch() {
   const area = document.getElementById('searchArea');
   const arrow = document.getElementById('searchArrow');
   const isOpen = area.style.display !== 'none';
   area.style.display = isOpen ? 'none' : '';
   arrow.classList.toggle('open', !isOpen);
}

async function loadScript() {
   const overlay = document.getElementById('loadingOverlay');
   overlay.style.display = 'flex';

   try {
       const response = await fetch('documents/武林外传剧本全.md');
       if (!response.ok) throw new Error('剧本加载失败');
       const text = await response.text();
       rawLines = text.split('\n');
       buildEpisodeMap();
       parseScript();
       extractCharacters();
       renderCharacterTags();
       nextQuestion();
   } catch (error) {
       console.error('加载剧本失败:', error);
       document.querySelector('.loading-text').textContent = '加载失败，请刷新重试';
   } finally {
       overlay.style.display = 'none';
   }
}


function buildEpisodeMap() {
   episodeMap = {};
   let currentEpisode = '未知回目';

   for (let i = 0; i < rawLines.length; i++) {
       const line = rawLines[i].trim();

       const headingMatch = line.match(/^#\s*第(\d+)回\s*(.*)/);
       if (headingMatch) {
           const num = parseInt(headingMatch[1]);
           const title = headingMatch[2].trim();
           currentEpisode = title ? `第${num}回 ${title}` : `第${num}回`;
       }

       episodeMap[i] = currentEpisode;
   }
}

function parseScript() {
   dialogues = [];

   for (let i = 0; i < rawLines.length; i++) {
       const line = rawLines[i].trim();
       if (!line) continue;

       const match = line.match(/^([^（(：:]{1,10})(?:[（(]([^）)]*)[）)])?[：:](.+)$/);
       if (match) {
           const speaker = match[1].trim();
           const stageDir = match[2] ? match[2].trim() : '';
           const content = match[3].trim();

           if (content.length < 2) continue;
           if (/^[（(]/.test(content) && content.length < 5) continue;
           if (/^[\s\d\-—…]+$/.test(content)) continue;

           dialogues.push({
               speaker,
               stageDirection: stageDir,
               content,
               lineIndex: i,
               episode: episodeMap[i] || '未知回目'
           });
       }
   }
}

function extractCharacters() {
   const counts = {};
   dialogues.forEach(d => {
       counts[d.speaker] = (counts[d.speaker] || 0) + 1;
   });
   allCharacters = Object.entries(counts)
       .filter(([_, count]) => count >= 20)
       .sort((a, b) => b[1] - a[1])
       .map(([name]) => name);
}

function renderCharacterTags() {
   const container = document.getElementById('characterTags');

   let html = '<button class="char-tag active" data-char="all" onclick="toggleCharacterFilter(\'all\', this)">全部</button>';
   allCharacters.forEach(char => {
       html += `<button class="char-tag" data-char="${char}" onclick="toggleCharacterFilter('${char}', this)">${char}</button>`;
   });
   container.innerHTML = html;
}

function toggleCharacterFilter(char, btn) {
   const tags = document.querySelectorAll('.char-tag');

   if (char === 'all') {
       selectedCharacters.clear();
       tags.forEach(t => t.classList.remove('active'));
       btn.classList.add('active');
   } else {
       const allBtn = document.querySelector('.char-tag[data-char="all"]');
       allBtn.classList.remove('active');

       if (selectedCharacters.has(char)) {
           selectedCharacters.delete(char);
           btn.classList.remove('active');
           if (selectedCharacters.size === 0) {
               allBtn.classList.add('active');
           }
       } else {
           selectedCharacters.add(char);
           btn.classList.add('active');
       }
   }
}

function setDifficulty(d) {
   difficulty = d;
   document.querySelectorAll('.difficulty-btn').forEach(btn => {
       btn.classList.toggle('active', btn.dataset.difficulty === d);
   });
   nextQuestion();
}

function getFilteredDialogues() {
   let filtered = dialogues;

   if (selectedCharacters.size > 0) {
       filtered = filtered.filter(d => selectedCharacters.has(d.speaker));
   }

   const config = DIFFICULTY_CONFIG[difficulty];
   filtered = filtered.filter(d => d.content.length >= config.minLen && d.content.length <= config.maxLen);

   return filtered;
}

function generateQuestion() {
   const config = DIFFICULTY_CONFIG[difficulty];
   const filtered = getFilteredDialogues();

   if (filtered.length < 5) return null;

   let attempts = 0;
   while (attempts < 50) {
       attempts++;
       const idx = Math.floor(Math.random() * (filtered.length - 1));
       const current = filtered[idx];

       const nextIdx = dialogues.indexOf(current) + 1;
       if (nextIdx >= dialogues.length) continue;
       const nextLine = dialogues[nextIdx];

       if (!nextLine || nextLine.content.length < 2) continue;

       let candidatePool;
       if (config.sameSpeaker) {
           candidatePool = filtered.filter(d =>
               d.speaker === nextLine.speaker &&
               d.content !== nextLine.content &&
               d.content.length >= 2
           );
       } else {
           candidatePool = filtered.filter(d =>
               d.content !== nextLine.content &&
               d.content.length >= 2
           );
       }

       if (candidatePool.length < config.options - 1) continue;

       const wrongOptions = [];
       const usedContents = new Set([nextLine.content]);
       const shuffledPool = candidatePool.sort(() => Math.random() - 0.5);

       for (const candidate of shuffledPool) {
           if (wrongOptions.length >= config.options - 1) break;
           if (!usedContents.has(candidate.content)) {
               wrongOptions.push(candidate);
               usedContents.add(candidate.content);
           }
       }

       if (wrongOptions.length < config.options - 1) continue;

       const options = [nextLine, ...wrongOptions].sort(() => Math.random() - 0.5);

       return {
           speaker: current.speaker,
           quote: current.content,
           stageDirection: current.stageDirection,
           lineIndex: current.lineIndex,
           episode: current.episode,
           correctAnswer: nextLine.content,
           nextSpeaker: nextLine.speaker,
           nextLineIndex: nextLine.lineIndex,
           options: options.map(o => ({
               speaker: o.speaker,
               content: o.content
           })),
           correctIndex: options.indexOf(nextLine)
       };
   }

   return null;
}

function getContextLines(centerLineIndex, radius) {
   const start = Math.max(0, centerLineIndex - radius);
   const end = Math.min(rawLines.length - 1, centerLineIndex + radius);
   const lines = [];

   for (let i = start; i <= end; i++) {
       const text = rawLines[i].trim();
       if (!text) continue;
       lines.push({
           text,
           lineIndex: i,
           isCurrent: i === centerLineIndex,
           isNext: false
       });
   }

   return lines;
}

function renderContext(centerLineIndex, nextLineIndex) {
   const radius = 3;
   const start = Math.max(0, centerLineIndex - radius);
   const end = Math.min(rawLines.length - 1, nextLineIndex + radius);
   const container = document.getElementById('contextLines');
   const episode = episodeMap[centerLineIndex] || '未知回目';

   let html = '';
   for (let i = start; i <= end; i++) {
       const text = rawLines[i].trim();
       if (!text) continue;

       let cls = 'context-line';
       if (i === centerLineIndex) cls += ' highlight';
       else if (i === nextLineIndex) cls += ' next-highlight';

       const speakerMatch = text.match(/^([^（(：:]{1,10})(?:[（(]([^）)]*)[）)])?[：:](.+)$/);
       let displayText;
       if (speakerMatch) {
           const sp = speakerMatch[1].trim();
           const sd = speakerMatch[2] ? `（${speakerMatch[2].trim()}）` : '';
           const ct = speakerMatch[3].trim();
           displayText = `<span class="context-speaker">${sp}</span>${sd}：${ct}`;
       } else {
           displayText = text;
       }

       html += `<div class="${cls}">${displayText}</div>`;
   }

   html += `<div class="context-episode">—— ${episode}</div>`;
   container.innerHTML = html;
}

function nextQuestion() {
   answered = false;
   hintUsed = false;

   const question = generateQuestion();
   if (!question) {
       document.getElementById('quoteText').textContent = '没有足够的台词生成题目，请调整筛选条件';
       document.getElementById('speaker').textContent = '';
       document.getElementById('optionsContainer').innerHTML = '';
       document.getElementById('nextBtn').disabled = true;
       return;
   }

   currentQuestion = question;

   document.getElementById('speaker').textContent = question.speaker + (question.stageDirection ? `（${question.stageDirection}）` : '');
   document.getElementById('quoteText').textContent = question.quote;

   const quoteCard = document.getElementById('quoteCard');
   quoteCard.classList.remove('correct', 'wrong');

   const feedback = document.getElementById('resultFeedback');
   feedback.style.display = 'none';
   feedback.classList.remove('correct-feedback', 'wrong-feedback');
   document.getElementById('contextBlock').style.display = 'none';

   renderOptions(question.options);

   document.getElementById('nextBtn').disabled = true;
   document.getElementById('hintBtn').disabled = false;
}

function renderOptions(options) {
   const container = document.getElementById('optionsContainer');
   const labels = ['A', 'B', 'C', 'D'];

   container.innerHTML = options.map((opt, i) => `
       <button class="option-btn" data-index="${i}" onclick="selectAnswer(${i})">
           <span class="option-label">${labels[i]}</span>
           <span class="option-text"><span class="option-speaker">${opt.speaker}：</span>${opt.content}</span>
       </button>
   `).join('');
}

function selectAnswer(index) {
   if (answered) return;
   answered = true;

   const isCorrect = index === currentQuestion.correctIndex;
   const buttons = document.querySelectorAll('.option-btn');

   buttons.forEach((btn, i) => {
       btn.disabled = true;
       if (i === currentQuestion.correctIndex) {
           btn.classList.add('correct');
       }
       if (i === index && !isCorrect) {
           btn.classList.add('wrong');
       }
   });

   const quoteCard = document.getElementById('quoteCard');
   const feedback = document.getElementById('resultFeedback');

   if (isCorrect) {
       streak++;
       if (streak > bestStreak) bestStreak = streak;
       quoteCard.classList.add('correct');
       feedback.classList.add('correct-feedback');
       feedback.querySelector('.feedback-icon').textContent = '✅';
       feedback.querySelector('.feedback-answer').textContent = '接上了！';
   } else {
       streak = 0;
       quoteCard.classList.add('wrong');
       feedback.classList.add('wrong-feedback');
       feedback.querySelector('.feedback-icon').textContent = '❌';
       feedback.querySelector('.feedback-answer').textContent =
           `正确答案：${currentQuestion.nextSpeaker}：${currentQuestion.correctAnswer}`;
   }

   const contextBlock = document.getElementById('contextBlock');
   contextBlock.style.display = 'block';
   renderContext(currentQuestion.lineIndex, currentQuestion.nextLineIndex);

   feedback.style.display = 'block';
   totalAnswered++;

   document.getElementById('streak').textContent = streak;
   document.getElementById('bestStreak').textContent = bestStreak;
   document.getElementById('totalAnswered').textContent = totalAnswered;
   document.getElementById('nextBtn').disabled = false;
   document.getElementById('hintBtn').disabled = true;
}

function showHint() {
   if (answered || !currentQuestion) return;
   hintUsed = true;

   const buttons = document.querySelectorAll('.option-btn');
   const wrongIndices = [];

   buttons.forEach((btn, i) => {
       if (i !== currentQuestion.correctIndex) {
           wrongIndices.push(i);
       }
   });

   const toEliminate = wrongIndices.sort(() => Math.random() - 0.5).slice(0, 2);
   toEliminate.forEach(i => {
       buttons[i].classList.add('hint-eliminated');
   });

   document.getElementById('hintBtn').disabled = true;
}

function resetGame() {
   streak = 0;
   bestStreak = 0;
   totalAnswered = 0;
   document.getElementById('streak').textContent = '0';
   document.getElementById('bestStreak').textContent = '0';
   document.getElementById('totalAnswered').textContent = '0';
   nextQuestion();
}

let allSearchResults = [];
let displayedCount = 0;
const SEARCH_BATCH_SIZE = 20;
let episodeList = [];
let currentSearchKeyword = '';

function toggleSearch() {
   const area = document.getElementById('searchArea');
   const arrow = document.getElementById('searchArrow');
   const isOpen = area.style.display !== 'none';
   area.style.display = isOpen ? 'none' : '';
   arrow.classList.toggle('open', !isOpen);
   if (!isOpen && episodeList.length === 0) {
       buildEpisodeList();
   }
}

function buildEpisodeList() {
   const seen = new Set();
   episodeList = [];
   for (let i = 0; i < rawLines.length; i++) {
       const ep = episodeMap[i];
       if (ep && ep !== '未知回目' && !seen.has(ep)) {
           seen.add(ep);
           episodeList.push(ep);
       }
   }
   const select = document.getElementById('episodeSelect');
   if (!select) return;
   select.innerHTML = '<option value="">全部回目</option>';
   episodeList.forEach(ep => {
       const opt = document.createElement('option');
       opt.value = ep;
       opt.textContent = ep;
       select.appendChild(opt);
   });
}

function searchQuote() {
   const input = document.getElementById('searchInput');
   const keyword = input.value.trim();
   const clearBtn = document.getElementById('searchClearBtn');
   const resultsContainer = document.getElementById('searchResults');

   clearBtn.style.display = keyword ? 'flex' : 'none';
   currentSearchKeyword = keyword;

   if (!keyword) {
       allSearchResults = [];
       displayedCount = 0;
       const episodeSelect = document.getElementById('episodeSelect');
       if (episodeSelect) episodeSelect.value = '';
       resultsContainer.innerHTML = '<div class="search-empty">输入关键词开始搜索</div>';
       return;
   }

   if (dialogues.length === 0) {
       resultsContainer.innerHTML = '<div class="search-empty">剧本尚未加载完成</div>';
       return;
   }

   allSearchResults = [];
   for (let i = 0; i < dialogues.length; i++) {
       const d = dialogues[i];
       if (d.content.includes(keyword)) {
           const nextDialogue = (i + 1 < dialogues.length) ? dialogues[i + 1] : null;
           allSearchResults.push({
               current: d,
               next: nextDialogue,
               currentIndex: i
           });
       }
   }

   displayedCount = 0;
   const episodeSelect = document.getElementById('episodeSelect');
   if (episodeSelect) episodeSelect.value = '';
   renderSearchBatch();
}

function filterByEpisode(episodeName) {
   const resultsContainer = document.getElementById('searchResults');
   const keyword = currentSearchKeyword;

   if (!episodeName) {
       if (!keyword) {
           allSearchResults = [];
           displayedCount = 0;
           resultsContainer.innerHTML = '<div class="search-empty">输入关键词开始搜索</div>';
           return;
       }
       searchQuote();
       return;
   }

   if (dialogues.length === 0) {
       resultsContainer.innerHTML = '<div class="search-empty">剧本尚未加载完成</div>';
       return;
   }

   allSearchResults = [];
   for (let i = 0; i < dialogues.length; i++) {
       const d = dialogues[i];
       if (d.episode === episodeName) {
           if (!keyword || d.content.includes(keyword)) {
               const nextDialogue = (i + 1 < dialogues.length) ? dialogues[i + 1] : null;
               allSearchResults.push({
                   current: d,
                   next: nextDialogue,
                   currentIndex: i
               });
           }
       }
   }

   displayedCount = 0;
   renderSearchBatch();
}

function renderSearchBatch() {
   const resultsContainer = document.getElementById('searchResults');
   const keyword = currentSearchKeyword;

   if (allSearchResults.length === 0) {
       resultsContainer.innerHTML = '<div class="search-empty">没有找到匹配的台词</div>';
       return;
   }

   const end = Math.min(displayedCount + SEARCH_BATCH_SIZE, allSearchResults.length);
   const batch = allSearchResults.slice(displayedCount, end);

   let html = '';
   if (displayedCount === 0) {
       html += `<div class="search-count">共找到 ${allSearchResults.length} 条结果</div>`;
   }

   batch.forEach(r => {
       const cur = r.current;
       const nxt = r.next;
       const episode = cur.episode;

       const highlightedContent = highlightKeyword(cur.content, keyword);

       html += `<div class="search-result-card">`;

       html += `<div class="result-match-line">
           <span class="result-speaker">${cur.speaker}</span>${cur.stageDirection ? '（' + cur.stageDirection + '）' : ''}：${highlightedContent}
       </div>`;

       if (nxt) {
           html += `<div class="result-next-line">
               <div class="result-next-label">↓ 下一句</div>
               <span class="result-speaker">${nxt.speaker}</span>${nxt.stageDirection ? '（' + nxt.stageDirection + '）' : ''}：${nxt.content}
           </div>`;
       }

       html += buildSearchContext(cur.lineIndex, nxt ? nxt.lineIndex : cur.lineIndex, keyword);

       html += `<div class="result-source">出处：${episode}</div>`;
       html += `</div>`;
   });

   if (displayedCount === 0) {
       resultsContainer.innerHTML = html;
   } else {
       const countEl = resultsContainer.querySelector('.search-count');
       const loadMoreEl = resultsContainer.querySelector('.load-more-btn');
       if (loadMoreEl) loadMoreEl.remove();
       resultsContainer.insertAdjacentHTML('beforeend', html);
   }

   displayedCount = end;

   if (displayedCount < allSearchResults.length) {
       const loadMoreHtml = `<button class="game-btn secondary-btn load-more-btn" onclick="loadMoreResults()">加载更多（${displayedCount}/${allSearchResults.length}）</button>`;
       resultsContainer.insertAdjacentHTML('beforeend', loadMoreHtml);
   }
}

function loadMoreResults() {
   renderSearchBatch();
}

function buildSearchContext(currentLineIndex, nextLineIndex, keyword) {
   const radius = 2;
   const start = Math.max(0, currentLineIndex - radius);
   const end = Math.min(rawLines.length - 1, nextLineIndex + radius);

   let html = '<div class="result-context">';
   for (let i = start; i <= end; i++) {
       const text = rawLines[i].trim();
       if (!text) continue;

       let cls = 'ctx-line';
       if (i === currentLineIndex) cls += ' ctx-current';
       else if (i === nextLineIndex) cls += ' ctx-next';

       const speakerMatch = text.match(/^([^（(：:]{1,10})(?:[（(]([^）)]*)[）)])?[：:](.+)$/);
       let displayText;
       if (speakerMatch) {
           const sp = speakerMatch[1].trim();
           const sd = speakerMatch[2] ? `（${speakerMatch[2].trim()}）` : '';
           const ct = speakerMatch[3].trim();
           displayText = `<span class="result-speaker">${sp}</span>${sd}：${ct}`;
       } else {
           displayText = text;
       }

       html += `<div class="${cls}">${displayText}</div>`;
   }
   html += '</div>';
   return html;
}

function highlightKeyword(text, keyword) {
   if (!keyword) return text;
   const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
   return text.replace(new RegExp(escaped, 'g'), `<span class="search-keyword">${keyword}</span>`);
}

function clearSearch() {
   document.getElementById('searchInput').value = '';
   document.getElementById('searchClearBtn').style.display = 'none';
   const episodeSelect = document.getElementById('episodeSelect');
   if (episodeSelect) episodeSelect.value = '';
   allSearchResults = [];
   displayedCount = 0;
   currentSearchKeyword = '';
   document.getElementById('searchResults').innerHTML = '<div class="search-empty">输入关键词开始搜索</div>';
}

document.addEventListener('DOMContentLoaded', loadScript);
