// src/components/ReplayPlayer.tsx
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";

export default function ReplayPlayer({docId}:{docId:string}){
  const [ops, setOps] = useState<any[]>([]);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [preview, setPreview] = useState("");
  const timerRef = useRef<number|undefined>(undefined);

  useEffect(()=>{
    axios.get(`/api/ops?docId=${docId}`).then(r=> setOps(r.data)).catch(()=> {
      // demo ops
      setOps([
        {type:"insert", index:0, text:"Hello", timestamp: Date.now()},
        {type:"insert", index:5, text:" world", timestamp: Date.now()+300},
      ]);
    });
  },[docId]);

  useEffect(()=>{
    if(!playing) { if(timerRef.current) window.clearInterval(timerRef.current); return; }
    setPreview("");
    let local = "";
    let i = 0;
    timerRef.current = window.setInterval(()=>{
      if(i >= ops.length){ window.clearInterval(timerRef.current); setPlaying(false); return; }
      const op = ops[i++];
      if(op.type === "insert") local = local.slice(0, op.index) + op.text + local.slice(op.index);
      else if(op.type === "delete") local = local.slice(0, op.index) + local.slice(op.index + op.length);
      setPreview(local);
      setPosition(i);
    }, 400);
    return ()=> { if(timerRef.current) window.clearInterval(timerRef.current); }
  },[playing, ops]);

  return (
    <div>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        <button className="btn" onClick={()=> setPlaying(p=>!p)}>{playing? "Stop": "Replay"}</button>
        <div className="small">{position}/{ops.length} ops</div>
      </div>

      <div style={{marginTop:8}} className="replay-area">
        <pre style={{whiteSpace:"pre-wrap", margin:0}}>{preview || "(preview)"}</pre>
      </div>
    </div>
  )
}
