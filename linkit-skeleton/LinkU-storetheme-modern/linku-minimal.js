/* Optional enhancement only. No HTML generation, routing, cart or order logic. */
(() => {
 const timers=[...document.querySelectorAll('.live-item[data-sale-end]')];
 function tick(){for(const card of timers){const out=card.querySelector('.timer-unit');if(!out)continue;const end=Date.parse(card.dataset.saleEnd);if(!Number.isFinite(end)){out.textContent='마감 시간 확인';continue;}const n=Math.max(0,Math.ceil((end-Date.now())/1000)),pad=x=>String(x).padStart(2,'0');out.textContent=n?`${Math.floor(n/86400)}일 ${pad(Math.floor(n%86400/3600))}:${pad(Math.floor(n%3600/60))}:${pad(n%60)}`:'타임세일 종료';}}
 tick();if(timers.length)setInterval(tick,1000);
 document.querySelectorAll('[data-act="link"]').forEach(button=>button.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(button.dataset.link||location.href);button.setAttribute('aria-label','링크를 복사했습니다');button.title='링크를 복사했습니다';}catch{button.title='주소창의 링크를 복사해 주세요';}}));
})();
