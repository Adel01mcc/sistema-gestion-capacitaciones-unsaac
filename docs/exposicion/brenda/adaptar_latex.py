from pathlib import Path
p=Path('.')
pre=r'''\documentclass[10pt]{article}
\usepackage[paperwidth=280mm,paperheight=175mm,margin=12mm]{geometry}
\usepackage[T1]{fontenc}
\usepackage[utf8]{inputenc}
\usepackage[spanish]{babel}
\usepackage{lmodern}
\usepackage{xcolor}
\usepackage{listings}
\usepackage{booktabs}
\definecolor{paz}{RGB}{22,62,81}
\definecolor{acento}{RGB}{0,125,137}
\setlength{\parindent}{0pt}
\setlength{\parskip}{5pt}
\newenvironment{frame}[1]{\clearpage\begingroup\large\ifx\relax#1\relax\else{\color{paz}\LARGE\bfseries #1\par}\vspace{2mm}\hrule\vspace{3mm}\fi}{\par\endgroup}
\newenvironment{block}[1]{\par{\color{acento}\bfseries #1}\par\vspace{-1mm}}{\par}
\newenvironment{columns}[1][]{\par\noindent}{\par}
\newenvironment{column}[1]{\begin{minipage}[t]{#1}}{\end{minipage}\hfill}
\newcommand{\institute}[1]{\def\institucion{#1}}
\newcommand{\subtitle}[1]{\def\subtitulo{#1}}
\makeatletter
\renewcommand{\maketitle}{\begin{center}\vspace*{7mm}{\color{paz}\large\institucion\par}\vspace{8mm}{\color{paz}\LARGE\bfseries\@title\par}\vspace{4mm}{\large\subtitulo\par}\vspace{8mm}{\large\@author\par}\vspace{5mm}\@date\end{center}}
\makeatother
\lstset{basicstyle=\ttfamily\scriptsize,breaklines=true,columns=fullflexible,keepspaces=true,showstringspaces=false,frame=single,rulecolor=\color{black!15},backgroundcolor=\color{black!2},tabsize=2}
\newcommand{\codigo}[1]{\lstinputlisting{fragmentos/#1.txt}}
\newcommand{\fuente}[1]{{\scriptsize\color{paz}Fuente: \texttt{src/Users.tsx}; #1. Rangos exactos en MANIFIESTO.json.}\par}
'''
for name in ['main.tex','comparaciones.tex']:
    s=(p/name).read_text(encoding='utf-8')
    marker='\\title{' if name=='main.tex' else '\\begin{document}'
    s=pre+s[s.index(marker):]
    s=s.replace('\\begin{frame}\\titlepage','\\begin{frame}{}\\maketitle')
    (p/name).write_text(s,encoding='utf-8')
read=(p/'README.md').read_text(encoding='utf-8').replace('Presentación Beamer 16:9','Presentación en páginas horizontales (clase article; sin Beamer)')
(p/'README.md').write_text(read,encoding='utf-8')
