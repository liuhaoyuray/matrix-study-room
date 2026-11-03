"""Rebuild the portable course data using only Python's standard library."""
from pathlib import Path
import html
import json
import re

root = Path(__file__).resolve().parent
target = root / 'dist' / 'data.js'
prefix = 'window.MATRIX_DATA = '
data, _ = json.JSONDecoder().raw_decode(target.read_text(encoding='utf-8').removeprefix(prefix))
lessons = []
formula = re.compile(r'\$\$[\s\S]*?\$\$|(?<!\$)\$(?!\$)[\s\S]*?(?<!\\)\$')
for name in ['content-foundations.json', 'content-advanced.json', 'content-supplement.json']:
    for lesson in json.loads((root / name).read_text(encoding='utf-8'))['lessons']:
        lesson['body'] = formula.sub(lambda m: html.escape(html.unescape(m.group(0)), quote=False), lesson['body'])
        for q in lesson['questions']:
            if not q['id'].startswith('v2-'):
                q['id']='v2-'+q['id']
        lessons.append(lesson)
ids = {item['id'] for item in lessons}
assert len(ids) == len(lessons), 'Duplicate lesson IDs'
for lesson in lessons:
    assert all(x in ids for x in lesson.get('prerequisites', [])), lesson['id']
    for field in ['goals','symbols','definitions','method','worked','traps','mastery']:
        assert lesson.get(field), f'{lesson["id"]}: missing {field}'
    assert len(lesson['goals']) >= 2 and len(lesson['definitions']) >= 1, lesson['id']
    assert all(lesson['worked'].get(k) for k in ['title','given','steps','result','check']), lesson['id']
    assert len(lesson['questions']) >= 2, lesson['id']

def visit(lid, active, finished):
    assert lid not in active, f'Prerequisite cycle: {lid}'
    if lid in finished:
        return
    active.add(lid)
    for dep in next(l for l in lessons if l['id']==lid)['prerequisites']:
        visit(dep,active,finished)
    active.remove(lid)
    finished.add(lid)
finished=set()
for lid in ids:visit(lid,set(),finished)
data['lessons'] = lessons
data['version'] = '2.0'
data['updatedAt'] = '2026-11-03'
data['exam'] = json.loads((root/'exam-map.json').read_text(encoding='utf-8'))
data['sources'] = json.loads((root / 'source-index.json').read_text(encoding='utf-8'))
data['chaoxing'] = json.loads((root / 'chaoxing-questions.json').read_text(encoding='utf-8'))
for item in data['sources']:
    assert (root / 'dist' / item['url']).is_file(), item['url']
source_by_file={s['file'].replace('\\','/'):s for s in data['sources']}
def check_ref(ref):
    assert ref['file'] in source_by_file, ref
    assert 1 <= ref.get('page',1) <= source_by_file[ref['file']]['pages'], ref
for l in lessons:
    for ref in l['sourceRefs']:check_ref(ref)
    for example in l.get('pptCases',[]):check_ref(example['ref'])
for t in data['exam']['topics']:
    assert all(lid in ids for lid in t['lessonIds']),t['id']
    for o in t['occurrences']:check_ref(o['ref'])
for w in data['exam']['workedPast']:check_ref(w['ref'])
questions = [q for lesson in lessons for q in lesson['questions']] + data['chaoxing']['questions']
assert len({q['id'] for q in questions}) == len(questions), 'Duplicate question IDs'
for q in questions:
    if 'answer' in q:
        answers = q['answer'] if isinstance(q['answer'], list) else [q['answer']]
        assert all(isinstance(a, int) and 0 <= a < len(q.get('options', [])) for a in answers), q['id']
target.write_text(prefix + json.dumps(data, ensure_ascii=False) + ';\n', encoding='utf-8')
print(f'Rebuilt: {len(lessons)} lessons, {len(questions)} questions, {len(data["sources"])} source files.')
print(f'Exam audit: {len(data["exam"]["papers"])} papers, {len(data["exam"]["topics"])} task types, {len(data["exam"]["workedPast"])} worked past problems.')
