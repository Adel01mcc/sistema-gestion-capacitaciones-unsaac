from pathlib import Path
import subprocess,json,hashlib
p=Path('.'); root=p.resolve().parents[2]
for m in json.loads((p/'MANIFIESTO.json').read_text(encoding='utf-8')):
 s=subprocess.check_output(['git','show',m['commit']+':'+m['archivo']],cwd=root).decode('utf-8').splitlines()
 a=(p/('fragmentos/'+m['fragmento']+'.txt')).read_bytes()
 assert a==('\n'.join(s[m['inicio']-1:m['fin']])+'\n').encode('utf-8')
 assert hashlib.sha256(a).hexdigest()==m['sha256']
print('Verificacion final: 12 fragmentos exactos y hashes correctos.')
# Record source hashes without reading or including secrets.
names=['README.md','docs/DIAGNOSTICO_INICIAL.md','docs/IMPLEMENTATION_CONTRACT.md','docs/REQUISITOS.md','docs/BACKLOG.md','docs/CRITERIOS_ACEPTACION.md','docs/PROCESO_DESARROLLO.md','docs/ARQUITECTURA.md','docs/PRUEBAS.md','HU01_comparacion.txt','HU02_comparacion.txt','src/Users.tsx','src/api.ts']
(p/'FUENTES_SHA256.txt').write_text('\n'.join(hashlib.sha256((root/n).read_bytes()).hexdigest()+'  '+n for n in names)+'\n',encoding='utf-8')
