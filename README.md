# Agent Akadémia — az első saját AI-agent kezdőknek

Magyar nyelvű tanulási és munkakörnyezet azoknak, akik segítség nélkül nem tudnak saját agentet készíteni.

## Netlify weboldal és Render AI-szolgáltatás

Az arculat az eredeti Claude-forrás (`foter/agens/agens.css`, `agens/index.html`) és az átadott grafikai csomag alapján került helyreállításra: eredeti sakkgyalog, kétszínű szólogó, sötét nyitósáv, papírfelület, arany rangjel, négy információs kocka, Fraunces és Archivo. A működés leírása a ténylegesen elkészült AI-ra vonatkozik.

A nyilvános változat ugyanazt a kezdőknek szóló AI-munkafelületet, arculatot, oktatást és saját gépes csomagot használja. A webes felhasználó emailes fiókkal lép be; a működtető biztosítja a központi AI-hozzáférést. A tanulónak a webes használathoz nem kell API-kulcs.

| Feladat | Helye |
| --- | --- |
| Nyilvános weboldal, útmutató, letöltések | Netlify; `deploy/web/` |
| Emailes bejelentkezés és jelszó-visszaállítás | Netlify Identity; `@netlify/identity` |
| Saját háttér, mentett munkák, feladatkeret | Netlify Blobs; szerveroldali, felhasználónként elkülönített adatok |
| Hitelesítés, feladat befogadása, háttérmunka indítása | Netlify Functions; `netlify/functions/` |
| Valódi alkotás és külön modell-alapú átnézés | Render; `deploy/render/` |
| Verziózott forrás és telepítési beállítások | Ugyanaz a Git-repozitórium; `netlify.toml`, `render.yaml` |
| AI a saját gépen | A weboldalról letölthető, Node.js alapú csomag |

A hosszú generálás háttérfüggvényben fut. A felület négy másodpercenként olvassa az állapotot, és magától megmutatja az eredményt. A frissítés nem indít új modellhívást. A feladat befogadása és a dolgozó kizárólagos zárolása feltételes, atomi Blob-írással történik. A napi 20/fiók és 200/alkalmazás keret a sikertelen indításokat is számolja. A Render-végpontokat rövid élettartamú, a kérés teljes tartalmához kötött HMAC-aláírás védi.

A végleges Netlify-telepítés helyszintű adattárat használ, az előnézetek telepítésenként külön adattárat. A korábbi Sites/D1-munkák megmaradnak a régi példányban; az új Netlify-fiókokba nincs automatikus adatmigráció. A régi számlaminta nem kerül át Netlify API-végpontként; a korábbi számoló/rendező eszközök az offline műhelyben elérhetők.

**Telepítési útmutató:** [deploy/TELEPITES.md](deploy/TELEPITES.md).

```sh
pnpm install --frozen-lockfile
pnpm run build:ai-kit
pnpm run build:netlify
node node_modules/typescript/bin/tsc --noEmit
node tests/portable-deploy.mjs
```

A Netlify a `dist-netlify` könyvtárat és a `netlify/functions` függvényeket telepíti. A Render a `deploy/render` könyvtárból indul, külső csomagtelepítés nélkül. Az ottani generált `ai-engine.mjs` és `signing.mjs` ugyanabból a közös forrásból épül; motorváltoztatás után a `build:netlify` futtatása és a generált fájlok commitolása is szükséges.

### Ellenőrzött állapot az átadáskor

A webes csomag és a Netlify-függvények helyben lefordultak. A tényleges API-kezelők, a háttérdolgozó és a Render HTTP-szerver tesztjei sikeresek: tulajdonosi elkülönítés, hibás eredet elutasítása, párhuzamos indítások korlátozása, egyszeri feldolgozás, verziókonfliktus, előzmények, aláírás és újrajátszás elleni védelem. A tesztek az Identityt, a Blobs tárhelyet és az OpenAI-válaszokat helyettesítik; élő bejelentkezést, szolgáltatói tárhelyet vagy modellminőséget nem igazolnak.

A kiadás célja a meglévő `agentakademia` Netlify-projekt és a `vpropertyhu/agent-akademia` GitHub-repó. A Render AI-szolgáltatás külön települ. Az éles generálás a működtető OpenAI-hozzáférésének beállítása után ellenőrizhető.

Az alábbi fejezetek a korábbi Sites-változatok dokumentációi.

## Hatodik változat — tanulás, saját agent, valódi tartalomalkotás

A célközönség olyan kezdő, aki nem tud agentet építeni. A kezdőoldal ezért egy kész Tartalomkészítőt és három rövid használati lépést ad. Egy agent hat munkafajtával: kampány, hirdetés, megkeresés, ügyfélválasz, tananyag, szabad feladat. Ezek ugyanazon AI-munkatárs feladatmódjai, nem hat külön integrált rendszer.

