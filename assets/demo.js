const DB = await (await fetch(new URL("./demo-data.json", import.meta.url))).json();
globalThis.__LOG = [];
function q(table){
  const st={table,filters:[],op:"select",payload:null,single:false,maybe:false};
  const api={
    select(){ if(st.op!=="select") st.ret=true; return api;},
    insert(p){st.op="insert";st.payload=p;return api;}, upsert(p){st.op="upsert";st.payload=p;return api;},
    update(p){st.op="update";st.payload=p;return api;}, delete(){st.op="delete";return api;},
    eq(k,v){st.filters.push([k,v]);return api;}, in(k,vs){ st.ins=(st.ins||[]).concat([[k,vs]]); return api;}, not(k,op,v){ const ids=String(v).replace(/[()]/g,"").split(","); st.nots=(st.nots||[]).concat([[k,ids]]); return api;}, order(){return api;},
    single(){st.single=true;return api;}, maybeSingle(){st.maybe=true;return api;},
    then(res,rej){ try{ res(run(st)); }catch(e){ rej?rej(e):0; } }
  };
  return api;
}
function run(st){
  const rows=DB[st.table]??(DB[st.table]=[]);
  const match=(r)=>st.filters.every(([k,v])=>r[k]===v) && (st.ins||[]).every(([k,vs])=>vs.includes(r[k])) && (st.nots||[]).every(([k,ids])=>!ids.includes(r[k]));
  globalThis.__LOG.push(st.op+":"+st.table);
  if(st.op==="select"){ let r=rows.filter(match); if(st.single) return {data:r[0]??null,error:null}; if(st.maybe) return {data:r[0]??null,error:null}; return {data:r,error:null}; }
  if(st.op==="insert"||st.op==="upsert"){ const arr=Array.isArray(st.payload)?st.payload:[st.payload]; const out=arr.map(p=>({id:p.id??crypto.randomUUID(),created_at:new Date().toISOString(),owner_id:"u1",...p})); out.forEach(o=>{const i=rows.findIndex(r=>r.id===o.id); if(i>=0)rows[i]={...rows[i],...o}; else rows.push(o);}); return {data:st.single||st.maybe?out[0]:out,error:null}; }
  if(st.op==="update"){ rows.filter(match).forEach(r=>Object.assign(r,st.payload)); return {data:null,error:null}; }
  if(st.op==="delete"){ DB[st.table]=rows.filter(r=>!match(r)); return {data:null,error:null}; }
}
export function createClient(){ return { from:(t)=>q(t),
  auth:{ getSession:async()=>({data:{session:{user:{id:"u1"},access_token:"demo"}}}), onAuthStateChange(){}, signInWithPassword:async()=>({}), signUp:async()=>({}), signOut:async()=>{} } }; }
