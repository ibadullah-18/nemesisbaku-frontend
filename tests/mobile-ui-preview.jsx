import SiteInput from "../src/components/common/SiteInput";
// Isolated UI and basket regression fixture: never contacts production.
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '../src/i18n/LanguageContext';
import Navbar from '../src/components/layout/Navbar';
import SiteSelect from '../src/components/common/SiteSelect';
import KeyboardViewport from '../src/components/common/KeyboardViewport';
import { basketApi } from '../src/api/basketApi';
import { saveTokens, clearTokens } from '../src/api/apiFetch';
import '../src/index.css';
import '../src/components/common/storefront.css';
let items = [{ id:'test', quantity:1 }];
window.fetch = async (url, options = {}) => {
  if (String(url).includes('/api/Basket')) {
    if (options.method === 'DELETE') items=[];
    if (options.method === 'POST') items=[{id:'test',quantity:1}];
    return new Response(JSON.stringify({data:{items}}),{status:200});
  }
  if (String(url).includes('/api/StoreInfo')) return new Response(JSON.stringify({data:{storeName:'nemesisbaku'}}),{status:200});
  throw new Error('Preview does not allow external requests');
};
function Fixture() {
 const [value,setValue]=useState('black');
 const [date,setDate]=useState('2024-02-29');
 return <><Navbar/><KeyboardViewport/><main style={{padding:'110px 20px',minHeight:'160vh'}}>
 <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>
 <button onClick={()=>saveTokens('local-fixture','')}>Test sign in</button>
 <button onClick={()=>clearTokens()}>Test sign out</button>
 <button onClick={()=>basketApi.remove('test')}>Delete item</button>
 <button onClick={()=>basketApi.add({productVariantId:'test'})}>Add item</button>
 </div>
 <label>Tarix<SiteInput aria-label="Tarix" type="date" noPast value={date} onChange={e=>setDate(e.target.value)} /></label>
 <label style={{display:'block',marginTop:30}}>Rəng <SiteSelect aria-label="Rəng" value={value} onChange={e=>setValue(e.target.value)} className="h-12 w-full border rounded-lg px-4"><option value="black">Qara</option><option value="white">Ağ</option><option value="red">Qırmızı</option></SiteSelect></label>
 <label style={{display:'block',marginTop:200}}>Yazı<input className="border p-3 w-full" placeholder="Yazın" /></label>
 </main></>;
}
createRoot(document.getElementById('root')).render(<LanguageProvider><MemoryRouter><Fixture/></MemoryRouter></LanguageProvider>);
