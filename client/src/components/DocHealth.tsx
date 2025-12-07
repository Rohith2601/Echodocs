// src/components/DocHealth.tsx
import React, { useMemo } from "react";

export default function DocHealth({content}:{content:string}){
  const stats = useMemo(()=>{
    const text = content || "";
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const sentences = text.trim() ? (text.match(/[^.!?]+[.!?]*/g) || []).length : 0;
    const readMin = Math.max(1, Math.ceil(words / 200));
    const sentencesArr = text.split(/[.!?]+/).filter(Boolean);
    const longest = sentencesArr.reduce((a,b)=> Math.max(a, b.trim().length), 0);
    return {words,sentences,readMin,longest};
  },[content]);

  return (
    <div>
      <div className="kv"><div className="small">Words</div><div>{stats.words}</div></div>
      <div className="kv"><div className="small">Sentences</div><div>{stats.sentences}</div></div>
      <div className="kv"><div className="small">Est. read</div><div>{stats.readMin} min</div></div>
      <div className="kv"><div className="small">Longest sentence</div><div>{stats.longest} chars</div></div>
    </div>
  )
}
