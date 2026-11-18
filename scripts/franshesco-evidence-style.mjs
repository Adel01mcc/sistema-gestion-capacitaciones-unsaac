export const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
export const evidenceStyle = `
*{box-sizing:border-box}body{margin:0;background:#edf2f5;color:#173442;font-family:Segoe UI,Arial,sans-serif;padding:36px}
h1{font-size:34px;line-height:1.18;margin:10px 0 16px;letter-spacing:-.025em}h2{font-size:20px;margin:0 0 12px;line-height:1.35}
.eyebrow{font-size:13px;font-weight:750;letter-spacing:.13em;text-transform:uppercase;color:#087f75}
.version{background:#153847;color:white;padding:14px 18px;border-radius:8px;font-size:17px;font-weight:600;line-height:1.5;margin:0 0 14px}
.meta{font-size:15px;line-height:1.6;color:#4d6573;margin:8px 0 20px;overflow-wrap:anywhere}
.layout{display:grid;grid-template-columns:minmax(0,1fr) 330px;gap:24px;align-items:start}
.code{background:#fff;border:1px solid #cad7df;border-radius:9px;overflow:hidden}.code-title{background:#e1edea;padding:13px 20px;font-size:15px;font-weight:650;border-bottom:1px solid #c4d8d1}
pre{margin:0;padding:20px 16px;font:15px/1.7 Consolas,monospace;white-space:pre-wrap;overflow-wrap:anywhere;tab-size:2}
.line{display:block;min-height:1.7em}.line.focus{background:#e6f4ee;border-left:3px solid #078478;margin-left:-4px;padding-left:1px}.number{color:#54727f}
.note{background:white;border:1px solid #d3dfe5;border-radius:9px;padding:20px;margin-bottom:16px}.note p{font-size:17px;line-height:1.65;margin:0}.note.design{border-top:4px solid #087f75}.note.proof{border-top:4px solid #497bba}
.note .tag{display:inline-block;background:#e5f2ed;color:#086b5f;padding:5px 9px;margin:0 5px 10px 0;border-radius:5px;font-size:14px;font-weight:700}
footer{margin-top:20px;font-size:14px;color:#506978;line-height:1.7;padding:14px 0 0;border-top:1px solid #cedbe3}
`;
