# Agent Akadémia: kihelyezés

A Netlify adja a weboldalt és a saját munkateret; a Render az AI-feladatokat végzi. A felhasználók az oldalon regisztrálnak, leírják a feladatot, és megkapják a mentett eredményt. Az AI-hozzáférést a működtető állítja be egyszer.

## 1. Forrás a GitHubon

Az ajánlott repónév `agent-akademia`, a tulajdonos `vpropertyhu`. A repo lehet privát; mindkét tárhely GitHub-kapcsolatának hozzá kell férnie. A teljes forrás szükséges, beleértve a `public/letoltes` és `deploy/render` generált kiadási fájljait. A kulcsok és a helyi beállítások nem kerülnek a repóba.

A jelenlegi GitHub-csatlakozó meglévő repóba tud feltölteni, új repót nem tud létrehozni. Új repo létrehozásakor egy README-vel inicializált, privát repo átadható a forrás feltöltéséhez.

## 2. AI-szolgáltatás a Renderen

Az előkészített `render.yaml` egyetlen Node.js webszolgáltatást ír le, külön adatbázis nélkül. A munkákat a Netlify tárolja, a Render fájlrendszere nem őriz felhasználói adatot.

| Beállítás | Érték |
| --- | --- |
| Név | `agent-akademia-ai` |
| Root directory | `deploy/render` |
| Runtime | Node.js 24 |
| Build command | `node --check server.mjs` |
| Start command | `node server.mjs` |
| Health check | `/health` |
| Első csomag | Free, Frankfurt |
| Automatikus telepítés | Kikapcsolva; kiadás kézzel indítható |

Render környezeti változók:

- `OPENAI_API_KEY`: a működtető OpenAI API-kulcsa, titokként.
- `AGENT_API_SECRET`: legalább 32 karakteres, véletlen közös titok. Ugyanez kerül a Netlify függvényeihez.
- `OPENAI_MODEL`: opcionális, alapértéke `gpt-5-mini`.
- `NODE_VERSION`: `24`.

A szolgáltatás URL-jét a Render adja. Ezt kell bemásolni a Netlify `AGENT_API_URL` változójába, útvonal nélkül, HTTPS-címként. Az egészségellenőrzés nem bizonyítja, hogy a modellhez már van működő kulcs.

A Render Free szolgáltatás tétlenség után elalszik, az első ébresztés késhet. A felület ilyenkor nem jelent sikeres AI-csatlakozást; később újratölthető. Folyamatos rendelkezésre álláshoz a működtető külön választhat fizetős csomagot. Ez a konfiguráció nem vásárol ilyet. [Render Free dokumentáció](https://render.com/docs/free)

## 3. Weboldal a Netlifyn

A meglévő projekt: `agentakademia`. A telepítési beállításokat a repo gyökerében lévő `netlify.toml` tartalmazza.

| Beállítás | Érték |
| --- | --- |
| Base directory | A repo gyökere |
| Build command | `pnpm run build:netlify` |
| Publish directory | `dist-netlify` |
| Functions directory | `netlify/functions` |
| Node / pnpm | 24 / 11.19.0 |

A Netlify Identity szolgáltatást engedélyezni kell. A regisztrációs beállításnak emailes belépést és email-megerősítést kell támogatnia. Meghívásos pilot esetén az új regisztráció letiltható; a felület követi ezt a beállítást. Az emailes megerősítést és jelszó-visszaállítást a végleges címen külön ki kell próbálni.

Netlify környezeti változók, **Functions** hatókörben, kezdetben csak **Production** környezetben:

- `AGENT_API_URL`: a Render szolgáltatás HTTPS-alapcíme.
- `AGENT_API_SECRET`: pontosan ugyanaz a titok, mint a Renderen.

Az OpenAI-kulcsot nem kell a Netlifyra vagy a böngészőbe tenni. A kapcsolódási titok ne legyen `VITE_` kezdetű, és ne kerüljön a klienscsomagba. A teszttelepítések alapból ne kapjanak éles AI-kapcsolatot.

A Netlify feladatindító és háttérfüggvényét is telepíteni kell. A `dist-netlify` mappa önmagában történő feltöltése csak a felületet adná át. A Netlify CLI vagy a GitHubhoz kötött normál build a függvényeket is csomagolja.

## 4. Az első éles próba

1. A végleges webcímen nyisd meg az útmutatót, és töltsd le a saját gépes csomagot.
2. Regisztrálj, erősítsd meg az emailt, majd lépj be.
3. Kérd ezt: „Taníts meg jó feladatot adni egy AI-agentnek. Adj egy rövid magyarázatot, példát és egy gyakorlatot.”
4. Várd meg az automatikusan megjelenő eredményt, majd kérj rövidebb változatot.
5. Töltsd újra az oldalt: mindkét munkának meg kell maradnia. Másik fiókból nem szabad elérhetőnek lenniük.

Ehhez már valódi, használati díjat fogyasztó modellhívás történik. Egy kérés legfeljebb két modellhívás; a napi alkalmazáskeret indításokat számol, nem költségkeret. A kulcsot biztonságos szolgáltatói beállításban add meg, ne beszélgetésben.

## Frissítés és visszaállítás

Motor- vagy felületmódosításkor előbb `pnpm run build:ai-kit`, majd `pnpm run build:netlify` szükséges. A generált saját gépes ZIP-et és a Render-motort is commitolni kell. Utána a GitHub-revízióból indítható a két telepítés. A Netlifyra történő kiadás nem telepíti át automatikusan a Rendert.

Visszaállításhoz válassz egy korábbi Netlify-telepítést és a hozzá tartozó GitHub-revíziót a Renderen. A tartós Blob-munkák külön élnek, nem törlődnek a felület visszaállításakor. A korábbi Sites/D1-adatokhoz ez a telepítés nem nyúl.

## Jelenlegi kiadási kapuk

- A Netlify Identity engedélyezését és az emailes bejelentkezést az éles oldalon ellenőrizni kell.
- A Netlify- és Render-telepítés a `vpropertyhu/agent-akademia` repót használja.
- A működtető AI-kulcsa még nincs csatlakoztatva. A helyi tesztek nem helyettesítik az első éles próbát.
