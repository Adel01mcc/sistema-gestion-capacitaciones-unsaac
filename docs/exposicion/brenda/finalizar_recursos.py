from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import textwrap
p=Path('.')
for name in ['main.tex','comparaciones.tex']:
 s=(p/name).read_text(encoding='utf-8').replace('\\usepackage{booktabs}','').replace('\\toprule','\\hline').replace('\\midrule','\\hline').replace('\\bottomrule','\\hline')
 (p/name).write_text(s,encoding='utf-8')
font=ImageFont.truetype('C:/Windows/Fonts/consola.ttf',25)
title=ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf',33)
small=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',23)
def panel(hu,side,commit,names):
 lines=[]
 for name in names:
  if lines: lines+=['']
  for line in (p/('fragmentos/'+name+'.txt')).read_text(encoding='utf-8').splitlines():
   lines+=textwrap.wrap(line,100,replace_whitespace=False,drop_whitespace=False) or ['']
 im=Image.new('RGB',(1640,180+34*len(lines)), '#f6f8fa'); d=ImageDraw.Draw(im)
 d.rectangle((0,0,1640,115),fill='#163e51')
 d.text((35,18),hu+' | '+side+' | '+commit,font=title,fill='white')
 d.text((35,70),'src/Users.tsx | Fragmento literal de Git; lineas largas ajustadas visualmente',font=small,fill='white')
 for i,line in enumerate(lines): d.text((35,140+34*i),line,font=font,fill='#172a35')
 return im
for hu,before,after,aa,bb in [('HU01','eb00464','4cab7eb',['hu01_antes'],['hu01_despues']),('HU02','4cab7eb','6ccf4ca',['hu02_antes'],['hu02_despues','hu02_guardar_roles'])]:
 a=panel(hu,'ANTES',before,aa); b=panel(hu,'DESPUES',after,bb)
 a.save(p/(hu+'_antes.png')); b.save(p/(hu+'_despues.png'))
 im=Image.new('RGB',(1640,a.height+b.height+20),'white'); im.paste(a,(0,0)); im.paste(b,(0,a.height+20)); im.save(p/(hu+'_comparacion.png'))
print('6 PNG creados con Pillow instalado; sin generacion de imagenes por IA.')
