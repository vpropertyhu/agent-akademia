# Agent Akadémia – folyamatos fejlesztési mentés

## Cél és megtartandó döntések

Általános, kezdőknek is érthető agentépítő. Egy kocka egy képesség; egymásba illő kockákból folyamat, több kockából újra használható saját modul készül. Nem ingatlanos termék. A meglévő papír–barna–arany Claude-arculat, Fraunces/Archivo betűk és sakkfigura megmaradnak.

A hangsúly az érthető, erősen vizuális építésen és a mindennapi felhasználáson van. A piaci egyediséget még nem igazoltuk. A fizetős modulok és használati díjak egyelőre terméktervek.

## 1. mentési pont – az építő alapja elkészült

- 23 képesség definíciója 5 funkciócsoportban, külön sajátmodul-katalógussal.
- Négy induló minta: ötletből kész anyag, hangból teendők, szövegből riport, ötletből grafika.
- Típusos csatlakozás: kérés, szöveg, hang, kép, adatok, dokumentum.
- Hibás illesztésnél érthető magyarázat és egy köztes átalakító kocka javaslata, ahol lehetséges.
- React felület: hozzáadás kattintással/húzással, átrendezés gombbal/húzással, eltávolítás, visszavonás.
- Egymás melletti kockák elnevezhető, újra beilleszthető modullá csukhatók és szétnyithatók.
- Helyi automatikus tervmentés, JSON-terv letöltése és visszatöltése.
- Léptethető és szüneteltethető látványpróba előre elkészített példatartalommal.

## Pontos megvalósítási állapot

A forráskód már fájlokban van. A vizuális CSS kialakítása, a főoldal bekötése és a fordítás ellenőrzése folyamatban van. Ez a mentés még nem kész, publikált kiadás.

A kockák működő szerkesztési elemek és képességtervek. A moduláris futtatómotor, valódi AI-futtatás, időzítés, fájlrendszer- és alkalmazáskapcsolatok még nincsenek bekötve. A látványpróba nem készít valódi AI-tartalmat, nem küld üzenetet és nem hoz létre dokumentumfájlt. A JSON-export konfiguráció, nem telepíthető agent.

A már meglévő külön szövegalkotó felületet megőrizzük. Annak backendjét ez az átalakítás nem fejleszti tovább.

## Következő feladatok

1. Erős, térbeli kockamegjelenés, csatlakozók, adatút és mobilnézet megvalósítása.
2. Importkorlátok és saját modulok mélységi/méretkorlátainak egységesítése.
3. Főoldal és hordozható Netlify-belépési pont bekötése; a régi szövegalkotó megőrzése.
4. TypeScript-fordítás, célzott logikai ellenőrzések és kiadási build.
5. Git-mentés és az engedélyezett webes kiadás frissítése; a tényleges eredmény ide kerül.

## Folytatási utasítás másik munkamenethez

Folytasd az Agent Akadémia vizuális kockaépítőjét. Őrizd meg a barna–papír–arany arculatot, az általános felhasználást és a kezdőknek szóló magyar felületet. Ne hirdesd a látványpróbát valódi agentfuttatásnak. A forrásprojekt: /workspace/sites/agent-akademia. Előbb nézd meg a Git-állapotot és a fejlesztési naplót, majd a module-builder fájlokat. A mentés alatti kódpillanatkép másolható.

## 2. mentési pont – összeépített, fordítható felület

Elkészült a barna munkapad, a térbeli kockák, a csatlakozóformák, az adatút, a mintaeredmény és a mobilra átrendeződő felület. Húzás közben a beillesztési hely előre jelzi a kompatibilitást. A kockák kattintással és átrendező gombokkal is kezelhetők.

A főoldalon az új építő nyílik meg. A korábbi szövegalkotó a /alkotas címen marad elérhető. Mind a Sites, mind a Netlify belépési pontját frissítettük. A fejléc és az oldal leírása az új termékirányt tükrözi.

A szerkesztési módosítások és az import ugyanazt a méret- és mélységellenőrzést használják. Duplikált modulazonosító, hibás gyermeklista, túl mély beágyazás és hibás JSON nem fogadható el. Az összetett modul a gyermekeihez szükséges külső kapcsolatokat is jelzi.

Ellenőrzés: TypeScript-hiba nélkül fordul. Célzott logikai ellenőrzések sikeresek az illesztésre, a hídkocka-ajánlásra, az összecsukásra, az import/export körútra és a másolatok függetlenségére. A Sites és a hordozható Netlify build sikeres. Böngészős végigkattintás és valódi AI-futtatás nem történt.

A webes kiadás mentése és közzététele a következő lépés. Ez a napló nem állítja, hogy a jelenlegi új verzió már élőben elérhető.