- `lib/ai-agent.ts`: valódi OpenAI Responses API-hívás, strukturált kimenet; alkotás, majd külön szerkesztési/ellenőrzési modelllépés. Lényegi hiánynál legfeljebb három kérdés. Nincs kész eredményt előállító helyettesítő sablon és nincs automatikus újrapróbálás. A tények helyességét a modell átnézése önmagában nem bizonyítja.
- D1-ben felhasználónként külön céges háttér, módosítási verzió, változtathatatlan munkaelőzmények és folytatások. Az új feladat a háttérből dolgozik, a folytatás az előzményekből is. Legfeljebb hat korábbi lépés és 140 000 karakternyi előzmény kerül egy kérésbe.
- Weben 20 indítás/fiók és összesen 200 indítás az alkalmazásban, gördülő 24 órában; hibás modellhívások is számítanak. Egy felhasználónak egyszerre egy aktív futás. Az atomi adatbázis-befogadás a szolgáltatói hívás előtt történik. Egy indítás legfeljebb két, egyenként 8000 kimeneti tokenre korlátozott hívás.
- A webes modellkulcs kizárólag a szerveren. `store:false`; a háttér, kérés és az adott munka előzményei a modellhez kerülnek. Nincs böngészés, külső küldés, publikálás, gépi parancsvégrehajtás vagy automatikus időzítés az AI-agentben.
- `public/letoltes/agent-akademia-ai.zip`: ugyanaz a React-felület és AI-motor saját gépen. Vezetett kapcsolódás, egyszer megjegyzett háttér, helyi előzmények és verziónként külön Markdown-fájl a `munkak` mappában. A háttér TXT/MD fájlból külön betölthető.
- A helyi szerver csak `127.0.0.1` címen hallgat. Saját indítási munkamenet, HttpOnly/SameSite cookie, Host- és Origin-ellenőrzés, lezárt statikus fájlkiszolgálás. A kulcs a helyi szerver privát, POSIX rendszeren 0600 jogosultságú fájljában; sosem kerül a klienscsomagba. Műveletenként egy futás, napi 20 kéréssel. Nincs általános gép- vagy mappaolvasási engedély.
- `kit/ai/KEZDD-ITT.html`: első beüzemelés, kész első feladat, javításkérés, saját háttér, későbbi visszatérés. A csomag indítókat tartalmaz Windowshoz, Machez és Linuxhoz. Node.js 22+ és internetes OpenAI API-hozzáférés szükséges. Nem natív vagy aláírt telepítő; macOS/Windows telepítési próbája még nem történt meg.

### AI-csatlakoztatás és tényleges állapot

A fejlesztés idején a Site környezeti változólistája üres volt; nem volt használható API-kulcs. **Éles modellgenerálást és tartalmi minőséget nem sikerült ellenőrizni.** A kód szolgáltatói hívást végez, de a webes felület a hozzáférés bekötéséig világosan letiltja a generálást. A helyi csomag nem kapott kulcsot.

A működtető a Site futtatási környezetében titokként állítsa be az `OPENAI_API_KEY` értékét; a `OPENAI_MODEL` opcionális, alapértelmezetten `gpt-5-mini`. A beállítás után egy mentett verzió publikálása alkalmazza az új környezetet. Kulcsot ne írjon a forrásba, kliensoldali tárolóba vagy beszélgetésbe. A helyi felület saját csatlakoztatást ad; haladó futtatásnál ugyanezeket a környezeti változókat olvassa. A helyi kulcsellenőrzés egy modell-metaadat lekérés, nem generálás és nem a számlázási keret ellenőrzése.

