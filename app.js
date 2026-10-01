'use strict';
const cardVersion = '20261001-ceo';
const colors = {krem:'Krem',granat:'Granat',biel:'Biel'};
const colorClasses = {krem:'cream',granat:'navy',biel:'white'};
const byId = id => document.getElementById(id);
let people = [], selected, currentLang = 'pl', currentColor = 'krem', uv = true, compare = false;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const touchDevice = matchMedia('(hover: none)');
let statusTimer;
function announce(message) { byId('status').textContent=message; clearTimeout(statusTimer); statusTimer=setTimeout(()=>byId('status').textContent='',4500); }
function route(person,lang,color) { location.hash=`${person}/${lang}/${color}`; }
function cardFigure(person,lang,color,side,zoom=false) {
  const figure=document.createElement('figure'); figure.className='card-figure';
  const sideName=side==='front'?'Przód':'Tył';
  const card=document.createElement('div'); card.className='card-object';
  card.style.background=color==='granat'?'#202c38':color==='biel'?'#fff':'#f3efe5';
  card.style.setProperty('--mask',`url("assets/cards/${person.id}-${lang}-uv-${side}.svg?v=${cardVersion}")`);
  card.dataset.person=person.id;card.dataset.lang=lang;card.dataset.color=color;card.dataset.side=side;
  const img=document.createElement('img');
  img.src=`assets/cards/${person.id}-${lang}-${color}-${side}.svg?v=${cardVersion}`;
  img.alt=`${person.name}, ${lang.toUpperCase()}, ${colors[color].toLowerCase()}, ${sideName.toLowerCase()}`;
  img.width=1080;img.height=600;img.draggable=false;
  card.append(img);
  for(const type of ['shadow','bevel','gloss']) { const layer=document.createElement('span');layer.className=`uv-layer uv-${type}`;layer.setAttribute('aria-hidden','true');card.append(layer); }
  if(!zoom) { card.tabIndex=0;card.setAttribute('role','button');card.setAttribute('aria-label',`Powiększ: ${img.alt}`);card.addEventListener('click',()=>openZoom(person,lang,color,side));card.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();openZoom(person,lang,color,side);}}); }
  card.addEventListener('pointermove',event=>{
    if(reducedMotion.matches||event.pointerType==='touch')return;
    const r=card.getBoundingClientRect(),x=(event.clientX-r.left)/r.width,y=(event.clientY-r.top)/r.height;
    card.classList.add('is-moving');
    card.style.setProperty('--rx',`${(0.5-y)*5}deg`);card.style.setProperty('--ry',`${(x-0.5)*7}deg`);
    card.style.setProperty('--light-x',`${x*100}%`);card.style.setProperty('--light-y',`${y*100}%`);
  });
  card.addEventListener('pointerleave',()=>{card.classList.remove('is-moving');card.style.setProperty('--rx','0deg');card.style.setProperty('--ry','0deg');card.style.setProperty('--light-x','30%');card.style.setProperty('--light-y','20%');});
  figure.append(card);
  const cap=document.createElement('figcaption');cap.innerHTML=`<span class="side-number">${side==='front'?'01':'02'}</span> ${sideName}<svg class="zoom-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M3 8V3h5M12 3h5v5M17 12v5h-5M8 17H3v-5"/></svg>`;figure.append(cap);
  return figure;
}
function openZoom(person,lang,color,side) {
  byId('zoom-card').replaceChildren(cardFigure(person,lang,color,side,true));
  byId('zoom-title').textContent=`${person.name} · ${lang.toUpperCase()} · ${colors[color]} · ${side==='front'?'Przód':'Tył'}`;
  byId('zoom').showModal();
}
function renderComparison() {
  byId('comparison').hidden=!compare;
  byId('compare').setAttribute('aria-pressed',String(compare));
  byId('compare').innerHTML=compare?'Zwiń porównanie <span aria-hidden="true">↑</span>':'Porównaj trzy kolory <span aria-hidden="true">↓</span>';
  if(!compare){byId('comparison-cards').replaceChildren();return;}
  byId('comparison-language').textContent=currentLang==='pl'?'Wersja polska':'English version';
  const rows=Object.entries(colors).map(([color,label])=>{
    const row=document.createElement('div');row.className='compare-row';
    const title=document.createElement('div');title.className='compare-label';title.innerHTML=`<span class="swatch ${colorClasses[color]}"></span>${label}`;
    row.append(title,cardFigure(selected,currentLang,color,'front'),cardFigure(selected,currentLang,color,'back'));return row;
  });
  byId('comparison-cards').replaceChildren(...rows);
}
function render() {
  const [personId,lang,color]=location.hash.slice(1).split('/');
  selected=people.find(p=>p.id===personId)||people[0];
  currentLang=lang==='en'?'en':'pl';currentColor=Object.hasOwn(colors,color)?color:'krem';
  const canonical=`#${selected.id}/${currentLang}/${currentColor}`;
  if(location.hash!==canonical)history.replaceState(null,'',canonical);
  document.title=`${selected.name} · ${currentLang.toUpperCase()} · ${colors[currentColor]} — PRESCOT`;
  byId('person-name').textContent=selected.name;
  byId('person-role').textContent=selected.roles[currentLang];
  byId('edition').textContent=`${colors[currentColor]} · ${currentLang.toUpperCase()}`;
  document.querySelectorAll('.person').forEach(el=>el.setAttribute('aria-current',String(el.dataset.person===selected.id)));
  document.querySelectorAll('[data-lang]').forEach(el=>{if(el.tagName==='BUTTON')el.setAttribute('aria-pressed',String(el.dataset.lang===currentLang));});
  document.querySelectorAll('[data-color]').forEach(el=>{if(el.tagName==='BUTTON')el.setAttribute('aria-pressed',String(el.dataset.color===currentColor));});
  byId('cards').replaceChildren(cardFigure(selected,currentLang,currentColor,'front'),cardFigure(selected,currentLang,currentColor,'back'));
  renderComparison();
}
function effectHint() {
  byId('effect-hint').innerHTML=uv?(touchDevice.matches?'<span class="sparkle" aria-hidden="true">✧</span> Delikatny połysk na elementach pokrytych lakierem.':'<span class="sparkle" aria-hidden="true">✧</span> Porusz kursorem nad wizytówką, aby zobaczyć połysk.'):'Podgląd bez efektu lakieru.';
}
async function init() {
  try {
    const response=await fetch(`assets/cards.json?v=${cardVersion}`);if(!response.ok)throw Error('Nie udało się wczytać wizytówek.');
    people=await response.json();
    byId('people').replaceChildren(...people.map(p=>{
      const button=document.createElement('button');button.type='button';button.className='person';button.dataset.person=p.id;
      const name=document.createElement('strong');name.textContent=p.name;
      const role=document.createElement('small');role.textContent=p.roles.pl;
      button.append(name,role);button.addEventListener('click',()=>route(p.id,currentLang,currentColor));return button;
    }));
    document.querySelectorAll('button[data-lang]').forEach(button=>button.addEventListener('click',()=>route(selected.id,button.dataset.lang,currentColor)));
    document.querySelectorAll('button[data-color]').forEach(button=>button.addEventListener('click',()=>route(selected.id,currentLang,button.dataset.color)));
    window.addEventListener('hashchange',render);
    byId('uv-toggle').addEventListener('click',()=>{uv=!uv;document.body.classList.toggle('uv-off',!uv);byId('uv-toggle').setAttribute('aria-checked',String(uv));effectHint();});
    byId('compare').addEventListener('click',()=>{compare=!compare;renderComparison();});
    byId('share').addEventListener('click',async()=>{
      try {await navigator.clipboard.writeText(location.href);announce('Link do wybranego wariantu skopiowany.');}
      catch {const input=document.createElement('textarea');input.value=location.href;input.style.position='fixed';input.style.opacity='0';document.body.append(input);input.select();const copied=document.execCommand('copy');input.remove();announce(copied?'Link do wybranego wariantu skopiowany.':`Link do tego wariantu: ${location.href}`);}
    });
    byId('close-zoom').addEventListener('click',()=>byId('zoom').close());
    byId('zoom').addEventListener('click',e=>{if(e.target===byId('zoom')){const r=byId('zoom').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)byId('zoom').close();}});
    render();effectHint();
  }catch(error){byId('status').textContent=`${error.message} Odśwież stronę, aby spróbować ponownie.`;}
}
init();
