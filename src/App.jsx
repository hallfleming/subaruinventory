import React, { useState } from 'react';

const fetchPartData = async (partNum) => {
  try {
    const url = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://parts.subaru.com/p/${partNum}`)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const html = data?.contents || '';

    let name = 'Unknown Part';
    let m = html.match(/<div[^>]*id=['"]partName['"][^>]*>(.*?)<\/div>/i) || html.match(/<h1[^>]*>(.*?)<\/h1>/i);
    if (m && m[1]) name = m[1].replace(/<[^>]*>/g, '').trim();

    let category = 'general';
    let bc = html.match(/breadcrumb[^>]*>(.*?)<\/(nav|div)>/i);
    if (bc && bc[1]) {
      const cleaned = bc[1].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
      const guess = cleaned.split(' ').filter(Boolean).slice(-1)[0];
      if (guess && guess.length > 2) category = guess;
    }

    const buckets = [
      ['engine','engine','gasket','cylinder','oil'],
      ['interior','seat','console','dashboard','trim'],
      ['exterior','bumper','door','mirror','grille','fender'],
      ['electrical','switch','sensor','wiring','harness','electrical'],
      ['suspension','suspension','shock','strut','spring'],
      ['transmission','transmission','clutch','gear'],
      ['brakes','brake','rotor','pad','caliper']
    ];

    const lowerName = name.toLowerCase();
    for (const [bucket, ...keys] of buckets) {
      if (keys.some(k => lowerName.includes(k))) { category = bucket; break; }
    }

    let price = 'N/A';
    const pm = html.match(/\$\s*[0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?/);
    if (pm) price = pm[0].replace(/\s+/g, '');

    return { partNumber: partNum, name, category, price };
  } catch (e) {
    console.warn('fetchPartData failed:', e);
    return { partNumber: partNum, name: 'Unknown Part', category: 'general', price: 'N/A' };
  }
};

export default function App() {
  const [parts, setParts] = useState([]);
  const [partNumber, setPartNumber] = useState('');
  const [manualName, setManualName] = useState('');
  const [condition, setCondition] = useState('new');
  const [manualPrice, setManualPrice] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const addPart = async () => {
    if (!partNumber.trim()) return;
    setLoading(true);
    const fetched = await fetchPartData(partNumber.trim());
    const finalName = manualName || fetched.name;
    const finalPrice = fetched.price !== 'N/A' ? fetched.price : (manualPrice || 'N/A');
    const newPart = {
      id: Date.now(),
      partNumber: fetched.partNumber,
      name: finalName,
      condition,
      category: fetched.category,
      price: finalPrice,
      image
    };
    setParts(p => [newPart, ...p]);
    setPartNumber('');
    setManualName('');
    setManualPrice('');
    setCondition('new');
    setImage(null);
    setLoading(false);
  };

  const onImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setImage(reader.result);
    reader.readAsDataURL(file);
  };

  const filtered = parts.filter(part => {
    const matchCat = filter === 'all' || part.category === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || part.partNumber.toLowerCase().includes(q) || part.name.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  return (
    <div style={{fontFamily:'system-ui, sans-serif', padding:16, maxWidth:960, margin:'0 auto'}}>
      <h1>Subaru Parts Inventory</h1>

      <div style={{display:'grid', gap:8, gridTemplateColumns:'1fr', marginBottom:16}}>
        <input placeholder="Part number" value={partNumber} onChange={e=>setPartNumber(e.target.value)} />
        <input placeholder="Part name (optional override)" value={manualName} onChange={e=>setManualName(e.target.value)} />
        <select value={condition} onChange={e=>setCondition(e.target.value)}>
          <option value="new">New</option>
          <option value="used">Used</option>
        </select>
        <input placeholder="Manual price (optional)" value={manualPrice} onChange={e=>setManualPrice(e.target.value)} />
        <input type="file" accept="image/*" onChange={onImage} />
        <button onClick={addPart} disabled={loading}>{loading ? 'Adding…' : 'Add Part'}</button>
      </div>

      <div style={{display:'flex', gap:8, alignItems:'center', marginBottom:12}}>
        <label>Filter:</label>
        <select value={filter} onChange={e=>setFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="general">General</option>
          <option value="engine">Engine</option>
          <option value="interior">Interior</option>
          <option value="exterior">Exterior</option>
          <option value="electrical">Electrical</option>
          <option value="suspension">Suspension</option>
          <option value="transmission">Transmission</option>
          <option value="brakes">Brakes</option>
        </select>
        <input placeholder="Search…" value={search} onChange={e=>setSearch(e.target.value)} style={{flex:1}} />
      </div>

      <div style={{display:'grid', gap:12}}>
        {filtered.map(p => (
          <div key={p.id} style={{border:'1px solid #ddd', borderRadius:8, padding:12}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline'}}>
              <strong>Part # {p.partNumber}</strong>
              <span>{p.price}</span>
            </div>
            <div style={{opacity:0.9}}>{p.name}</div>
            <div style={{fontSize:12, color:'#555'}}>Condition: {p.condition} • Category: {p.category}</div>
            {p.image && <img alt="part" src={p.image} style={{marginTop:8, maxWidth:'100%', borderRadius:6}} />}
          </div>
        ))}
        {filtered.length === 0 && <div>No parts yet.</div>}
      </div>
    </div>
  );
}