Dokumentáció: [Responses strukturált kimenet](https://developers.openai.com/api/docs/guides/structured-outputs), [választott alapmodell](https://developers.openai.com/api/docs/models/gpt-5-mini), [Node.js telepítés](https://nodejs.org/en/download).

### Újraépítés és ellenőrzés

```sh
node scripts/build-local-ai.mjs
node node_modules/typescript/bin/tsc --noEmit
node tests/ai-agent.mjs
node tests/ai-api.mjs
node tests/local-ai.mjs
```

Az AI-tesztek a tényleges közös motort, a SQLite-migrációkkal futó API-t és a helyi HTTP-szervert ellenőrzik. Az OpenAI-válaszokat tesztválaszok helyettesítik; ebből éles működés vagy jó szövegminőség nem állítható. A helyi HTTP-teszt tényleges portot, cookie-t, háttérmentést, fájlírást és újraindítás utáni visszatöltést vizsgál. Böngészőautomatizálás nem történt.

A saját gépes csomagot a Site buildje előtt kell generálni. A generált ZIP és a külön olvasható `ai-kezdes.html` a forrással együtt mentett kiadási fájl. A régi offline HTML és a számoló/rendező eszközök külön termékágként megmaradtak a `/eszkozok` útvonalon; nem válnak AI-vá ettől a módosítástól. Az alábbiak a korábbi változatok dokumentációi.


## Harmadik változat — használható mindennapi funkciók

- 20 valódi adatfeldolgozó: feladatrendező, heti kapacitástervező, megbeszélés-emlékeztető, heti jelentés, érdeklődő-rendező, kontaktlista-tisztító, ügyfél-utánkövető, ügyfélválasz, ajánlati kalkuláció, fizetési határidők, költségösszesítő, előfizetések, ingatlanhirdetés, ingatlan-összehasonlítás, posztcsomag, hírlevél, UTM-linkek, ellenőrzőlista, készlet és naptárexport.
- Kereshető, kategóriákra szűrhető katalógus, közvetlen segéd-URL-ek, saját bemenet, minták és UTF-8 CSV/TSV-import.
- Közös munkapad; szerkeszthető szöveg, képletinjektálás ellen védett CSV, TXT, JSON és megfelelő segédnél ICS-export. A táblázat külön számított adat: a szöveg szerkesztése nem módosítja a CSV-t.
- Saját változatok és eredmények D1-ben, felhasználónként legfeljebb 100 mentés. A mentések külön példányok, ismételt kérés nem duplikál; tulajdonoshoz kötött visszaolvasás és törlés.
- A számoló/rendező segédek és a szövegsablonok egyértelműen megkülönböztetve. Kézi böngészős futtatáskor a feldolgozás helyben történik; a szerverre csak a kifejezett mentés küld adatot.
- Egyfájlos offline HTML, külső függőség nélküli ESM-feldolgozó, nyolc előkészített CSV-fájlfigyelő agent és saját konfigurációkészítő. A Node.js-futtató tartalomváltozást/napváltást vagy napi időpontot figyel, sikeres futásonként új eredménymappát ír. A webes felület nem állítja, hogy a háttérfolyamat a felhőben fut.
- Az átadott `AgentAkademiagrafikaicsomag.pdf` arculata: #f1eee7 papír, #2a211b sáv, #14110f elsődleges cselekvés, #e09b12 arany gallér, zöld kész, bordó hiba. Fraunces 700 és Archivo 400–700 saját kiszolgálású WOFF fájlokkal, magyar karakterkészlettel, SIL OFL licencekkel. A sakkgyalog beágyazott SVG a referencia 48-as rácsának méretei alapján.

A feldolgozó forrása: `lib/daily-tools.ts`. Ugyanebből fordul a kliens, a szerveroldali mentésellenőrzés és az offline motor. Új segédnél adatlap és feldolgozóág szükséges; nem kerülhet a katalógusba megvalósítás nélküli elem.

### Újraépítés és ellenőrzés

```sh
node scripts/build-agent-kit.mjs
node node_modules/typescript/bin/tsc --noEmit
node tests/daily-tools.mjs
node tests/tool-api.mjs
node tests/api-regression.mjs
```

Az agentcsomagot a Site buildje előtt újra kell generálni; a generált `public/letoltes` fájlok a forrásverzióval együtt kerülnek mentésre. A letölthető csomag használati útmutatója: `kit/UTMUTATO.md`.

Az ellenőrzések a tényleges feldolgozókat, helyi fájlfuttatót és SQLite-ra kötött API-kezelőket futtatják. Nem igazolnak böngészős megjelenést, éles ChatGPT-azonosítást vagy külső fiókkapcsolatot. Az első és második változat számlamintás funkciói megmaradtak.

## Megvalósítva

- Feladatkatalógus, Bizonylatrendező-adatlap, négylépéses beállító, saját agentek és segítség.
- Három egyértelműen jelölt mintaszámla: teljes, hiányos és EUR-pénznemű.
- Saját fiókhoz tartozó tartós D1-mentés: agentbeállítások, mintatételek, segítségigények.
- Mezőjavítás és jóváhagyás szerveroldali ellenőrzéssel; valódi dátumvalidálás.
- Egy mintából ügyfelenként legfeljebb egy tétel; ismételt kérés nem duplikál.
- Jóváhagyott minták CSV-exportja (UTF-8 BOM, pontosvessző, képletinjektálás elleni védelem).
- Beállítások JSON-exportja, titkok nélkül. Ez konfiguráció, nem futtatható agentcsomag.
- Platform által hitelesített felhasználó; minden adatbázis-művelet tulajdonoshoz kötött.
- Mintapróbát megnyitó, opcionális WebMCP-eszköz, funkciófelismeréssel.

## Fontos határ

Ez az eredeti Agent Akadémia dokumentuma alapján készített önálló első felület. Az eredeti Render-szolgáltatás és a korábbi forráskód nem volt elérhető a felépítéshez. Az alkalmazás nem állítja, hogy élő számlát dolgoz fel. A bemutató ismert mintaadatokat tölt be; a számlamintában nincs modellhívás, Google OAuth-kapcsolat, Gmail-olvasás, Google-táblázatírás, felhőben futó időzített feladat, értesítő levél vagy fizetés. A letölthető fájlfigyelők a saját gépen, Node.js folyamatban időzítenek. Az „előkészítve” állapot nem jelent aktív automatizálást. A mentett segítségigény a saját munkaterületen olvasható vissza, értesítés még nem történik.

A Sites-példány kezdetben privát. A ChatGPT-bejelentkezés az első verzió azonosítását szolgálja; nem a Google-engedélyezés helyettesítője. A nyilvános termék fiók- és integrációkezelését az eredeti alkalmazáshoz kell igazítani.

## Folytatás az eredeti rendszerrel

1. Az eredeti forráskód, az API-szerződés és a kulcskezelés összevetése ezzel a felülettel.
2. A `lib/workspace-db.ts` / `/api/workspace` réteg mögé az eredeti adatkezelés illesztése, felhasználói adatok megőrzésével.
3. Google-csatlakoztatás és a jogosultságok kiadási követelményeinek rendezése.
4. Valódi számlafeldolgozó végpont bekötése, feltöltési korlátokkal és hibakezeléssel.
5. Célrendszerbe írás visszaigazolással és idempotens műveletazonosítókkal, majd időzítés.
6. Ügyfélhez kötött, visszavonható telepítési hitelesítők és verziózott Apps Script-csomag.
7. Értesítések, mért használati keretek, majd fizetős pilot.

## Fejlesztés

A projekt a Sites Vinext startert használja, pnpm zárolt függőségekkel. A tartós séma a `db/schema.ts`, a migrációk a `drizzle/` alatt találhatók. Az alkalmazás futás közben nem módosítja a sémát.

- Típusellenőrzés: `node node_modules/typescript/bin/tsc --noEmit`
- Új migráció: `node node_modules/drizzle-kit/bin.cjs generate`
- A build és a publikálás a Sites skill szerint történik.

A számlamintához és a régi segédekhez nincs szükség külső API-kulcsra. A hatodik változat AI-munkatársához igen.

## Második mentett változat

- A beállító a legutóbb mentett lépést tölti vissza, a szerveren tárolt előrehaladással.
- A végső lépésre a szerver csak jóváhagyott mintatétellel enged tovább.
- Verzióhoz kötött, atomi beállítás-, előrehaladás- és állapotmentés védi a két lapon párhuzamosan megnyitott munkát. Az eltérő változat 409 választ kap, és nem ír felül adatot.
- Sikertelen adatbetöltés után a kliens nem ment alapértékekkel a meglévő beállításokra.
- A módosult konfiguráció visszakerül beállítás alatti állapotba; a szüneteltetés megmarad.
- A második változat még az első felület arculatát őrizte. A harmadik változathoz a felhasználó átadta az eredeti grafikai csomagot; az arculatot ehhez igazítottuk.

Regressziós próba: `node tests/api-regression.mjs`. A tényleges API-kezelőket SQLite-adapterrel ellenőrzi; a hitelesítést tesztazonosság helyettesíti. Böngészős ellenőrzést nem végez.


## Egyszerűsített felület

- Kezdéskor hat hétköznapi feladat látszik; a teljes katalógus külön nyitható meg.
- Feladat → adatok → eredmény: az üres eredménypanel és az exportmenü nem jelenik meg az adatbevitel mellett.
- Mind a 15 listás segéd külön mezős sorbevitelt kapott, hozzáadással és törléssel. Nem kell CSV-t írni. A haladó import megmaradt; a hibás fájl eredeti szövegét megőrzi.
- Az eredményhez egy fő művelet tartozik: szöveg másolása, táblázat letöltése vagy naptárfájl. A többi export és mentés lenyitható.
- A beállítások, részletes oktatás, automatizálás és számlaminták másodlagos felületre kerültek. Az offline műhely ugyanazt az egyszerű folyamatot követi.
- Az adatbekérő szövegek kimondják, milyen saját információ kell a feladathoz. Az ügyfélválasz továbbra is a felhasználó által adott választ formázza; önálló válaszalkotó AI nincs bekötve.

Ellenőrzés: a csomag újragenerálása után `node tests/simple-input.mjs`. Mind a 15 sorbevitelt oda-vissza alakítva összeveti az eredeti feldolgozó eredményével, és ellenőrzi az offline szkript szintaxisát. Böngészős használhatósági teszt nem történt.