## 4. mentési pont – kapcsolódó képességkártyák és vezetett építés

Új felhasználói döntés: a LEGO-szerű alakzatokat elhagyjuk. A korábbi kocka-metafora történeti előzmény; a jelenlegi irány kapcsolódó képességkártyákból áll. Az eredeti barna–papír–arany arculat megmarad.

Elkészült:

- Sík, ívelt képességkártyák számozással és látható csatlakozással; nincs LEGO-bütyök vagy térbeli kockaoldal.
- Az új látogató egyetlen kezdőlépést kap. A sor végén a „Mit csináljon ezután?” kérdés alatt legfeljebb három oda illő választás jelenik meg.
- Kattintásra a kiválasztott képesség azonnal bekerül és összekapcsolódik. Húzásra nincs szükség.
- A teljes képességtár alapból zárva van. A „További képességek” gombbal nyitható; alapból csak az adott helyre illő elemeket mutatja.
- Középre szúrásnál mindkét szomszédot és az összetett modul belső kapcsolatait is ellenőrizzük. A nem illő hozzáadás nem módosítja a tervet.
- Állandó háromlépéses útmutatás: kezdés, következő képesség, bemutató.
- A kártyák feliratai mondatként olvashatók: „Megkapja a kérésed”, „Megírja a szöveget”, „Átnézi a szöveget”.
- A saját modul művelete érthetőbb nevet kapott: „Lépéseket együtt mentek”.
- A korábbi helyi és JSON-mentések kompatibilisek maradnak. Az új alapminta nem írja felül a mentett tervet.
- Olvashatóbb betűméretek és nagyobb vezérlők, mobilra igazított elrendezés.

Ellenőrzés: a TypeScript-fordítás és a célzott logikai vizsgálatok sikeresek. Ellenőrizve a kétoldali illesztés, a kezdő és következő ajánlás, az összetett modul hibája, valamint a négy korábbi minta és saját modul JSON-körútja. A végső kiadási build és publikálás következik.

A bemutató továbbra is előre megírt mintát használ. A valódi AI-futtatás nem része ennek a felületegyszerűsítésnek.

A negyedik mentési pont ellenőrzésekor két további javítás készült: a régi, több köztes lépést hiányoló terveknél a felület egyben felajánlja a szükséges átalakítási sort; a húzás előjelzése és az áthelyezés elfogadása a teljes módosított sorra ugyanazt a szabályt használja. Célzott ellenőrzés igazolta a kérés → írás → dokumentum → mentés javítást is.

## 6. mentési pont – egyetlen üres építőmező

A felhasználó új döntése: egy darab, egyértelműen kijelölt üres mezőbe kerüljenek az elemek, és ott jelenjen meg az összeállítás összegzése. Az előző vezetett, lépésenkénti választó helyét ez az egymezős munkafelület veszi át.

Megvalósítás:

- Az elemtár mindig látható; minden elem húzással és kattintással is hozzáadható.
- Egyetlen nagy, szaggatott szélű fogadómező látszik „Ide tedd az elemeket” felirattal. A teljes terület fogadja az elemeket és húzáskor kiemelkedik.
- A mezőbe tett elemek kártyákként, együtt jelennek meg. A mezőn belül átrendezhetők és egyenként kivehetők.
- Ugyanazon a kereten belül jelenik meg az „Ezt raktad össze” összegzés: elemek száma, belső lépések száma és a választott képességek.
- Egy hiányosan összekapcsolt elem is bekerülhet. Ha van megfelelő helye, a felület oda rendezi; egyébként az összegzés megmutatja a hiányzó kapcsolatot és az elérhető javítási javaslatot.
- A saját modulok belső lépései is beleszámítanak az összegzésbe; ez nem a mintafuttatás eredménye.
- A részletes elemnézet és a bemutató alapból zárva marad, külön kérésre nyílik meg.
- Üres induláskor a felület nem írja felül a korábbi mentést. A régi terv a „Visszatöltöm” gombbal megnyitható; módosítás előtt külön helyi példány is megőrződik.
- A belső leejtési esemény nem jut tovább a teljes mezőhöz, így egy leejtés csak egy beszúrást okoz.

Ellenőrzés: a TypeScript és a célzott logikai vizsgálatok sikeresek az üres indulásra, az elemek elhelyezésére, a hiányos összeállítás megtartására, a régi JSON-mentésre és a saját modul belső lépésszámára. A webes kiadási build következik. Böngészős végigkattintás nem történt.

A mentésmegőrzés az üres mezővel, de saját modulokkal vagy egyedi névvel rendelkező tervekre is kiterjed. A leejtés egyszeri feldolgozását és a belső lépések számolását külön forrásellenőrzés is megerősítette.


