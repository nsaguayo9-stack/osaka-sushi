const URL='https://docs.google.com/spreadsheets/d/e/2PACX-1vSaTHaLU2Tebhx_9mWYRjj7m3IJgxHV8AR8Vpxs0cInmfcUCdZRAUR-oX0oihFApw/pub?gid=1949346353&single=true&output=csv';
export default async function handler(req,res){
  try {
    const upstream=await fetch(URL,{headers:{'User-Agent':'Mozilla/5.0'},signal:AbortSignal.timeout(10000)});
    if(!upstream.ok) throw new Error(`Google Sheets HTTP ${upstream.status}`);
    const body=await upstream.text();
    if(!body.includes('categoria') || !body.includes('precio')) throw new Error('Respuesta CSV inválida');
    res.setHeader('Content-Type','text/csv; charset=utf-8');
    res.setHeader('Cache-Control','public, s-maxage=60, stale-while-revalidate=60');
    res.status(200).send(body);
  }catch(e){res.status(502).json({error:'No se pudo cargar el catálogo',detail:String(e.message)});}
}
