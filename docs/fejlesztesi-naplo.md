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
