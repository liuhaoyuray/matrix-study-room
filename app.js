/* Matrix Study Room — buildless, offline-capable personal learning space. */
(() => {
  'use strict';
  const D = window.MATRIX_DATA;
  if (!D) { document.getElementById('main').textContent = '课程数据未加载，请重新打开完整的平台文件夹。'; return; }
  const KEY = 'matrix-study-room-v1';
  const defaults = () => ({ done: [], attempts: {}, notes: {}, custom: [], last: 'b01' });
  let state;
  try { state = { ...defaults(), ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { state = defaults(); }
  if (!Array.isArray(state.done)) state.done = [];
  if (!Array.isArray(state.custom)) state.custom = [];
  if (!state.attempts || typeof state.attempts !== 'object') state.attempts = {};
  if (!state.notes || typeof state.notes !== 'object') state.notes = {};
  const main = document.getElementById('main');
  const nav = [['home','学习台','home'],['chapters','章节学习','book'],['practice','题目练习','pen'],['wrong','错题回顾','repeat'],['chaoxing','学习通测验','check'],['sources','资料架','folder']];
  const chapters = D.chapters;
  const hasAnswer = q => Number.isInteger(q.answer) || (Array.isArray(q.answer) && q.answer.length > 0);
  const sourceNames = { original: '配套练习', ppt: 'PPT 例题 / 改编', past: '往年题 / 改编', chaoxing: '学习通原题' };
  const icons = {
    home:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    book:'<path d="M12 6c-3-3-7-3-10-2v15c4-1 7-1 10 2 3-3 6-3 10-2V4c-3-1-7-1-10 2Z"/><path d="M12 6v15"/>',
    pen:'<path d="m16 3 5 5-12 12-6 1 1-6Z"/><path d="m13 6 5 5"/>',
    repeat:'<path d="M20 8a8 8 0 0 0-14-3L3 8m0-5v5h5M4 16a8 8 0 0 0 14 3l3-3m0 5v-5h-5"/>',
    check:'<rect x="4" y="3" width="16" height="19" rx="2"/><path d="m8 12 3 3 5-6M8 5h8"/>',
    folder:'<path d="M3 7V4h7l2 3h9v13H3Z"/><path d="M3 7h18"/>'
  };
  const icon = name => `<svg class="nav-icon" viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.book}</svg>`;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const plain = s => String(s || '').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ');
  const lesson = id => D.lessons.find(l => l.id === id);
  const chapter = id => chapters.find(c => c.id === id);
  const questions = () => [...D.lessons.flatMap(l => l.questions.map(q => ({ ...q, lessonId: l.id, chapter: l.chapter }))), ...(D.chaoxing.questions || []), ...state.custom];
  const getQuestion = id => questions().find(q => q.id === id);
  const wrongQuestions = () => questions().filter(q => state.attempts[q.id]?.correct === false);
  const doneCount = () => D.lessons.filter(l => state.done.includes(l.id)).length;
  const nextLesson = () => lesson(state.last) && !state.done.includes(state.last) ? lesson(state.last) : D.lessons.find(l => !state.done.includes(l.id)) || D.lessons[0];
  let toastTimer;
  const toast = text => { const el = document.getElementById('toast'); el.textContent = text; el.classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('visible'), 3300); };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { toast('浏览器未能保存记录，请及时导出备份。'); } };
  function math(el = main) {
    if (window.renderMathInElement) window.renderMathInElement(el, { delimiters: [{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false},{left:'\\[',right:'\\]',display:true},{left:'\\(',right:'\\)',display:false}], throwOnError:false, trust:false, strict:'ignore' });
  }
  function updateSidebar(page) {
    document.getElementById('main-nav').innerHTML = nav.map(([id,title,ic]) => `<a class="nav-link ${page === id ? 'active' : ''}" href="#${id}">${icon(ic)}<span>${title}</span>${id === 'wrong' && wrongQuestions().length ? `<span class="nav-badge">${wrongQuestions().length}</span>` : ''}</a>`).join('');
    document.getElementById('side-chapters').innerHTML = chapters.map((c,i) => `<a class="chapter-link" href="#chapters/${c.id}"><span class="chapter-dot">${String(i).padStart(2,'0')}</span>${esc(c.title)}</a>`).join('');
    const n = doneCount();
    document.getElementById('side-progress-text').textContent = `${n} / ${D.lessons.length}`;
    document.getElementById('side-progress-bar').style.width = `${n / Math.max(1,D.lessons.length) * 100}%`;
    document.getElementById('breadcrumb').textContent = page === 'lesson' ? '章节学习 / 正在学习' : nav.find(v => v[0] === page)?.[1] || '搜索课程';
  }
  function heading(title, sub, action = '', eyebrow = 'MATRIX THEORY · LEARNING SPACE') {
    return `<div class="page-heading"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1><p>${sub}</p></div>${action}</div>`;
  }
  function sourceButton(ref, label) {
    if (!ref?.file) return '';
    const source = D.sources.find(s => s.file.replace(/\\/g,'/') === ref.file.replace(/\\/g,'/'));
    if (!source) return `<span class="muted">${esc(ref.label || '来源待补')}</span>`;
    return `<button class="source-link" data-source="${esc(source.id)}" data-page="${Number(ref.page) || 1}">${esc(label || ref.label || source.title)} <span class="muted">· ${source.format==='image'?'原题截图':`PDF 第 ${Number(ref.page) || 1} 页`} ↗</span></button>`;
  }
  function lessonTile(l) {
    const done = state.done.includes(l.id);
    return `<a class="lesson-tile" href="#lesson/${l.id}"><div class="tile-top"><span class="tiny-label">${esc(l.id.toUpperCase())}</span><span class="tag ${done ? '' : 'amber'}">${done ? '已学过 ✓' : `${l.minutes} 分钟`}</span></div><h3>${esc(l.title)}</h3><p>${esc(l.summary)}</p><div class="tile-bottom"><span>${l.questions.length} 道随堂练习</span><span>${done ? '再看一遍' : '进入学习'} →</span></div></a>`;
  }
  function home() {
    const l = nextLesson();
    const n = doneCount();
    const date = new Date().toLocaleDateString('zh-CN',{timeZone:'Asia/Shanghai',month:'long',day:'numeric',weekday:'long'});
    const xxtCount = questions().filter(q => q.source?.kind === 'chaoxing').length;
    return `${heading('慢慢捡起来，也能学明白。','从够用的线代基础出发，每一小节都连接到一道题。',`<div class="date-note">${date}<small>今天也只需要前进一小步</small></div>`)}
    <section class="hero"><div><div class="tiny-label">YOUR NEXT SMALL STEP · 下一小步</div><h2>${n ? esc(l.title) : '先把一个方程，<br>完整地解出来。'}</h2><p>${esc(l.summary)} 不急着追完整章，先学懂这一节。</p><div class="hero-actions"><a class="button light" href="#lesson/${l.id}">${n ? '继续学习' : '开始第一小节'} <span>↗</span></a><a class="button ghost" href="#chapters">看看完整路线 →</a></div></div><div class="hero-art" aria-label="矩阵表示多元方程"><div class="art-label">A x = b</div><div class="hero-matrix"><span>1</span><span>0</span><span>1</span><span>0</span><span>1</span><span>1</span></div><div class="art-formula">x₁ + x₃ = b₁</div><div class="art-caption">把抽象的符号，连回具体的运算</div></div></section>
    <div class="metric-row">${[[icon('book'),n,`/ ${D.lessons.length}`,'已学小节'],[icon('pen'),questions().length,'题','可练习题目'],[icon('check'),xxtCount,'题','学习通原题'],[icon('repeat'),wrongQuestions().length,'题','待回顾错题']].map(([ic,num,unit,label]) => `<div class="metric"><div class="metric-icon">${ic}</div><div><strong>${num}<small>${unit}</small></strong><p>${label}</p></div></div>`).join('')}</div>
    <div class="two-columns"><section><div class="section-heading"><h2>这学期，沿着这条路走<small>先补基础，再串题型</small></h2><a href="#chapters">全部小节 ↗</a></div><div class="path-list">${chapters.map((c,i) => {const ls=D.lessons.filter(v=>v.chapter===c.id),k=ls.filter(v=>state.done.includes(v.id)).length;return `<a class="path-card ${c.id===l.chapter?'current':''}" href="#chapters/${c.id}"><div class="path-no">${String(i).padStart(2,'0')}</div><div class="path-info"><h3>${esc(c.title)} ${c.id===l.chapter?'<span class="tag">当前起点</span>':''}</h3><p>${esc(c.description)}</p><div class="progress-track"><div style="width:${k/Math.max(1,ls.length)*100}%"></div></div></div><div class="path-meta">${k} / ${ls.length} 小节<span class="arrow">↗</span></div></a>`;}).join('')}</div></section>
    <aside><section class="side-panel"><div class="section-heading"><h3>今天，学这些就够了</h3><span class="tag amber">约 30 分钟</span></div><div class="task-item"><span class="task-circle ${state.done.includes(l.id)?'done':''}">${state.done.includes(l.id)?'✓':''}</span><div>弄懂：${esc(l.title)}<small>先看具体例子，再读定义</small></div></div><div class="task-item"><span class="task-circle"></span><div>独立做 ${l.questions.length} 道随堂练习<small>答案与解析先藏起来，做完再看</small></div></div><div class="task-item"><span class="task-circle"></span><div>写一句自己的理解<small>留给明天的你，不用写漂亮笔记</small></div></div><a class="button outline small" href="#lesson/${l.id}" style="margin-top:15px">打开今天的小节 →</a></section>
    <section class="side-panel"><div class="section-heading"><h3>学的每一点，都有去处</h3>${icon('folder')}</div><p>课件看概念，例题看步骤，章节测验查缺口，往年题认识期末问法。</p><div class="source-pills"><span class="tag">PPT 例题</span><span class="tag amber">往年期末</span><span class="tag blue">学习通测验</span></div><div class="notice">期末闭卷 80% · 视频及作业 20%<br>练习记录与学习通正式成绩各自保存。</div><a class="text-button" href="#sources" style="display:inline-block;margin-top:13px">查看原始资料与来源 ↗</a></section></aside></div>
    <section class="experiment"><div class="section-heading"><h2>动一下，就更好懂了<small>同一个结果，可以有不同的输入</small></h2><span class="tag">矩阵小实验</span></div><div class="experiment-grid"><div class="equation">$A=\\begin{pmatrix}1&0&1\\\\0&1&1\\end{pmatrix}$，$x=\\begin{pmatrix}4-t\\\\5-t\\\\t\\end{pmatrix}$</div><div class="slider-wrap"><label for="parameter">拖动自由变量 t <strong id="parameter-value">t = 0</strong></label><input type="range" id="parameter" min="-4" max="7" value="0" step="1"></div><div id="parameter-result" class="equation">x = (4, 5, 0)ᵀ<br><strong>Ax = (4, 5)ᵀ</strong></div></div><p class="experiment-note">t 改变了，Ax 没变。这就是自由变量；后面求零空间、求全部解时，还会遇见它。</p></section>`;
  }
  function chapterPage(selected) {
    const list = selected ? chapters.filter(c=>c.id===selected) : chapters;
    return `${heading('按自己的节奏，把知识连起来。','每一节：概念直觉 → 完整例题 → 对应题型 → 独立练习。')}<div class="filters"><a class="filter-pill ${!selected?'active':''}" href="#chapters">全部章节</a>${chapters.map(c=>`<a class="filter-pill ${selected===c.id?'active':''}" href="#chapters/${c.id}">${esc(c.short)}</a>`).join('')}</div>${list.map((c) => `<section class="module-block"><div class="module-title"><span class="path-no">${String(chapters.indexOf(c)).padStart(2,'0')}</span><div><h2>${esc(c.title)}</h2><p>${esc(c.description)}</p></div></div><div class="lesson-grid">${D.lessons.filter(l=>l.chapter===c.id).map(lessonTile).join('')}</div></section>`).join('')}`;
  }
  function questionCard(q, index) {
    const attempt = state.attempts[q.id];
    const kind = q.source?.kind || 'original';
    const multiple = Array.isArray(q.options) && q.options.length > 1;
    const many = q.type === 'multiple';
    return `<article class="question-card" data-question="${esc(q.id)}"><div class="question-top"><div class="tag-group"><span class="tag ${kind==='past'?'amber':kind==='chaoxing'?'blue':''}">${esc(sourceNames[kind] || kind)}</span><span class="tag">${multiple?(many?'多选题':'选择 / 判断'):'书面练习'}</span></div><span class="tiny-label">${index ? String(index).padStart(2,'0') : ''}${attempt ? (attempt.correct?(attempt.selfRated?' · 已理解':' · 已答对'):' · 待回顾') : ''}</span></div><div class="question-prompt">${esc(q.prompt)}</div>${multiple ? q.options.map((o,i)=>`<label class="question-option"><input type="${many?'checkbox':'radio'}" name="q-${esc(q.id)}" value="${i}"><span class="option-letter">${String.fromCharCode(65+i)}</span><span>${esc(o)}</span></label>`).join('') : `<textarea class="short-answer" aria-label="你的解题过程" placeholder="先自己写关键步骤，或在纸上完成后再展开解析。"></textarea>`}<div class="question-actions">${multiple && hasAnswer(q) ? '<button class="button small" data-action="check">提交这道练习</button>' : ''}<button class="button outline small" data-action="explain">${hasAnswer(q)||q.explanation?'查看解析':'记录我的复习情况'}</button></div><div class="question-feedback" hidden></div><div class="question-origin"><span>${esc(q.source?.label || '配套练习')}</span>${q.source?.file ? sourceButton(q.source,'查看原文') : ''}${q.lessonId ? `<a href="#lesson/${esc(q.lessonId)}">返回知识点 ↗</a>`:''}</div></article>`;
  }
  function lessonPage(id) {
    const l = lesson(id);
    if (!l) return `<div class="empty-state"><h3>没有找到这一小节</h3><a href="#chapters" class="button">返回章节</a></div>`;
    state.last = l.id; save();
    const next = D.lessons[D.lessons.indexOf(l)+1];
    const related=(D.chaoxing.questions||[]).filter(q=>q.lessonId===l.id);
    return `<a class="back-link" href="#chapters/${l.chapter}">← ${esc(chapter(l.chapter)?.title || '章节学习')}</a><div class="lesson-layout"><div><article class="lesson-paper"><div class="eyebrow">${esc(l.id.toUpperCase())} · ${l.minutes} MIN · ONE SMALL STEP</div><h1>${esc(l.title)}</h1><p class="lesson-subtitle">${esc(l.summary)}</p><div class="lesson-body">${l.body}</div><div class="exam-callout"><strong>学到这里，能做什么题？</strong>${esc(l.examConnection)}</div><div class="form-row"><label for="lesson-note">用自己的话，留一句理解或疑问</label><textarea id="lesson-note" data-lesson="${l.id}" placeholder="例如：求核就是解 Ax=0，不能把核的基和像的基混在一起。">${esc(state.notes[l.id] || '')}</textarea><p class="form-help">自动保存在这个浏览器；也可以用左侧「备份学习记录」导出。</p></div><div class="lesson-bottom"><button class="button" data-complete="${l.id}">${state.done.includes(l.id)?'已学过 ✓ · 再点可取消':'这一节，我学过了 ✓'}</button>${next?`<a class="button outline" href="#lesson/${next.id}">下一小节 →</a>`:'<a class="button outline" href="#practice">做一组练习 →</a>'}</div></article><section class="question-area"><div class="section-heading"><h2>现在，自己动手<small>先做，再展开解析</small></h2></div>${l.questions.map((q,i)=>questionCard({...q,lessonId:l.id,chapter:l.chapter},i+1)).join('')}</section>${related.length?`<section class="question-area"><div class="section-heading"><h2>这个知识点，学习通也在问<small>${related.length}道对应原题</small></h2><a href="#practice?kind=chaoxing&lesson=${l.id}">查看全部 ↗</a></div>${related.slice(0,2).map((q,i)=>questionCard(q,i+1)).join('')}</section>`:''}</div><aside class="lesson-aside"><section class="side-panel"><div class="tiny-label">这一节的前置知识</div>${(l.prerequisites || []).filter(p=>lesson(p)).map(p=>`<a class="prereq-link" href="#lesson/${p}">↖ ${esc(lesson(p).title)}</a>`).join('') || '<p style="margin-top:12px">会基本矩阵乘法，就能从这里开始。</p>'}<div class="week-note">卡住时回看一个前置小节，算通具体数字后，再回到符号。</div></section><section class="side-panel"><div class="tiny-label">对应原始资料</div>${(l.sourceRefs || []).map(r=>sourceButton(r)).join('')}<a class="button outline small" href="#sources">打开资料架 ↗</a></section></aside></div>`;
  }
  function practicePage(wrongOnly = false, params = {}) {
    const kind = params.kind || 'all', ch = params.ch || 'all', page = Math.max(1,Number(params.page)||1);
    let qs = wrongOnly ? wrongQuestions() : questions();
    if(kind!=='all') qs=qs.filter(q=>q.source?.kind===kind);
    if(ch!=='all') qs=qs.filter(q=>q.chapter===ch);
    if(params.lesson)qs=qs.filter(q=>q.lessonId===params.lesson);
    const pages=Math.max(1,Math.ceil(qs.length/6)), p=Math.min(page,pages), shown=qs.slice((p-1)*6,p*6);
    const target=wrongOnly?'wrong':'practice';
    return `${heading(wrongOnly?'把卡住的地方，再走通一次。':'让概念落到一道具体的题。',wrongOnly?'练习答错或标记「需再练」的题会出现在这里；重做答对后自动移出。':'来源分别标注。学习通原题没有核对答案时，先写过程，再自行标记理解情况。')}<div class="filters"><select class="filter-select" id="practice-kind" aria-label="按题目来源筛选">${[['all','全部来源'],...Object.entries(sourceNames)].map(([v,t])=>`<option value="${v}" ${kind===v?'selected':''}>${t}</option>`).join('')}</select><select class="filter-select" id="practice-chapter" aria-label="按章节筛选"><option value="all">全部章节</option>${chapters.map(c=>`<option value="${c.id}" ${ch===c.id?'selected':''}>${esc(c.short)}</option>`).join('')}</select><span class="result-count">共 ${qs.length} 道 · 每页 6 道</span></div>${shown.length?shown.map((q,i)=>questionCard(q,(p-1)*6+i+1)).join(''):`<div class="empty-state"><h3>${wrongOnly?'目前没有待回顾错题':'这个筛选下还没有题目'}</h3><p>${wrongOnly?'做题时留下的错题会自动汇集到这里。也可以主动把还不理解的题标记为「需再练」。':'可以切换来源与章节，或到学习通页继续收录真实题目。'}</p><a class="button" href="#${wrongOnly?'practice':'chaoxing'}">${wrongOnly?'去做练习':'打开学习通题目整理'} →</a></div>`}${pages>1?`<div class="pagination"><a class="button outline small" href="#${target}?kind=${kind}&ch=${ch}${params.lesson?'&lesson='+encodeURIComponent(params.lesson):''}&page=${Math.max(1,p-1)}" ${p===1?'aria-disabled="true"':''}>← 上一页</a><span>${p} / ${pages}</span><a class="button outline small" href="#${target}?kind=${kind}&ch=${ch}${params.lesson?'&lesson='+encodeURIComponent(params.lesson):''}&page=${Math.min(pages,p+1)}">下一页 →</a></div>`:''}`;
  }
  function chaoxingPage() {
    const all=questions().filter(q=>q.source?.kind==='chaoxing');
    const checked=all.filter(q=>hasAnswer(q)||(q.type==='short'&&q.explanation)).length;
    return `${heading('把章节测验，接回学习主线。','真实题目单独收录；在这里理解与复习，在学习通完成正式课程任务。',`<a class="button outline" href="#practice?kind=chaoxing">练习已收录题 →</a>`)}<div class="source-status"><div class="status-box"><strong>${all.length}</strong><p>已收录学习通原题</p></div><div class="status-box"><strong>${checked}</strong><p>已有解析或核对答案</p></div><div class="status-box"><strong>20<small>%</small></strong><p>本学期视频与作业占比</p></div></div><div class="banner"><strong>本次读取情况：${esc(D.chaoxing.statusLabel || '待接入')}</strong>${esc(D.chaoxing.notes?.join(' ') || '尚未读取学习通题目。你可以用下面的方式收录题干；配套练习不会被标成学习通原题。')}</div>${D.chaoxing.chapters?.length?`<section class="side-panel" style="margin-bottom:22px"><h3>已观察到的平台章节</h3><div class="source-pills">${D.chaoxing.chapters.map(c=>`<span class="tag">${esc(typeof c==='string'?c:c.title)}</span>`).join('')}</div></section>`:''}${D.chaoxing.captures?.length?`<section class="side-panel" style="margin-bottom:22px"><div class="section-heading"><h3>五章完整原题底稿</h3><span class="tag">已去除昵称与应用侧栏</span></div><p>公式有疑问时可按章节与页序核对题面。分页有重叠，原图页数不等于题目数。</p>${(D.chaoxing.chapters||[]).map(c=>`<details class="capture-group"><summary>${esc(c.title)} · ${c.totalQuestions}题 · 已转录${c.transcribedQuestions||0}题</summary><div class="capture-links">${D.chaoxing.captures.filter(im=>im.chapter===c.chapter).map(im=>`<button class="filter-pill" data-source="${im.id}">${esc(im.label.split('·').slice(-1)[0])} ↗</button>`).join('')}</div></details>`).join('')}</section>`:''}<div class="import-grid"><form class="form-panel" id="manual-import"><h2>收录一道真实题目</h2><p>把题干和选项原样记下来。没有核对的答案可以留空，先保留问题，之后再讲解。</p><div class="form-row"><label for="import-label">章节与题号</label><input id="import-label" required placeholder="例如：1.2 线性子空间 · 第 3 题"></div><div class="form-row"><label for="import-chapter">对应知识模块</label><select id="import-chapter">${chapters.filter(c=>c.id!=='bridge').map(c=>`<option value="${c.id}">${esc(c.title)}</option>`).join('')}<option value="extra">测验补充 / 待归类</option></select></div><div class="form-row"><label for="import-prompt">题干（支持 $TeX$ 公式）</label><textarea id="import-prompt" required placeholder="写下完整条件与问题，不省略矩阵的行和列。"></textarea></div><div class="form-row"><label for="import-options">选项（每行一个；书面题留空）</label><textarea id="import-options" placeholder="正确&#10;错误"></textarea></div><div class="form-row"><label for="import-answer">已核对的正确选项</label><select id="import-answer"><option value="">暂未核对 / 书面题</option><option value="0">A / 第一个选项</option><option value="1">B / 第二个选项</option><option value="2">C / 第三个选项</option><option value="3">D / 第四个选项</option></select></div><div class="form-row"><label for="import-explanation">已核对的解析（可留空）</label><textarea id="import-explanation" placeholder="注明你核对过的步骤或理由。"></textarea></div><button class="button" type="submit">收录到我的题库 +</button></form><section class="form-panel"><h2>批量导入与学习备份</h2><p>支持导入整理好的题目 JSON，也可以导入这个平台导出的学习备份。导入前会检查格式；已有同编号题目不会重复添加。</p><div class="form-row"><label for="json-import">选择 JSON 文件</label><input id="json-import" type="file" accept="application/json,.json"></div><button class="button outline small" id="download-template">下载题目导入模板 ↓</button><pre>{
  "questions": [{
    "id": "my-xxt-001",
    "chapter": "space",
    "type": "choice",
    "prompt": "请替换成真实题干",
    "options": ["正确", "错误"],
    "source": {
      "kind": "chaoxing",
      "label": "学习通 · 章节名 · 题号"
    }
  }]
}</pre><p class="form-help">可选 answer 使用从 0 开始的选项编号。不确定时省略。这里的收录、答题和自评都不会改变学习通任务状态。</p><div class="week-note">学习记录保存在当前浏览器。更换电脑或清理浏览器前，先导出备份；线上版与本地版的记录需要通过导入导出转移。</div><button class="button outline small" id="export-here" style="margin-top:15px">导出全部学习记录 ↓</button></section></div>${all.length?`<section class="import-list"><div class="section-heading"><h2>已收录的真实测验题<small>完整列表可按来源筛选</small></h2><a href="#practice?kind=chaoxing">查看全部 ${all.length} 题 ↗</a></div>${all.slice(0,3).map((q,i)=>questionCard(q,i+1)).join('')}</section>`:''}`;
  }
  function sourcesPage(params={}) {
    const filter=params.kind||'all';
    const list=D.sources.filter(s=>filter==='all'||s.kind===filter);
    return `${heading('需要原文时，随时回到这里。','课件、试题与答案均保留原文件；题目旁的来源链接可直接定位 PDF 页。')}<div class="banner amber"><strong>使用本学期要求安排学习</strong>矩阵理论 I · 期末闭卷 80%，视频及作业 20%。新课件的旧评分页仍写 30% / 70%，以新通知和教学大纲为准。旧卷可能混有广义逆等范围外内容，请结合每节对应关系选择练习。</div><div class="filters">${[['all','全部资料'],['syllabus','教学大纲'],['ppt','本学期课件'],['past','往年试题与答案'],['exercise','分章习题'],['chaoxing','学习通题面']].map(([id,title])=>`<a class="filter-pill ${filter===id?'active':''}" href="#sources?kind=${id}">${title}</a>`).join('')}<span class="result-count">${list.length} 份原始文件</span></div><div class="resource-grid">${list.map(s=>`<article class="resource-card"><div class="pdf-icon">${s.format==='image'?'题面':'PDF'}</div><div><h3>${esc(s.title)}</h3><p>${esc(s.category || s.kind)} · ${s.pages} 页${s.note?' · '+esc(s.note):''}</p><button class="text-button" data-source="${esc(s.id)}" data-page="1">阅读原文 ↗</button> <a class="text-button" href="${esc(s.url)}" download style="margin-left:14px">下载 ↓</a></div></article>`).join('')}</div>`;
  }
  function searchPage(query) {
    const term=query.trim().toLowerCase();
    const ls=term?D.lessons.filter(l=>`${l.title} ${l.summary} ${plain(l.body)}`.toLowerCase().includes(term)):[];
    const qs=term?questions().filter(q=>`${q.prompt} ${q.source?.label || ''}`.toLowerCase().includes(term)):[];
    return `${heading('找到当前需要的那一点。',`搜索：${esc(query || '请输入关键词')}`)}<p class="search-caption">${ls.length} 个相关小节 · ${qs.length} 道相关题目</p><div class="lesson-grid">${ls.map(lessonTile).join('')}</div>${qs.length?`<div class="section-heading" style="margin-top:30px"><h2>相关练习</h2></div>${qs.slice(0,12).map((q,i)=>questionCard(q,i+1)).join('')}`:''}${!ls.length&&!qs.length?'<div class="empty-state"><h3>暂时没有匹配结果</h3><p>可以试试“正交”“Jordan”“范数”“核”等更短的关键词。</p></div>':''}`;
  }
  function route() {
    let raw=(location.hash||'#home').slice(1),[path,search='']=raw.split('?'),[page,id]=path.split('/');
    const params=Object.fromEntries(new URLSearchParams(search));
    if(page==='lesson') main.innerHTML=lessonPage(id);
    else if(page==='chapters')main.innerHTML=chapterPage(id);
    else if(page==='practice'||page==='wrong')main.innerHTML=practicePage(page==='wrong',params);
    else if(page==='chaoxing')main.innerHTML=chaoxingPage();
    else if(page==='sources')main.innerHTML=sourcesPage(params);
    else if(page==='search')main.innerHTML=searchPage(params.q||'');
    else {page='home';main.innerHTML=home();}
    updateSidebar(page);math();
    document.title=`${page==='lesson'?lesson(id)?.title || '章节学习':nav.find(v=>v[0]===page)?.[1]||'搜索'} · 矩阵学习室`;
    document.getElementById('sidebar').classList.remove('open');document.getElementById('menu-toggle').setAttribute('aria-expanded','false');
    window.scrollTo({top:0,behavior:'instant'});
  }
  function showFeedback(card,q,check) {
    const box=card.querySelector('.question-feedback');
    const selected=[...card.querySelectorAll('input:checked')].map(el=>Number(el.value)).sort((a,b)=>a-b);
    const expected=(Array.isArray(q.answer)?q.answer:[q.answer]).sort((a,b)=>a-b);
    const known=hasAnswer(q),hasOptions=q.options?.length>1;
    if(check&&!selected.length){toast('先选一个答案，再核对。');return;}
    let prefix='先核对你的过程';
    if(check&&known){const correct=JSON.stringify(selected)===JSON.stringify(expected);state.attempts[q.id]={correct,selection:q.type==='multiple'?selected:selected[0],at:Date.now()};save();prefix=correct?'答对了，看看理由是否也想到了。':'这一步还没走通，看看下面的理由。';box.classList.toggle('wrong',!correct);card.querySelectorAll('.question-option').forEach((el,i)=>{el.classList.toggle('correct',expected.includes(i));el.classList.toggle('incorrect',selected.includes(i)&&!expected.includes(i));});updateSidebar((location.hash||'').startsWith('#lesson')?'lesson':(location.hash||'#practice').slice(1).split('?')[0]);}
    let explanation=q.explanation?esc(q.explanation).replace(/\n/g,'<br>'):'这道真实测验题尚未附经核对的解析。先保留你的步骤；不要把未验证的答案当作结论。';
    box.innerHTML=`<strong>${prefix}</strong>${q.answerNote?`<p class="muted">${esc(q.answerNote)}</p>`:''}${known&&hasOptions?`<p>参考选项：${expected.map(i=>String.fromCharCode(65+i)).join('、')} · ${expected.map(i=>esc(q.options[i])).join('；')}</p>`:''}<div>${explanation}</div><div class="question-actions"><button class="button outline small" data-action="self-ok">我已理解 ✓</button><button class="button outline small" data-action="self-wrong">还需再练 ↻</button></div>`;
    box.hidden=false;math(box);
  }
  function download(name,data) {const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  const exportProgress=()=>download(`矩阵学习记录-${new Date().toISOString().slice(0,10)}.json`,{format:'matrix-study-room-backup-v1',exportedAt:new Date().toISOString(),state});
  function normalizeQuestion(q,index) {
    if(!q||typeof q.prompt!=='string'||!q.prompt.trim())throw new Error(`第 ${index+1} 题缺少题干`);
    const options=Array.isArray(q.options)?q.options.map(String):undefined;
    if(options&&(options.length<2||options.length>12))throw new Error(`第 ${index+1} 题选项数量应为 2-12`);
    if(q.answer!==undefined&&(!options||!(Array.isArray(q.answer)?q.answer:[q.answer]).every(a=>Number.isInteger(a)&&a>=0&&a<options.length)))throw new Error(`第 ${index+1} 题的答案编号无效`);
    return {id:`custom-${String(q.id||`${Date.now()}-${index}`).replace(/^custom-/,'').replace(/[^a-zA-Z0-9_-]/g,'-')}`,chapter:chapters.some(c=>c.id===q.chapter)?q.chapter:'extra',type:options?(q.type==='multiple'||Array.isArray(q.answer)?'multiple':'choice'):'short',prompt:q.prompt.trim(),...(options?{options}:{}),...(q.answer!==undefined?{answer:q.answer}:{}),...(typeof q.explanation==='string'?{explanation:q.explanation}:{}),source:{kind:'chaoxing',label:typeof q.source?.label==='string'?q.source.label:'学习通 · 用户收录'}};
  }
  document.addEventListener('click',e=>{
    const source=e.target.closest('[data-source]');
    if(source){const s=D.sources.find(v=>v.id===source.dataset.source);if(!s)return;const url=`${s.url}#page=${Math.max(1,Number(source.dataset.page)||1)}`;document.getElementById('source-title').textContent=s.title;document.getElementById('source-frame').src=url;document.getElementById('source-open').href=url;document.getElementById('source-dialog').showModal();return;}
    const done=e.target.closest('[data-complete]');if(done){const id=done.dataset.complete;if(state.done.includes(id))state.done=state.done.filter(v=>v!==id);else state.done.push(id);save();done.textContent=state.done.includes(id)?'已学过 ✓ · 再点可取消':'这一节，我学过了 ✓';updateSidebar('lesson');toast(state.done.includes(id)?'已记录这一步的进展。':'已取消本节学习标记。');return;}
    const action=e.target.closest('[data-action]');
    if(action){const card=action.closest('[data-question]'),q=getQuestion(card.dataset.question);if(!q)return;if(action.dataset.action==='check'||action.dataset.action==='explain')showFeedback(card,q,action.dataset.action==='check');else{const correct=action.dataset.action==='self-ok';state.attempts[q.id]={correct,selfRated:true,at:Date.now()};save();updateSidebar((location.hash||'#practice').slice(1).split(/[/?]/)[0]);toast(correct?'已标记理解；错题回顾中会移出。':'已加入错题回顾。');}return;}
    if(e.target.closest('#export-here'))exportProgress();
    if(e.target.closest('#download-template'))download('学习通题目导入模板.json',{questions:[{id:'my-xxt-001',chapter:'space',type:'choice',prompt:'请替换成真实题干',options:['正确','错误'],source:{kind:'chaoxing',label:'学习通 · 章节名 · 题号'}}]});
  });
  document.addEventListener('input',e=>{
    if(e.target.id==='parameter'){const t=Number(e.target.value);document.getElementById('parameter-value').textContent=`t = ${t}`;document.getElementById('parameter-result').innerHTML=`x = (${4-t}, ${5-t}, ${t})ᵀ<br><strong>Ax = (4, 5)ᵀ</strong>`;}
    if(e.target.id==='lesson-note'){state.notes[e.target.dataset.lesson]=e.target.value;save();}
  });
  document.addEventListener('change',async e=>{
    if(e.target.id==='practice-kind'||e.target.id==='practice-chapter'){const target=location.hash.startsWith('#wrong')?'wrong':'practice';location.hash=`${target}?kind=${document.getElementById('practice-kind').value}&ch=${document.getElementById('practice-chapter').value}`;}
    if(e.target.id==='json-import'&&e.target.files[0]){
      try{const file=e.target.files[0];if(file.size>8*1024*1024)throw new Error('文件过大，请使用 8 MB 以内的 JSON');const obj=JSON.parse(await file.text());if(obj.format==='matrix-study-room-backup-v1'){
        const v=obj.state;if(!v||!Array.isArray(v.done)||!Array.isArray(v.custom)||!v.attempts||typeof v.attempts!=='object'||!v.notes||typeof v.notes!=='object')throw new Error('学习备份格式不完整');
        const custom=v.custom.map(normalizeQuestion);state={...state,done:[...new Set([...state.done,...v.done.filter(id=>lesson(id))])],custom:[...state.custom,...custom.filter(q=>!state.custom.some(x=>x.id===q.id))],attempts:{...state.attempts,...v.attempts},notes:{...state.notes,...v.notes}};save();route();toast('学习备份已合并，原有记录保留。');
      }else{const list=Array.isArray(obj)?obj:obj.questions;if(!Array.isArray(list)||!list.length)throw new Error('文件需要包含非空 questions 数组');const items=list.map(normalizeQuestion),seen=new Set(questions().map(q=>q.id)),added=items.filter(q=>{if(seen.has(q.id))return false;seen.add(q.id);return true;});state.custom.push(...added);save();route();toast(`已收录 ${added.length} 道题目。`);}}
      catch(err){toast(`导入失败：${err.message}`);}
    }
  });
  document.addEventListener('submit',e=>{if(e.target.id!=='manual-import')return;e.preventDefault();try{const options=document.getElementById('import-options').value.split(/\r?\n/).map(v=>v.trim()).filter(Boolean),answer=document.getElementById('import-answer').value;const q=normalizeQuestion({id:`manual-${Date.now()}`,chapter:document.getElementById('import-chapter').value,prompt:document.getElementById('import-prompt').value,...(options.length?{options}:{}),...(answer!==''?{answer:Number(answer)}:{}),explanation:document.getElementById('import-explanation').value,source:{label:`学习通 · ${document.getElementById('import-label').value}`}},0);state.custom.push(q);save();route();toast('真实题目已收录，可以到题目练习中查看。');}catch(err){toast(err.message);}});
  document.getElementById('global-search').addEventListener('keydown',e=>{if(e.key==='Enter')location.hash=`search?q=${encodeURIComponent(e.target.value)}`;});
  document.getElementById('export-progress').addEventListener('click',exportProgress);
  document.getElementById('menu-toggle').addEventListener('click',()=>{const open=document.getElementById('sidebar').classList.toggle('open');document.getElementById('menu-toggle').setAttribute('aria-expanded',String(open));});
  document.getElementById('close-source').addEventListener('click',()=>{document.getElementById('source-dialog').close();document.getElementById('source-frame').src='about:blank';});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){document.getElementById('sidebar').classList.remove('open');document.getElementById('menu-toggle').setAttribute('aria-expanded','false');}});
  window.addEventListener('hashchange',route);route();
})();
