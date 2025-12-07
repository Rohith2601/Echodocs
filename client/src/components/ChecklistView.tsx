// src/components/ChecklistView.tsx
import React from "react";

function parseChecklist(text:string){
  const lines = text.split("\n");
  const items = lines.map((ln, idx) => {
    const m = ln.match(/^\s*[-*]\s*\[( |x|X)\]\s*(.*)$/);
    if(m) return { idx, checked: m[1].toLowerCase() === 'x', text: m[2] };
    return null;
  }).filter(Boolean) as any[];
  return {items, lines};
}

export default function ChecklistView({content, setContent}:{content:string, setContent:(c:string)=>void}){
  const {items, lines} = parseChecklist(content);

  if(items.length === 0) return <div className="small">No checklists detected. Use `- [ ] Item` to create tasks.</div>;

  const toggle = (it:any) => {
    const lnIdx = it.idx;
    const line = lines[lnIdx];
    if(!line) return;
    const m = line.match(/^\s*([-*]\s*)\[( |x|X)\]\s*(.*)$/);
    if(!m) return;
    const pre = m[1];
    const newLine = pre + (it.checked ? "[ ] " : "[x] ") + it.text;
    const newLines = [...lines];
    newLines[lnIdx] = newLine;
    setContent(newLines.join("\n"));
  };

  return (
    <div className="checklist">
      {items.map(it => (
        <div key={it.idx} className="checklist-item">
          <input type="checkbox" checked={it.checked} onChange={()=>toggle(it)} />
          <div style={{fontSize:14}}>{it.text}</div>
        </div>
      ))}
    </div>
  );
}
