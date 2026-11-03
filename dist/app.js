/* Matrix Study Room — buildless, offline-capable personal learning space. */
(() => {
  'use strict';
  const D = window.MATRIX_DATA;
  if (!D) { document.getElementById('main').textContent = '课程数据未加载，请重新打开完整的平台文件夹。'; return; }
  const KEY = 'matrix-study-room-v1';
    const defaults = () => ({ done: [], attempts: {}, notes: {}, custom: [], drafts: {}, last: 'b01' });
  let state;
  try { state = { ...defaults(), ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { state = defaults(); }
  if (!Array.isArray(state.done)) state.done = [];
  if (!Array.isArray(state.custom)) state.custom = [];
  if (!state.attempts || typeof state.attempts !== 'object') state.attempts = {};
  if (!state.notes || typeof state.notes !== 'object') state.notes = {};
  if (!state.drafts || typeof state.drafts !== 'object') state.drafts = {};
  if(state.curriculumVersion!==2){state.legacyDone=state.done;state.done=[];state.curriculumVersion=2;saveOnMigration();}
  function saveOnMigration(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{}}
  const main = document.getElementById('main');
  const nav = [['home','从这里开始','home'],['exam','期末考点地图','pen'],['chapters','学习路线','book'],['practice','题目练习','pen'],['wrong','错题回顾','repeat'],['chaoxing','学习通测验','check'],['sources','资料架','folder']];
  const chapters = D.chapters;
  const hasAnswer = q => Number.isInteger(q.answer) || (Array.isArray(q.answer) && q.answer.length > 0);
  const sourceNames = { original: '自编基础练习', ppt: '课件相关练习（含改编）', past: '旧卷相关练习（含改编）', chaoxing: '学习通原题' };
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
  const allTopics = () => D.exam?.topics || [];
  const relatedTopics = id => allTopics().filter(t => (t.lessonIds || []).includes(id));
  const relatedPast = id => (D.exam?.lessonLinks?.[id] || []);
  const stepNames = ['目标与期末题','定义与理解','例题与步骤','独立练习','真题与验收'];
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
    const topics=relatedTopics(l.id), links=relatedPast(l.id);
    return `<a class="lesson-tile" href="#lesson/${l.id}"><div class="tile-top"><span class="tiny-label">${esc(l.id.toUpperCase())}</span><span class="tag">${state.done.includes(l.id)?'已验收 ✓':`${l.minutes} 分钟`}</span></div><h3>${esc(l.title)}</h3><p>${esc(l.goals?.[0] || l.summary)}</p><div class="tile-exam">${links.length?esc(links[0].role==='direct'?'学完可练：':'先为这类题打基础：')+esc(links[0].label):topics.length?'连接题型：'+esc(topics[0].title):'基础工具：供后续计算使用'}</div><div class="tile-bottom"><span>${l.questions.length} 道独立练习</span><span>按五步学习 →</span></div></a>`;
  }

  function home() {
    const l=nextLesson(), exam=D.exam || {};
    return `${heading('先知道考什么，再一节一节学会。','矩阵理论 I · 从线代基础恢复，到能独立完成期末题。','','2026 秋 · 课程重编版')}
    <section class="start-panel"><div><span class="tag">${doneCount()?'继续你的学习':'建议的起点'}</span><h2>${esc(l.title)}</h2><p>${esc(l.goals?.[0] || l.summary)}</p><p class="muted">先看本节能解决什么，再读定义、跟算例题、独立练习，最后对照真实期末题。</p><div class="hero-actions"><a class="button" href="#lesson/${l.id}">开始这一节 →</a><a class="button outline" href="#exam">先看期末怎么考</a></div></div><div class="start-note"><strong>这次学习只做三件事</strong><ol><li>说清一个概念的定义和条件。</li><li>遮住答案，自己算一遍例题。</li><li>完成独立练习，确认它对应的期末任务。</li></ol></div></section>
    <section class="overview-grid"><a href="#exam" class="overview-card"><span class="tiny-label">01 · 先看全局</span><h2>期末考点地图 →</h2><p>六份有年份旧卷逐题归类。看题型、出现卷数、原题位置和学习路径。</p></a><a href="#chapters" class="overview-card"><span class="tiny-label">02 · 跟着学</span><h2>学习路线 →</h2><p>每节有明确目标、符号、定义、完整算例与验收标准。先修内容可直接回看。</p></a><a href="#chaoxing" class="overview-card"><span class="tiny-label">03 · 完成平时任务</span><h2>学习通章节测验 →</h2><p>105 道真实题单独整理。平时成绩占 20%，正式任务在学习通完成。</p></a></section>
    <section class="side-panel"><h2>先学哪些内容？</h2><p>优先级综合本学期大纲、旧卷证据和先修关系。历史出现卷数用于安排训练，不能保证今年出题。</p><div class="priority-grid">${(exam.priorities || []).map(p=>`<div><span class="tag ${p.level==='补充'?'amber':''}">${esc(p.level)}</span><h3>${esc(p.title)}</h3><p>${esc(p.reason)}</p><a href="#exam/${p.topicId}">查看题型依据与路线 →</a></div>`).join('')}</div></section>
    <section class="side-panel scope-box"><h2>本学期范围与旧卷的边界</h2><p>教师通知与新大纲：<strong>期末闭卷 80%，视频及作业 20%</strong>。主线是线性空间、线性映射与矩阵、矩阵分解、矩阵分析。广义逆、最小二乘等在旧卷与学习通中出现，放在补充路线，不能只凭旧卷断定今年期末必考。</p><a href="#sources?kind=syllabus">核对本学期大纲 ↗</a><p class="muted">笔记、错题与学习记录保存在当前浏览器。沿用原链接即可；换浏览器或设备请先导出记录。</p></section>`;
  }

  function chapterPage(selected) {
    const list=selected?chapters.filter(c=>c.id===selected):chapters;
    return `${heading('按先修顺序，学会一类题。','基础忘了就从补修工具开始；每节的“目标与期末题”会说明它是基础工具，还是能直接用于整题。')}
    <div class="filters"><a class="filter-pill ${!selected?'active':''}" href="#chapters">完整路线</a>${chapters.map(c=>`<a class="filter-pill ${selected===c.id?'active':''}" href="#chapters/${c.id}">${esc(c.short)}</a>`).join('')}</div>
    ${list.map((c,i)=>`<section class="module-block"><div class="module-title"><span class="path-no">${chapters.indexOf(c)}</span><div><h2>${esc(c.title)}</h2><p>${esc(c.description)}</p></div></div>${c.id==='extra'?'<div class="banner amber">学习通与旧卷补充：完成对应平时任务需要了解；本学期大纲没有单列这些条目，期末范围仍需以教师通知为准。</div>':''}<div class="lesson-grid">${D.lessons.filter(l=>l.chapter===c.id).map(lessonTile).join('')}</div></section>`).join('')}`;
  }
  function pastLinks(id) {
    const links=relatedPast(id);
    if(id==='e01')return '<div class="banner amber">LU 属于学习通分解补充。六份统计样本未确认它作为单独要求的期末大题，因此这里不虚构真题对应；可先用于理解消元，再按学习通任务安排。</div>';
    return links.map(link=>`<article class="exam-link-card"><span class="tag ${link.role==='direct'?'':'amber'}">${link.role==='direct'?'本节学完可练':'本节提供基础工具'}</span><h3>${esc(link.label)}</h3><p>${esc(link.task)}</p><p class="muted">${esc(link.boundary)}</p>${sourceButton(link.ref,'打开原卷题面')}<a href="#exam/${link.topicId}">查看整题学习路径与同类题 →</a></article>`).join('') || '<div class="banner">这节是基础准备，没有把它单独算作一类期末大题。后面的题型页会标出如何使用它。</div>';
  }
  function lessonPage(id,params={}) {
    const l=lesson(id);if(!l)return `<div class="empty-state"><h2>没有这节课</h2><a href="#chapters">返回学习路线</a></div>`;
    state.last=id;save();
    const step=Math.min(4,Math.max(0,Number(params.step)||0)), next=D.lessons[D.lessons.indexOf(l)+1];
    const sections=[
      ()=>`<section class="lesson-section"><h2>学完这一节，你要能做到</h2><ul class="goal-list">${(l.goals||[]).map(g=>`<li>${esc(g)}</li>`).join('')}</ul><h2>它与期末题的关系</h2>${pastLinks(id)}<h2>开始前需要什么</h2><div class="prereq-grid">${(l.prerequisites||[]).map(p=>`<a href="#lesson/${p}"><span class="tag">${state.done.includes(p)?'已验收':'可回看'}</span> ${esc(lesson(p)?.title||p)} →</a>`).join('')||'<p>从本节开始即可。矩阵的行、列、乘法含义会在讲解中说明。</p>'}</div></section>`,
      ()=>`<section class="lesson-section"><h2>先认清符号</h2><div class="table-wrap"><table><thead><tr><th>符号</th><th>含义与条件</th></tr></thead><tbody>${(l.symbols||[]).map(s=>`<tr><td>${esc(s.symbol)}</td><td>${esc(s.meaning)}</td></tr>`).join('')}</tbody></table></div><h2>定义：先精确，再理解</h2>${(l.definitions||[]).map(d=>`<section class="definition-card"><h3>${esc(d.term)}</h3><div class="definition-statement">${esc(d.statement)}</div><p><strong>怎么理解：</strong>${esc(d.intuition)}</p></section>`).join('')}<h2>把概念连起来</h2><div class="lesson-body">${l.body}</div></section>`,
      ()=>`<section class="lesson-section"><h2>遇到这类问题，按什么顺序算</h2><ol class="method-list">${(l.method||[]).map(s=>`<li>${esc(s)}</li>`).join('')}</ol><h2>${esc(l.worked?.title||'完整算例')}</h2><div class="problem-box">${esc(l.worked?.given||'')}</div><ol class="worked-list">${(l.worked?.steps||[]).map(s=>`<li>${esc(s)}</li>`).join('')}</ol><div class="result-box"><strong>结果</strong><p>${esc(l.worked?.result||'')}</p><strong>怎样检查</strong><p>${esc(l.worked?.check||'')}</p></div>${(l.pptCases||[]).map(w=>`<details class="ppt-case"><summary>${esc(w.title)}</summary><p class="muted">课件例题解读：例题依据原页，说明和推导重新编写。</p><div class="problem-box">${esc(w.given)}</div>${sourceButton(w.ref,'打开课件原页')}<ol class="worked-list">${w.steps.map(s=>`<li>${esc(s)}</li>`).join('')}</ol><div class="result-box"><p>${esc(w.result)}</p><p>${esc(w.check)}</p></div></details>`).join('')}<h2>常见错误，以及为什么错</h2>${(l.traps||[]).map(t=>`<div class="trap-card"><strong>${esc(t.wrong)}</strong><p>${esc(t.why)}</p></div>`).join('')}</section>`,
      ()=>`<section class="lesson-section"><h2>遮住例题，独立完成</h2><p>先写定义或列式，再算结果。书面题可写下过程，之后展开解析核对；自评不会判定你的推导是否正确。</p>${l.questions.map((q,i)=>questionCard({...q,lessonId:id,chapter:l.chapter},i+1)).join('')}</section>`,
      ()=>`<section class="lesson-section"><h2>回到真实期末题</h2>${pastLinks(id)}<h2>这节课的验收标准</h2><p>能独立做到下面每一项，再标记完成。只读懂解析，还需要再做一次。</p><ul class="goal-list">${(l.mastery||[]).map(s=>`<li>${esc(s)}</li>`).join('')}</ul><div class="form-row"><label for="lesson-note">本节笔记 / 还卡在哪里（自动保存）</label><textarea id="lesson-note" data-lesson="${id}" placeholder="例如：知道为什么要解 Aᵀx=0，但自由变量仍容易漏。">${esc(state.notes[id]||'')}</textarea></div><button class="button" data-complete="${id}">${state.done.includes(id)?'已学过 ✓ · 再点可取消':'达到标准，标记学过 ✓'}</button>${(D.chaoxing.questions||[]).some(q=>q.lessonId===id)?`<h2>对应学习通测验</h2><a class="button outline" href="#practice?kind=chaoxing&lesson=${id}">练习本节对应的真实测验题 →</a><p class="muted">独立解析非官方答案。正式测验请回学习通完成。</p>`:''}</section>`
    ];
    return `<a class="back-link" href="#chapters/${l.chapter}">← ${esc(chapter(l.chapter)?.short||'学习路线')}</a><div class="lesson-layout"><article class="lesson-paper"><div class="eyebrow">${esc(l.id.toUpperCase())} · 约 ${l.minutes} 分钟</div><h1>${esc(l.title)}</h1><p class="lesson-subtitle">${esc(l.summary)}</p><nav class="lesson-steps" aria-label="本节学习步骤">${stepNames.map((s,i)=>`<a class="${i===step?'active':''}" ${i===step?'aria-current="step"':''} href="#lesson/${id}?step=${i}"><b>${i+1}</b>${s}</a>`).join('')}</nav>${sections[step]()}<div class="lesson-bottom">${step?`<a class="button outline" href="#lesson/${id}?step=${step-1}">← ${stepNames[step-1]}</a>`:'<span></span>'}${step<4?`<a class="button" href="#lesson/${id}?step=${step+1}">下一步：${stepNames[step+1]} →</a>`:next?`<a class="button outline" href="#lesson/${next.id}">下一节：${esc(next.title)} →</a>`:'<a class="button outline" href="#exam">回到期末题型地图 →</a>'}</div></article><aside class="lesson-aside"><section class="side-panel"><h3>这节课的学习任务</h3><p>${esc(l.goals?.[0]||l.summary)}</p><h3>前置知识</h3>${(l.prerequisites||[]).map(p=>`<a class="prereq-link" href="#lesson/${p}">${esc(lesson(p)?.title||p)} →</a>`).join('')||'<p>无额外先修要求</p>'}</section><section class="side-panel"><h3>对应课件 / 资料</h3>${(l.sourceRefs||[]).map(r=>sourceButton(r)).join('')}<p class="muted">讲解中的教学算例为重新编写；原课件例题请打开来源。</p><a href="#exam">查看全部期末题型 →</a></section></aside></div>`;
  }
  function diskFigure(scaled) {
    const rs=scaled?[4,3,5]:[3,2,10], cs=[2,10,20], colors=['#4478a3','#b46c31','#65915c'];
    return `<figure class="disk-figure"><figcaption><strong>${scaled?'相似缩放后：三个圆盘两两分离':'原矩阵：圆盘有重叠，尚未隔离'}</strong><span class="muted">${scaled?'中心 2、10、20；半径 4、3、5；每圆恰含 1 个特征值':'中心 2、10、20；半径 3、2、10；覆盖谱不等于完成隔离'}</span></figcaption><div class="table-wrap"><svg viewBox="0 0 760 460" role="img" aria-label="${scaled?'三个互不相交的盖尔圆盘':'存在重叠的原始盖尔圆盘'}"><line x1="20" y1="225" x2="735" y2="225" stroke="#809081"/><line x1="100" y1="20" x2="100" y2="430" stroke="#bdc8b8"/>${[-4,0,5,10,15,20,25,30].map(x=>`<line x1="${100+x*20}" y1="221" x2="${100+x*20}" y2="229" stroke="#53674d"/><text x="${100+x*20}" y="451" text-anchor="middle" font-size="15" fill="#4c6347">${x}</text>`).join('')}${cs.map((c,i)=>`<circle cx="${100+c*20}" cy="225" r="${rs[i]*20}" fill="${colors[i]}" fill-opacity=".10" stroke="${colors[i]}" stroke-width="2"/><circle cx="${100+c*20}" cy="225" r="3" fill="${colors[i]}"/><text x="${100+c*20}" y="${218-rs[i]*20}" text-anchor="middle" fill="${colors[i]}" font-size="15">中心 ${c}，r=${rs[i]}</text>`).join('')}<text x="725" y="217" font-size="14" fill="#53674d">Re z</text></svg></div></figure>`;
  }
  function examPage(id) {
    const E=D.exam;if(!E)return heading('正在整理期末地图','');
    const t=allTopics().find(x=>x.id===id);
    if(t){
      const examples=(E.workedPast||[]).filter(w=>w.topicId===id);
      return `<a class="back-link" href="#exam">← 返回全部题型</a>${heading(esc(t.title),esc(t.task||t.description||''),'','期末题型 · '+esc(t.scope))}<div class="banner"><strong>为什么安排这一类</strong>${esc(t.priorityReason||'')}<br>样本中出现：${t.paperCount} / 6 份卷。按试卷去重，不能解释为本学期命题概率。</div><section class="side-panel"><h2>从不会，到能做整题</h2><p>下面列关键课程；所缺先修可在各课内回看。熟悉的部分可直接用算例自测。矩阵函数可以按不同结构选择方法，不要求每题都用所有分解。</p><ol class="study-chain">${(t.lessonIds||[]).map(lid=>`<li><a href="#lesson/${lid}">${esc(lesson(lid)?.title||lid)} →</a><span class="muted">${esc(lesson(lid)?.goals?.[0]||'')}</span></li>`).join('')}</ol>${t.method?`<h3>整题答题顺序</h3><ol>${t.method.map(x=>`<li>${esc(x)}</li>`).join('')}</ol>`:''}${t.mastery?`<h3>整题完成标准</h3><p>${esc(t.mastery)}</p>`:''}</section><section class="side-panel"><h2>旧卷是怎样问的</h2><div class="evidence-list">${(t.occurrences||[]).map(o=>`<article><div><span class="tag">${esc(o.year)} 文件</span> <strong>${esc(o.ref?.label||o.label||'')}</strong>${o.points?`<span> · ${o.points} 分</span>`:''}</div><p>${esc(o.prompt||o.task||'')}</p>${sourceButton(o.ref,'打开原题核对')}</article>`).join('')}</div></section>${examples.map(w=>`<section class="side-panel past-worked"><h2>真题精讲：${esc(w.title)}</h2><div class="problem-box">${esc(w.prompt)}</div>${sourceButton(w.ref,'核对原卷题面')}<details><summary>先独立列式，再展开逐步解析</summary><ol class="worked-list">${w.steps.map(s=>`<li>${esc(s)}</li>`).join('')}</ol><div class="result-box"><strong>结果与检验</strong><p>${esc(w.result)}</p><p>${esc(w.check||'')}</p></div><p class="muted">解析为独立推导，用于学习；不把历史参考答案当作本学期官方评分标准。</p></details></section>`).join('')}${id==='gershgorin'?`<section class="side-panel"><h2>隔离题的图应该怎样画</h2><p>对应上面2017真题。相似变换改变圆盘半径，但保留特征值。注意：圆盘并集只是位置界，不是特征值的精确轨迹。</p>${diskFigure(false)}${diskFigure(true)}</section>`:''}${(t.relatedOccurrences||[]).length?`<section class="side-panel"><h2>相关方法题（不计入上方出现卷数）</h2><p>下面题目借助同一工具，但题面最终要求不同。</p>${t.relatedOccurrences.map(o=>`<p>${esc(o.prompt)}</p>${sourceButton(o.ref)}`).join('')}</section>`:''}${!examples.length?'<div class="banner">这一题型先从路线中的完整教学算例入手，再打开上面的真实题面独立练习。</div>':''}`;
    }
    return `${heading('期末到底考什么，按题型看清楚。','样本：2017、2018、2019、2020、2021、2023 六份有年份试卷。题型与本学期大纲交叉核对。')}
    <section class="banner amber"><strong>读这张地图的方法</strong>“6 / 6”只表示样本六份卷都出现过，按卷去重，不是今年出题概率。同一道综合题可涉及多个考点，不能把各行分值直接相加。没有年份的试题1—8不混入频次统计。优先级同时考虑当前范围与先修关系。</section>
    <div class="table-wrap exam-table"><table><thead><tr><th>题型 / 任务</th><th>出现卷数</th><th>学习安排与依据</th><th>范围</th></tr></thead><tbody>${allTopics().map(t=>`<tr><td><a href="#exam/${t.id}"><strong>${esc(t.title)} →</strong></a><p>${esc(t.task||t.description||'')}</p></td><td><span class="frequency">${t.paperCount}<small> / 6</small></span><div class="frequency-bar"><span style="width:${t.paperCount/6*100}%"></span></div></td><td>${esc(t.priorityReason||'')}</td><td><span class="tag ${t.scope.includes('补充')?'amber':''}">${esc(t.scope)}</span></td></tr>`).join('')}</tbody></table></div>
    <section class="side-panel"><h2>逐卷结构：看清小题、计算与证明的关系</h2><p>下列分数来自旧卷，不能当成本学期卷面分配。文件年份沿用文件名；考试实际日期以卷头为准。</p>${(E.papers||[]).map(p=>`<details class="paper-detail"><summary>${esc(p.year)} 年文件 · ${esc(p.structureLabel||'展开查看题目与分值')}</summary><p>${esc(p.note||'')}</p><div class="table-wrap"><table><thead><tr><th>题目位置</th><th>分值</th><th>考察任务</th><th>原卷</th></tr></thead><tbody>${(p.items||[]).map(q=>`<tr><td>${esc(q.label)}</td><td>${esc(q.points??'')}</td><td>${esc(q.task||q.topic||q.prompt||'')}</td><td>${sourceButton(q.ref,'题面')}</td></tr>`).join('')}</tbody></table></div></details>`).join('')}</section><section class="side-panel"><h2>统计口径与范围说明</h2>${(E.notes||[]).map(n=>`<p>${esc(n)}</p>`).join('')}<p>主线大纲列出了填空、判断、选择、计算和证明等题型。计算题训练之外，也要能说出定义、检查条件并说明理由。</p><a href="#sources?kind=syllabus">查看新大纲 ↗</a></section>`;
  }

  function questionCard(q, index) {
    const attempt = state.attempts[q.id];
    const kind = q.source?.kind || 'original';
    const multiple = Array.isArray(q.options) && q.options.length > 1;
    const many = q.type === 'multiple';
    return `<article class="question-card" data-question="${esc(q.id)}"><div class="question-top"><div class="tag-group"><span class="tag ${kind==='past'?'amber':kind==='chaoxing'?'blue':''}">${esc(sourceNames[kind] || kind)}</span><span class="tag">${multiple?(many?'多选题':'选择 / 判断'):'书面练习'}</span></div><span class="tiny-label">${index ? String(index).padStart(2,'0') : ''}${attempt ? (attempt.correct?(attempt.selfRated?' · 已理解':' · 已答对'):' · 待回顾') : ''}</span></div><div class="question-prompt">${esc(q.prompt)}</div>${q.source?.kind==='past'||q.source?.kind==='ppt'?'<p class="provenance-note">本卡可能为改编题。原题题面与题号请打开来源核对；原卷逐题记录见期末考点地图。</p>':''}${multiple ? q.options.map((o,i)=>`<label class="question-option"><input type="${many?'checkbox':'radio'}" name="q-${esc(q.id)}" value="${i}"><span class="option-letter">${String.fromCharCode(65+i)}</span><span>${esc(o)}</span></label>`).join('') : `<textarea class="short-answer" aria-label="你的解题过程" placeholder="先自己写关键步骤，或在纸上完成后再展开解析。">${esc(state.drafts[q.id]||'')}</textarea>`}<div class="question-actions">${multiple && hasAnswer(q) ? '<button class="button small" data-action="check">提交这道练习</button>' : ''}<button class="button outline small" data-action="explain">${hasAnswer(q)||q.explanation?'查看解析':'记录我的复习情况'}</button></div><div class="question-feedback" hidden></div><div class="question-origin"><span>${esc(q.source?.label || '配套练习')}</span>${q.source?.file ? sourceButton(q.source,'查看原文') : ''}${q.lessonId ? `<a href="#lesson/${esc(q.lessonId)}">返回知识点 ↗</a>`:''}</div></article>`;
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
    if(page==='lesson') main.innerHTML=lessonPage(id,params);
    else if(page==='exam')main.innerHTML=examPage(id);
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
    const jump=e.target.closest('[data-scroll]');if(jump){document.getElementById(jump.dataset.scroll)?.scrollIntoView({behavior:'smooth'});return;}

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
    if(e.target.matches('.short-answer')){state.drafts[e.target.closest('[data-question]').dataset.question]=e.target.value;save();}
    if(e.target.id==='lesson-note'){state.notes[e.target.dataset.lesson]=e.target.value;save();}
  });
  document.addEventListener('change',async e=>{
    if(e.target.id==='practice-kind'||e.target.id==='practice-chapter'){const target=location.hash.startsWith('#wrong')?'wrong':'practice';location.hash=`${target}?kind=${document.getElementById('practice-kind').value}&ch=${document.getElementById('practice-chapter').value}`;}
    if(e.target.id==='json-import'&&e.target.files[0]){
      try{const file=e.target.files[0];if(file.size>8*1024*1024)throw new Error('文件过大，请使用 8 MB 以内的 JSON');const obj=JSON.parse(await file.text());if(obj.format==='matrix-study-room-backup-v1'){
        const v=obj.state;if(!v||!Array.isArray(v.done)||!Array.isArray(v.custom)||!v.attempts||typeof v.attempts!=='object'||!v.notes||typeof v.notes!=='object')throw new Error('学习备份格式不完整');
        const custom=v.custom.map(normalizeQuestion);state={...state,done:[...new Set([...state.done,...v.done.filter(id=>lesson(id))])],custom:[...state.custom,...custom.filter(q=>!state.custom.some(x=>x.id===q.id))],attempts:{...state.attempts,...v.attempts},notes:{...state.notes,...v.notes},drafts:{...state.drafts,...(v.drafts||{})}};save();route();toast('学习备份已合并，原有记录保留。');
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