## 8. mentési pont – vezetett átadás és ellenőrzés

Az összegzésben megjelent a Tovább a használathoz főgomb. Három lépés vezeti végig a használót: célválasztás, kézi átadás és próbafeladat, a visszahozott eredmény felhasználói ellenőrzése. Az eredeti egymezős építő és arculat megmaradt.

A kiválasztott modulokból ténylegesen másolható munkautasítás készül, a beágyazott lépések kibontásával. ChatGPT- és Claude-cél választható. A felület megmondja, hogy az utasítás az új beszélgetés üzenetmezőjébe kerül, a letöltés pedig a böngésző beállításai szerint ment fájlt. Az útmutató TXT-fájlként letölthető; a JSON csak az itteni terv visszatöltésére szolgál.

Minden képességhez megjelenik, hogy szöveges utasítás, további eszköz vagy külön kapcsolat kell-e hozzá. A saját gépes moduláris futtató nem telepíthető még; ezt a célválasztó közli. Nem állítunk automatikus telepítést vagy külső futáskövetést.

A próbanapló az adott tervhez, célhoz és feladathoz kötött felhasználói értékelést őrzi, legfeljebb 20 bejegyzéssel ezen a böngészőn. Terv- vagy próbaváltoztatás nem örököl korábbi megfelelt állapotot. Eredmény átírásakor az ellenőrző jelölések törlődnek. Részleges ellenőrzés nem kap megfelelt állapotot. A korábbi mentett állapot dátummal elkülönül a jelenlegi szerkesztett értékeléstől. Sérült naplót nem írunk felül. Az eredmény és értékelés olvasható fájlba letölthető.

A célzott logikai ellenőrzések sikeresek a változatkötésre, a beágyazott sorrendre, a célok képességbesorolására, az átadási korlátokra, az értékelési állapotokra és a naplóvalidációra. A végső kiadás állapotát a külön folyamatos mentés elején rögzítjük. Böngészős végigkattintás és tényleges külső AI-próba nem történt.


## 10. mentési pont – szerkesztés folytatása modultörlés után

Két elakadási esetet reprodukáltunk: a Javasolt lista csak a sor végére kínált elemeket, ezért a törölt köztes elem pótlása eltűnt; egy szöveggel végződő sorba visszatett íróelem pedig a sor végére került, miközben középen megmaradt a hiba. Általános szerkesztési zárolást a kódban nem találtunk.

A törlés megőrzi a kivett elem helyét az új beillesztéshez. A javaslatok ezt a helyet, ennek hiányában az első hibás kapcsolatot vizsgálják. Az automatikus beillesztés a meglévő kapcsolat javítását előnyben részesíti a sor végére illesztéssel szemben. Törlés után a keresés és csoportszűrés törlődik, minden elem újra elérhető.

A kivett elem neve mellett Visszateszem és Másik elemet választok gomb jelenik meg. Üres szűrt listából az Összes elem mutatása gomb visszahozza a teljes választékot. Az elemcsere, mozgatás és visszavonás rendes szerkesztési állapotba tér vissza: nem marad aktív a csoportkijelölés, húzás vagy korábbi átadási panel. A hibás kapcsolat továbbra is javításra vár a használat előtt, de a terv szerkeszthető és elmenthető marad.

A scripts/test-module-editing.mjs célzott regressziós ellenőrzése sikeres: a négy gyári minta minden pozíciójából kivett elem visszahelyezése (15 eset), köztes hiányra adott javaslat, szöveggel végződő sor javítása, saját modul újbóli beillesztése és hiányos terv szerkeszthető mentése. Böngészős végigkattintás nem történt.


## 12. mentési pont – hétköznapi nyelv és egyben másolható kérés

A 23 feladat neve, példája és leírása hétköznapi nyelvet kapott. A „kérést kap” helyett „Írd le, mit szeretnél”, a technikai bemenet/kimenet helyett „Mi kell hozzá?” és „Mi készül belőle?” jelenik meg. Az eredeti barna–papír–arany arculat és az egyetlen üres gyűjtőmező megmaradt.

Új kérésmező került a gyűjtőmezőbe. A kezdő felhasználó leírhatja, mit készítsen az AI. A Szövegírás, Teendőlista készítése vagy Képkészítés első kiválasztásakor a szükséges kezdő lépés automatikusan bekerül. A kérés megőrződik a böngészős mentésben és a letöltött összeállításban. Az új, opcionális Draft.request mező a korábbi mentésekkel kompatibilis; a módosított kérés új összeállításváltozatnak számít a próba értékelésekor.

