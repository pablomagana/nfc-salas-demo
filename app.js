const ROOMS={
 jupiter:{n:"Sala Júpiter",i:"J",m:"Planta 1 · 8 personas · pantalla",seed:[["09:00","10:00","Equipo Producto","Marta Ruiz"],["11:30","12:30","Revisión de ventas","Diego Soto"],["16:00","17:00","Entrevista de selección","Lucía Pardo"]]},
 marte:{n:"Sala Marte",i:"M",m:"Planta 1 · 4 personas",seed:[["08:30","13:30","Formación interna","Carmen Vidal"],["15:00","16:00","Llamada con cliente","Iván Mora"]]},
 venus:{n:"Sala Venus",i:"V",m:"Planta 2 · 12 personas · proyector",seed:[["10:00","11:00","Comité de dirección","Elena Navas"],["17:00","18:30","Taller de diseño","Sergio Gil"]]}};
const OPEN=8*60,CLOSE=20*60,STEP=30,MINLEN=15;
const $=id=>document.getElementById(id);
const q=new URLSearchParams(location.search);
const has=k=>typeof k==="string"&&Object.prototype.hasOwnProperty.call(ROOMS,k);
const now=()=>q.get("now")?new Date(q.get("now")):new Date();
const pad=n=>String(n).padStart(2,"0");
const hm=m=>pad(Math.floor(m/60))+":"+pad(m%60);
const toM=s=>{const[a,b]=s.split(":");return +a*60+ +b};
const dkey=d=>d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
const nowMin=()=>{const n=now();return n.getHours()*60+n.getMinutes();};
const SK="rooms-demo:";
const local=r=>{try{return JSON.parse(localStorage.getItem(SK+r)||"[]")}catch{return[]}};
const saveLocal=(r,a)=>localStorage.setItem(SK+r,JSON.stringify(a));
const bookings=(r,day)=>[...ROOMS[r].seed.map(([s,e,t,o])=>({s:toM(s),e:toM(e),t,o,seed:true})),
  ...local(r).filter(b=>b.day===day).map(b=>({...b,seed:false}))].sort((a,b)=>a.s-b.s);
const overlaps=(r,day,s,e)=>bookings(r,day).find(b=>s<b.e&&e>b.s);
const who=b=>`${b.t} · Organiza: ${b.o}`;
let room=null,day=null;
function init(){
  const r=q.get("sala");
  if(has(r)){room=r;day=dkey(now());$("room").hidden=false;renderRoom();setInterval(tick,10000);}
  else{$("home").hidden=false;if(r){$("unknown").hidden=false;$("unknown").textContent="Sala desconocida: "+r;}
    const suf=q.get("now")?"&now="+encodeURIComponent(q.get("now")):"";
    $("list").innerHTML=Object.entries(ROOMS).map(([k,v])=>{const s=quick(k);return `<a href="?sala=${k}${suf}"><span class="icon">${v.i}</span><span><span class="nm">${v.n}</span><br><span class="st ${s.c}">${s.t}</span></span></a>`}).join("");}
}
function quick(k){const t=dkey(now()),nm=nowMin();
  if(nm<OPEN||nm>=CLOSE)return{c:"bad",t:"Fuera de horario"};
  const b=overlaps(k,t,nm,nm+1);if(b)return{c:"bad",t:`Ocupada hasta las ${hm(b.e)} · ${b.o}`};
  const nx=bookings(k,t).find(x=>x.s>nm);return{c:"ok",t:"Libre"+(nx?` hasta las ${hm(nx.s)}`:" todo el día")};}
