from pathlib import Path
import json,hashlib
p=Path('.')
ms=json.loads((p/'MANIFIESTO.json').read_text(encoding='utf-8'))
for m in ms:
 f=p/('fragmentos/'+m['fragmento']+'.txt'); data=f.read_text(encoding='utf-8').encode('utf-8'); f.write_bytes(data); m['sha256']=hashlib.sha256(data).hexdigest()
(p/'MANIFIESTO.json').write_text(json.dumps(ms,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
s=(p/'main.tex').read_text(encoding='utf-8').replace('\\texttt{CRITERIOS\\_ACEPTACION}', 'CRITERIOS\\_ACEPTACION')
s=s.replace('\\texttt{comparaciones.tex}: dos láminas independientes','\\texttt{comparaciones.tex}: dos láminas independientes')
s=s.replace('\\begin{tabular}{ll}','\\begin{tabular}{ll}')
# Allow modest extra justification space in long paths in the annex.
s=s.replace('\\setlength{\\parindent}{0pt}','\\setlength{\\parindent}{0pt}\n\\emergencystretch=2em')
(p/'main.tex').write_text(s,encoding='utf-8')