A kipróbálás egyetlen másolásra rövidült: a segítő leírása, a saját kérés és az elvárások együtt kerülnek a ChatGPT vagy Claude beszélgetésébe. Külön, számozott útmutatás mondja meg, hol kell beilleszteni és elküldeni, majd hová kell visszatérni az eredménnyel. A részletes eszközigény és az ismételt használat útmutatója igény szerint nyitható meg. A letölthető útmutató és a használati dokumentáció ugyanezt a menetet követi.

Megőriztük a törlés utáni szerkeszthetőséget. A visszavonás nem törli a közben átírt kérést. Az üres összeállítás mellé írt kérés is visszaállítható; a meglévő kérés nem tűnik el a kezdő feladat cseréjekor. Az üzenetíró feladat nem állítja, hogy a piszkozat elkészítéséhez fiók-összekapcsolás kellene.

Ellenőrzés: a TypeScript-fordítás sikeres. A 15 törlés–pótlás eset és a kapcsolódó regressziós ellenőrzések sikeresek. Célzott vizsgálat igazolta a régi mentések olvasását, a kérés mentési körútját és méretkorlátját, a változatkötést, az automatikus kezdő lépést és az egyben átadott kéréshez igazított utasítást. A kiadási build és a közzététel állapotát a külön folyamatos mentés elején rögzítjük.

Ez a módosítás a felület és a kézi kipróbálás egyszerűsítése. Nem készült automatikus moduláris futtató, telepítő, külső AI-megfigyelés vagy új alkalmazáskapcsolat. Böngészős végigkattintás, kezdőkkel végzett használhatósági vizsgálat és valódi külső AI-próba nem történt.


## 14. mentési pont – témából kész anyag, valódi végrehajtási útvonallal

Új, /proba címen elérhető munkafelület készült. Egyetlen feladatból internetes kutatást, cikket, rövid posztot, szerkesztői ellenőrzést és egy JPEG-illusztrációt készít, majd az eredményt a fiókhoz menti. Az építő a kezdőlapon megmaradt; egy kiemelt gomb visz a próbához. Az eredeti arculat megmaradt.

A keresés, írás, ellenőrzés és képkészítés négy tényleges szolgáltatói művelet. A webes források a keresési válasz hivatkozásaiból kerülnek a munkához, nem kitalált URL-ekből. A lépések állapota csak tényleges kezdéskor és befejezéskor változik, és mentésre kerül. A képhiba után a már elkészült szöveg hozzáférhető marad. Nincs automatikus fizetős újrapróbálás. Pontosító kérdésnél a következő műveletek nem indulnak el.

A Netlify-változat az új feladatot közvetlenül a háttérfüggvényben futtatja, az OPENAI_API_KEY és OPENAI_BASE_URL értékekkel, a Netlify AI Gateway támogatásával. A korábbi szövegalkotó továbbra is a Render háttérszolgáltatását használja. Ehhez az új útvonalhoz nem szükséges Render-kiadás. A Sites-változat ugyanazt a kutató motort használja a meglévő fiókhoz kötött adatbázisával, a képfájlokhoz R2-tárolóval; a vizsgálatkor a privát Site AI-hozzáférése még nem volt beállítva.

A hosszabb futások 8 perces határon belül követhetők. A tárolási zárolás kezeli a közben mentett előrehaladást. A listanézet nem tölti le az összes korábbi képet; egy munka megnyitása külön kéri le a teljes eredményt. Folytatáskor a keresés megkapja az eredeti témát is. A korábbi szövegalkotó és a helyi csomag választója nem kínálja a külön kutató útvonalat.

Belépés nélkül egy egyértelműen előre elkészített példa nézhető meg cikkel, poszttal, képpel és hivatkozással. A kép valódi, ehhez a bemutatóhoz generált illusztráció. A példa nem állítja, hogy az alkalmazásban frissen lefutott munka lenne. A saját feladat indítása valós AI-hozzáférést igényel; hiány esetén a felület ezt még belépés előtt jelzi.

Célzott ellenőrzések: kutatási bizonyíték, forrás- és képvalidáció, négy egymásra épülő hívás, pontosító ág, eredeti témát megtartó folytatás, részleges eredmény megőrzése, idempotencia, jogosultságelválasztás, Netlify háttérindítás és a közben mentett állapot utáni végső mentés. A tesztekben a szolgáltatói válaszok helyettesítve vannak; éles AI-minőségi próba nem történt. A tényleges kiadási és hozzáférési állapot a folyamatos mentés elején szerepel.

A kiadás előtti felülvizsgálat két további javítást hozott: a nyilvános belépés megtartja a már beírt témát és hátteret; hálózati hiba után a visszaigazoltan hiányzó munka nem tartja végleg zárolva a kezelőfelületet. Az indítás azonosítóját az állapotfrissítéstől függetlenül őrizzük.
