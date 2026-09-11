export function Pawn({className='',size=40}:{className?:string;size?:number}){
 return <svg className={className} width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true"><circle cx="24" cy="11.5" r="7.5" fill="currentColor"/><path d="M19.5 24 C19.5 30 16.5 33.5 15 37 H33 C31.5 33.5 28.5 30 28.5 24 Z" fill="currentColor"/><rect x="11" y="37" width="26" height="4.5" rx="1.5" fill="currentColor"/><rect x="7.5" y="41.5" width="33" height="5" rx="2" fill="currentColor"/><rect x="14.5" y="19" width="19" height="5" rx="2" fill="#e09b12"/></svg>;
}
