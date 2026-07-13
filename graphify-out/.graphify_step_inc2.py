import json
from graphify.detect import detect_incremental
from pathlib import Path

result = detect_incremental(Path('.'))
Path('graphify-out/.graphify_incremental.json').write_text(json.dumps(result, ensure_ascii=False), encoding="utf-8")
nf = result.get('new_files', {})
for cat, files in nf.items():
    if files:
        print(cat, len(files))
        for f in files[:12]:
            print('   ', f)
print('deleted:', len(result.get('deleted_files', [])))
