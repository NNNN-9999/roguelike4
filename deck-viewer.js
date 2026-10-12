// v165: always-available, read-only deck inspection.
(function(){
const open=document.getElementById('run-deck-open');
const modal=document.getElementById('run-deck-modal');
const grid=document.getElementById('run-deck-grid');
const detail=document.getElementById('run-deck-detail');
const sort=document.getElementById('run-deck-sort');
if(!open || !modal)return;
function available(){return Boolean(typeof player!=='undefined' && player && Array.isArray(player.starterDeck)) && !['title','character','skill-tree'].includes(typeof Scene!=='undefined'?Scene.current:'title');}
function refreshVisible(){open.classList.toggle('hidden',!available());if(!available())modal.classList.add('hidden');}
function render(){
 const counts=new Map();for(const id of (player?.starterDeck||[]))if(cards[id])counts.set(id,(counts.get(id)||0)+1);
 const order={rare:0,epic:1,legendary:2};
 const entries=[...counts.entries()].sort((a,b)=>{const x=cards[a[0]],y=cards[b[0]];if(sort.value==='rarity')return (order[x.rarity]??8)-(order[y.rarity]??8);if(sort.value==='name')return x.name.localeCompare(y.name,'ja');return (x.cost||0)-(y.cost||0);});
 grid.replaceChildren();detail.textContent='カードを選ぶと詳細を表示します。';
 entries.forEach(([id,count])=>{
 const c=cards[id];const button=document.createElement('button');button.type='button';button.className='run-deck-card '+(c.rarity||'rare');
 const title=document.createElement('strong');title.textContent=c.name+' ×'+count;button.appendChild(title);
 const meta=document.createElement('div');meta.className='meta';meta.textContent=`COST ${c.cost}${c.upgraded?' / 強化済み':''}`;button.appendChild(meta);
 const effect=document.createElement('span');effect.className='effect';effect.textContent=c.description||'';button.appendChild(effect);
 button.addEventListener('click',()=>{grid.querySelectorAll('.active').forEach(el=>el.classList.remove('active'));button.classList.add('active');detail.textContent=`${c.name}｜コスト${c.cost}｜${c.description||'効果説明なし'}`;});grid.appendChild(button);
 });
 if(!entries.length)grid.textContent='カードがありません。';
}
open.addEventListener('click',()=>{if(!available())return;render();modal.classList.remove('hidden');});
modal.querySelector('.run-deck-shade').addEventListener('click',()=>modal.classList.add('hidden'));
document.getElementById('run-deck-close').addEventListener('click',()=>modal.classList.add('hidden'));
sort.addEventListener('change',render);
document.addEventListener('keydown',event=>{if(event.key==='Escape')modal.classList.add('hidden');});
window.refreshRunDeckButton=refreshVisible;refreshVisible();
})();