function renderStatus(){
  const today=dkey(now()),st=$("status"),btn=$("now"),nm=nowMin();
  btn.textContent="Reservar ahora";
  if(nm<OPEN||nm>=CLOSE){st.className="status bad";st.textContent="Fuera de horario (8:00–20:00)";btn.disabled=true;return;}
  const b=overlaps(room,today,nm,nm+1);
  if(b){st.className="status bad";st.innerHTML="";const a=document.createElement("span");a.textContent=`Ocupada hasta las ${hm(b.e)}`;const s=document.createElement("span");s.className="sub";s.textContent=`${b.t} (Organiza: ${b.o})`;st.append(a,s);btn.disabled=true;return;}
  const nx=bookings(room,today).find(x=>x.s>nm),free=Math.min(nx?nx.s:CLOSE,CLOSE)-nm;
  st.className="status ok";st.textContent="Libre ahora"+(nx?` hasta las ${hm(nx.s)}`:" el resto del día");
  if(free<MINLEN){btn.disabled=true;btn.textContent=`Solo quedan ${free} min libres`;}else btn.disabled=false;
}
function renderOptions(){
  const sel=$("start"),prev=sel.value,today=dkey(now()),nm=nowMin();
  const min=day===today?Math.ceil((nm+1)/STEP)*STEP:OPEN;
  sel.innerHTML="";
  for(let m=Math.max(OPEN,min);m<CLOSE;m+=STEP){const o=document.createElement("option");o.value=m;o.textContent=hm(m);sel.appendChild(o);}
  if([...sel.options].some(o=>o.value===prev))sel.value=prev;
}
function renderRoom(){
  const R=ROOMS[room];
  $("icon").textContent=R.i;$("name").textContent=R.n;$("meta").textContent=R.m;
  renderStatus();
  const base=now();$("days").innerHTML="";
  for(let i=0;i<7;i++){const d=new Date(base);d.setDate(d.getDate()+i);const k=dkey(d);
    const b=document.createElement("button");b.textContent=i===0?"Hoy":d.toLocaleDateString("es-ES",{weekday:"short",day:"numeric"});
    b.className=k===day?"sel":"";b.onclick=()=>{day=k;renderRoom();};$("days").appendChild(b);}
  const el=$("agenda");el.innerHTML="";let cur=OPEN;
  const todayK=dkey(now()),nmx=nowMin();const row=(cls,t,txt,extra,end)=>{const li=document.createElement("li");li.className=cls+(day===todayK&&end!==undefined&&end<=nmx?" past":"");const s=document.createElement("span"),tt=document.createElement("span");tt.className="t";tt.textContent=t;s.append(tt," "+txt);li.appendChild(s);if(extra)li.appendChild(extra);el.appendChild(li);};
  for(const b of bookings(room,day)){if(b.s>cur)row("",`${hm(cur)}–${hm(b.s)}`,"Libre",null,b.s);
    let x=null;if(!b.seed){x=document.createElement("button");x.textContent="Cancelar";x.onclick=()=>{saveLocal(room,local(room).filter(l=>l.id!==b.id));renderRoom();};}
    row(b.seed?"busy":"mine busy",`${hm(b.s)}–${hm(b.e)}`,who(b)+(b.seed?"":" (tu reserva)"),x,b.e);cur=Math.max(cur,b.e);}
  if(cur<CLOSE)row("",`${hm(cur)}–${hm(CLOSE)}`,"Libre",null,CLOSE);
  renderOptions();$("msg").textContent="";
}
function tick(){ // el reloj avanza con la página abierta
  const today=dkey(now());
  if(!$("days").querySelector(".sel")||dkey(now())!==today){}
  renderStatus();renderOptions();
  if(day<today){day=today;renderRoom();}
}
function fail(t){$("msg").style.color="#991b1b";$("msg").textContent=t;return false;}
function book(s,dur,org,title){
  const e=s+dur,today=dkey(now());
  if(day===today&&s<nowMin())return fail("Esa hora ya ha pasado.");
  if(s<OPEN||e>CLOSE)return fail("Debe estar dentro de 8:00–20:00.");
  const c=overlaps(room,day,s,e);
  if(c)return fail(`Se solapa con ${hm(c.s)}–${hm(c.e)} (${c.t}, ${c.o}).`);
  const a=local(room);a.push({id:Date.now()+""+Math.random(),day,s,e,t:title,o:org});saveLocal(room,a);
  renderRoom();$("msg").style.color="#166534";$("msg").textContent=`Reservada ${hm(s)}–${hm(e)} a nombre de ${org} (solo en este navegador).`;return true;
}
$("form").onsubmit=ev=>{ev.preventDefault();renderOptions();
  if(!$("start").value)return fail("No quedan horas ese día.");
  book(+$("start").value,+$("dur").value,$("who").value.trim()||"Yo (demo)","Reunión");};
$("now").onclick=()=>{
  const today=dkey(now()),nm=nowMin();day=today;
  if(nm<OPEN||nm>=CLOSE||overlaps(room,today,nm,nm+1)){renderRoom();return;}
  const nx=bookings(room,today).find(x=>x.s>nm),end=Math.min(nm+60,nx?nx.s:CLOSE,CLOSE);
  if(end-nm<MINLEN){renderRoom();return fail(`Solo quedan ${end-nm} min libres.`);}
  renderRoom();book(nm,end-nm,$("who").value.trim()||"Yo (demo)","Reserva rápida");
};
// Lectura NFC: solo acepta una URL de esta misma página (mismo origen y ruta) con una sala conocida.
function roomFromNfcUrl(raw){
  try{const u=new URL(raw,location.href);
    if(u.origin!==location.origin||u.pathname!==location.pathname)return null;
    const k=u.searchParams.get("sala");return has(k)?k:null;}catch{return null;}
}
$("scan").onclick=async()=>{const m=$("scanmsg");
  if(!("NDEFReader" in window)){m.textContent="Este navegador no permite leer NFC desde la página (solo Chrome en Android). En iPhone, acerca el móvil a la pegatina y toca el aviso si aparece.";return;}
  try{const r=new NDEFReader();await r.scan();m.textContent="Acerca la pegatina…";
    r.onreading=e=>{for(const rec of e.message.records){if(rec.recordType==="url"||rec.recordType==="absolute-url"){
      const k=roomFromNfcUrl(new TextDecoder().decode(rec.data));if(k){location.href=location.pathname+"?sala="+k;return;}}}
      m.textContent="Pegatina leída, pero no es de una sala de esta demo.";};
  }catch(err){m.textContent="No se pudo iniciar el escaneo: "+err.message;}};
init();
