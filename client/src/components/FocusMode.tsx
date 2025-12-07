// src/components/FocusMode.tsx
import React, { useEffect, useRef, useState } from "react";

export default function FocusMode({trackedText}:{trackedText:string}){
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(25*60);
  const [typedChars, setTypedChars] = useState(0);
  const lastLen = useRef<number>(trackedText.length);

  useEffect(()=>{
    if(!running) return;
    const t = setInterval(()=> setSeconds(s=> s-1), 1000);
    return () => clearInterval(t);
  },[running]);

  useEffect(()=>{
    // update typed chars by diff
    const diff = Math.max(0, trackedText.length - lastLen.current);
    if(diff>0) setTypedChars(c=>c+diff);
    lastLen.current = trackedText.length;
  },[trackedText]);

  useEffect(()=>{
    if(seconds <= 0 && running){
      setRunning(false);
      alert("Focus session ended — summary shown");
    }
  },[seconds,running]);

  const start = ()=> { setRunning(true); setSeconds(25*60); setTypedChars(0); lastLen.current = trackedText.length; };
  const stop = ()=> setRunning(false);

  const mm = Math.floor(seconds/60).toString().padStart(2,'0');
  const ss = (seconds%60).toString().padStart(2,'0');

  return (
    <div>
      <div className="focus-top">
        <div>
          <div style={{fontWeight:700}}>{mm}:{ss}</div>
          <div className="small">Pomodoro session</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          {!running ? <button className="btn" onClick={start}>Start</button> : <button className="btn" onClick={stop}>Stop</button>}
        </div>
      </div>

      <div style={{marginTop:10}}>
        <div className="kv"><div className="small">Typed this session</div><div>{typedChars} chars</div></div>
      </div>
    </div>
  )
}
    