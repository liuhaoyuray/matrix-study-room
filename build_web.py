"""Rebuild the portable course data using only Python's standard library."""
from pathlib import Path
import html
import json
import re

root = Path(__file__).resolve().parent
target = root / 'dist' / 'data.js'
prefix = 'window.MATRIX_DATA = '
data = json.loads(target.read_text(encoding='utf-8').removeprefix(prefix).rstrip(';\n'))
lessons = []
formula = re.compile(r'\$\$[\s\S]*?\$\$|(?<!\$)\$(?!\$)[\s\S]*?(?<!\\)\$')
for name in ['content-foundations.json', 'content-advanced.json', 'content-supplement.json']:
    for lesson in json.loads((root / name).read_text(encoding='utf-8'))['lessons']:
        lesson['body'] = formula.sub(lambda m: html.escape(html.unescape(m.group(0)), quote=False), lesson['body'])
        lessons.append(lesson)
ids = {item['id'] for item in lessons}
assert len(ids) == len(lessons), 'Duplicate lesson IDs'
for lesson in lessons:
    assert all(x in ids for x in lesson.get('prerequisites', [])), lesson['id']
data['lessons'] = lessons
data['sources'] = json.loads((root / 'source-index.json').read_text(encoding='utf-8'))
data['chaoxing'] = json.loads((root / 'chaoxing-questions.json').read_text(encoding='utf-8'))
for item in data['sources']:
    assert (root / 'dist' / item['url']).is_file(), item['url']
questions = [q for lesson in lessons for q in lesson['questions']] + data['chaoxing']['questions']
assert len({q['id'] for q in questions}) == len(questions), 'Duplicate question IDs'
for q in questions:
    if 'answer' in q:
        answers = q['answer'] if isinstance(q['answer'], list) else [q['answer']]
        assert all(isinstance(a, int) and 0 <= a < len(q.get('options', [])) for a in answers), q['id']
target.write_text(prefix + json.dumps(data, ensure_ascii=False) + ';\n', encoding='utf-8')
print(f'Rebuilt: {len(lessons)} lessons, {len(questions)} questions, {len(data["sources"])} source files.')
