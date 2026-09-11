# Nyitás előtti kiadás

A felhasználó kérése 2026-09-11-én: a www.agentakademia.hu címen csak `soon...` legyen nyilvános, a teljes alkalmazás maradjon privát.

- A Netlify kiadás a `scripts/build-coming-soon.mjs` paranccsal készül, a `dist-soon` mappából.
- A nyilvános oldalon egyetlen felirat szerepel: `soon...`. Az eredeti Fraunces betű és barna–arany arculat megmarad.
- A kiadás nem tartalmazza az alkalmazás JavaScriptjét, letölthető agentcsomagjait, példáit vagy AI-függvényeit. A korábbi alkalmazásútvonalak is a nyitóoldalt adják vissza.
- A teljes fejlesztési forrás megmarad. A privát alkalmazás: https://agent-akademia.vproperty-hu.chatgpt.site — a hozzáférés ellenőrzésekor csak a tulajdonos szerepelt az engedélyezettek között, külső látogató nélkül.
- A `node scripts/build-portable-web.mjs` továbbra is elkészíti a teljes hordozható webes alkalmazást, de ez nem a nyilvános Netlify kiadási parancs.

## Domain

2026-09-11-én a nyilvános DNS szerint:

| Név | Típus | Jelenlegi érték |
| --- | --- | --- |
| agentakademia.hu | A | 92.118.24.181 |
| www.agentakademia.hu | CNAME | agentakademia.hu |
| névszerverek | NS | ns1.tarhelykozpont.hu, ns2.tarhelykozpont.hu |

A www címet hozzá kell rendelni a meglévő `agentakademia` Netlify projekthez, majd a `www` CNAME rekord értékét `agentakademia.netlify.app` értékre kell állítani a DNS-szolgáltatónál. A levelezési rekordokat meg kell őrizni. A domain bekötése csak a DNS és a HTTPS tényleges ellenőrzése után tekinthető késznek.

## Az AI-próba állapota

A Netlify belső háttérindító titka az engedélyezett ellenőrzés során hiányzott. A `AGENT_API_SECRET` létrehozása megtörtént production/functions környezetben, titkos értékként. Az érték nem szerepel forrásban vagy mentésben.

Az utána végzett ellenőrzéskor az AI-kapcsolat továbbra is `configured:false` volt; a Netlify Identity beállítási végpontja 404-et adott. Teljes élő AI-generálás nem történt. A nyilvános próba a nyitás előtti kiadásban szándékosan nem elérhető. A privát Sites AI-hozzáférés bekötése még szükséges.
