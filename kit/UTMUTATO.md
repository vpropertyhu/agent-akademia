# Agent Akadémia – használható segédek és fájlfigyelő agentek

**Most kezded?** Nyisd meg a mellékelt `hasznalati-utmutato.html` fájlt: hat rövid lecke, ellenőrizhető készletgyakorlat, gyakori hibák és mind a 20 segéd mezőútmutatója vezet végig a használaton. A leckék a fejléc **Segítség** gombjával, vagy az oldal alján a **Részletes segítség** részt lenyitva is olvashatók. A kiválasztott segédhez külön helyi segítség tartozik.

## A legegyszerűbb kezdés

Nyisd meg az `agent-akademia-offline.html` fájlt Chrome-ban, Edge-ben, Firefoxban vagy Safariban. Nem kell telepítés, fiók, API-kulcs vagy internet. Válassz egyet a kezdőoldal hat gyakori feladatából. A többi a **Más feladatot keresek** gomb alatt érhető el. Töltsd ki a hétköznapi mezőket, vagy kattints a **Mutass egy példát** gombra, majd a **Készítsd el** gombra. Listához az **Új feladat / Új tétel** gombbal adhatsz hozzá sort; nem kell CSV-t írnod.

A szöveget szerkesztheted, másolhatod és TXT/JSON formátumban letöltheted. Táblázatnál CSV-t, időpontoknál ICS-naptárfájlt is kapsz. A CSV mindig a számított táblázat; a szöveg kézi szerkesztése nem változtatja meg. A kitöltést JSON-fájlba mentheted és később betöltheted. Az oldal nem tárol adatot automatikusan: bezárás előtt mentsd, amit meg akarsz tartani.

Ezek a segédek szabályokkal számolnak, rendeznek vagy a saját szövegedet sablonokba foglalják. Nem működik mögöttük AI-modell. A fájlfigyelő agentek ugyanezeket a szabályokat automatikusan futtatják.

## Automatikusan futó agentek

A csomag nyolc kész konfigurációt és hozzájuk nyolc **szemléltető** bemeneti CSV-t tartalmaz:

| Agent | Bemeneti fájl a bemenet mappában | Elvégzett munka |
| --- | --- | --- |
| Fizetési határidő-figyelő | hatarido-figyelo.csv | Lejárt és esedékes fizetések listája |
| Érdeklődő-utánkövető | erdeklodo-rendezo.csv | Kapcsolatfelvételek rangsorolása |
| Készlet-utánrendelő | keszletfigyelo.csv | Csomagméretre kerekített rendelési lista |
| Napi feladatrendező | feladatrendezo.csv | Határidő és prioritás szerinti sorrend |
| Költségjelentő | koltsegosszesito.csv | Kategóriánkénti, pénznemenkénti összesítés |
| Kontaktlista-karbantartó | kontakt-tisztito.csv | Ismétlődő címek összevonása, hibajelzések |
| Előfizetés-jelentő | elofizetesek.csv | Havi és éves költségegyenérték |
| Naptárfájl-frissítő | naptar-export.csv | Importálható ICS-naptárfájl |

