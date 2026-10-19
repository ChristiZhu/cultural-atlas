"""Pin all browser modules to one release without changing shared Node/test imports.
Usage: python3 scripts/version-browser-modules.py RELEASE
"""
from pathlib import Path
import json,re,sys,posixpath
root=Path(__file__).resolve().parents[1]
version=sys.argv[1]
assert re.fullmatch(r'[A-Za-z0-9_-]+',version)
imports={}
for file in (root/'dist/scripts').rglob('*.js'):
 rel=file.relative_to(root/'dist').as_posix()
 imports['./'+rel]='./'+rel+'?v='+version
 for match in re.finditer(r"(?:from\s*|import\s*)['\"]([^'\"]+\.js(?:\?[^'\"]*)?)['\"]",file.read_text()):
  source=match[1]
  if not source.startswith('.'):continue
  path=posixpath.normpath(posixpath.join(posixpath.dirname(rel),source))
  imports['./'+path]='./'+path.split('?')[0]+'?v='+version
html=root/'dist/index.html';s=html.read_text()
s=re.sub(r'    <!-- browser-module-release -->[\s\S]*?    <!-- /browser-module-release -->\n','',s)
block='    <!-- browser-module-release -->\n    <script type="importmap">'+json.dumps({'imports':dict(sorted(imports.items()))},ensure_ascii=False,separators=(',',':'))+'</script>\n    <!-- /browser-module-release -->\n'
s=s.replace('    <script type="module"',block+'    <script type="module"',1)
s=re.sub(r'(src="\./scripts/app\.js)\?[^\"]+',r'\1?v='+version,s)
s=re.sub(r'(href="\./styles/(?:community|localization|navigation|map|library|about|pattern)\.css)(?:\?[^\"]*)?',r'\1?v='+version,s)
html.write_text(s)
print('Pinned',len(imports),'browser module URLs to',version)