1. Telepíts **Node.js 22 vagy újabb** változatot a [hivatalos Node.js oldalról](https://nodejs.org/en/download). A böngészős HTML-hez ez nem szükséges.
2. Csomagold ki az egész ZIP-et, és cseréld a kiválasztott bemeneti CSV mintasorait a saját adataidra. A fejlécet és az oszlopsorrendet tartsd meg. UTF-8 CSV, pontosvessző/comma/tabulátor elválasztó; tizedeshez pont vagy vessző, ezresekhez szóköz használható. Vesszős tizedesnél pontosvesszőt használj oszlopelválasztónak. Legfeljebb 500 sor és mezőnként 20 000 karakter.
3. Windows: indítsd az **Inditas.bat** fájlt és válassz a menüből. Mac/Linux: nyiss terminált a kicsomagolt Agent-Akademia mappában, és futtasd: `node start-menu.mjs`. A Mac Inditas.command indítója jogosultságot igényelhet; a terminálos parancs közvetlenül használható.
4. Hagyd nyitva a folyamatot. A `change` beállítás induláskor, a bemeneti fájl megváltozásakor és új napon feldolgoz; percenként ellenőriz. Az eredmények az `eredmenyek/<agent neve>/` mappában jelennek meg. Leállítás: **Ctrl+C**.

Az eredménymappában minden sikeres futás külön almappát kap. A `legutobbi.json` tartalmazza a legutóbbi sikeres mappa nevét, a `naplo.txt` a sikeres futásokat. A hiba a terminálban jelenik meg, adatértékeket nem ír külön hibalogba. Hibás bemenetnél a korábbi eredmény megmarad. A fájlfigyelő a következő ellenőrzéskor újra próbálja a hibás bemenetet. A régi futásokat nem törli automatikusan; a már nem szükséges mappákat te takaríthatod.

### Saját időzítés

Az oldalon a Fájlfigyelő agentek részen letöltött `sajat-agent.json` fájlt tedd a kicsomagolt csomag gyökerébe, és válaszd a menü 9. pontját. A mintakonfigurációt kézzel is módosíthatod:

```json
{
  "version": 1,
  "toolId": "hatarido-figyelo",
  "inputFile": "bemenet/hatarido-figyelo.csv",
  "outputDirectory": "eredmenyek/hatarido-figyelo",
  "trigger": { "mode": "daily", "time": "08:00", "pollSeconds": 60 },
  "input": { "today": "@today" }
}
```

A `daily` naponta egyszer fut, a számítógép helyi időzónájában. Ha a gép a megadott idő után indul, aznap egyszer pótolja. Több elmulasztott napot nem játszik vissza. Az `@today` a futás helyi dátumára cserélődik. A JSON módosítása után indítsd újra az agentet. A `pollSeconds` egész szám, legalább 10; a mellékelt konfigurációkban 60.

Az agent a gép kikapcsolásakor, alvásakor vagy a terminál bezárásakor nem dolgozik. A gép háttérszolgáltatásaként történő telepítés külön rendszergazdai beállítás. A weboldal nem futtatja helyetted. A fájlfrissítés nem küld levelet, nem rendel árut, nem hív bankot, és nem importál magától naptárba.

Egy konfiguráció egyszerre egy folyamatban fusson. Második indításnál a `.lock` fájl miatt a futtató megáll. Ha az előző futás összeomlott, előbb ellenőrizd, hogy a folyamat már nem fut, és csak utána töröld a konfiguráció melletti `.lock` fájlt. Külön konfigurációkhoz külön eredménymappát adj meg.

### Egyszeri próba

```sh
node run-agent.mjs hatarido-figyelo.json --once
```

Ez az időzítéstől függetlenül egy feldolgozást végez és kilép. Hibánál a kilépési kód 1. Csak a megadott fájlokat olvassa, az eredménymappába ír; nem futtat a bemenetből programkódot.

## Beépítés saját rendszerbe

Az `agent-engine.mjs` egy külső függőség nélküli ESM-modul. Importálható saját böngészős vagy Node.js alkalmazásból. A 20 segéd mezői és mintái az `agentek.json` fájlban is megtalálhatók.

```js
import { runTool, resultCSV } from './agent-engine.mjs';

const result = runTool('keszletfigyelo', {
  items: 'Termék;Jelenlegi;Minimum;Célkészlet;Csomagméret\nPapír;2;5;12;5'
});
console.log(result.rows); // 2 csomag, azaz 10 darab, várható készlet 12
console.log(resultCSV(result));
```

A modul nem végez hálózati műveletet. Az integráló alkalmazás felel az időzítésért, hozzáférésekért és a külső rendszerekhez történő írásért. Egy szinkronizált helyi mappában lévő CSV figyelhető, de a csomag nem tartalmaz közvetlen Google Drive/Gmail/CRM csatlakozást.

Mind a 20 segéd automatizálható saját konfigurációval. A táblázatos segédekhez CSV, a többihez JSON `input` objektum szükséges; utóbbihoz az offline műhelyből exportált kitöltés használható. A nyolc kész konfiguráció a legközvetlenebb fájlalapú feladatokra készült.

## Arculat és betűk

Az offline HTML a megadott arculat szerinti Fraunces és Archivo betűket is tartalmazza; nincs külső betűkiszolgálás. A betűk SIL Open Font License alatt használhatók, a licencfájlok mellékelve. Törtfehér papír, sötétbarna sáv, fekete cselekvés, arany gallér; a siker zöld, a hiba bordó.
