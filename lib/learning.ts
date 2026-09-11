export const lessons = [
 {id:'kezdes',title:'1. Segéd vagy automatikus agent?',intro:'A kettőt másképp használod. Kezdéshez elég egy böngészős segéd.',steps:[
  'Böngészős segéd: te adod meg az adatokat, és az „Készítsd el” gombbal indítod. Az eredményt te ellenőrzöd és viszed tovább.',
  'Sablonos segéd: a megadott tényeket és szövegeket rendezi levélbe, hirdetésbe vagy jelentésbe. Nem keres választ, és nem talál ki új információt.',
  'Fájlfigyelő agent: egyszer beállítod és elindítod a saját gépeden. Ezután fájlváltozáskor vagy napi időpontban magától elkészíti az eredményfájlokat.',
  'A jelenlegi csomag nem csatlakozik levelezőhöz vagy bankhoz, és nem használ AI-modellt. A Bizonylatrendező külön mintapróba: nem dolgozza fel a saját számla-PDF-edet.'
 ],check:'Akkor érdemes automatizálni, ha ugyanazt a jól körülírható feldolgozást rendszeresen, azonos szerkezetű adatokon végzed.'},
 {id:'elso-eredmeny',title:'2. Az első eredményed – egy rövid gyakorlat',intro:'A Készlet-utánrendelőn jól látszik, miből lesz az eredmény. Először dolgozz a mintával.',toolId:'keszletfigyelo',steps:[
  'Nyisd meg a Készlet-utánrendelőt, majd válaszd a „Mutass egy példát” gombot. A minta szemléltető adat, nem a saját készleted.',
  'A Nyomtatópapír sorban 2 a jelenlegi készlet, 5 a minimum, 12 a célkészlet és 5 a csomagméret.',
  'Kattints az „Készítsd el” gombra. A várt eredmény: 2 rendelendő csomag, összesen 10 darab, rendelés után 12 darab készlet.',
  'Írd át a jelenlegi készletet 2-ről 5-re, és futtasd újra. Most 0 csomag a rendelés: az agent csak a minimum ALÁ csökkent készlethez számol.',
  'Töltsd le a CSV-t. Ezt már átadhatod beszerzési listaként, de rendelést az agent nem küld el.'
 ],check:'Sikerült a gyakorlat, ha az első futás 2, a módosítás utáni futás 0 csomagot mutat. Így ellenőrizted a szabály határát is.'},
 {id:'sajat-adatok',title:'3. Így add meg a saját adataidat',intro:'A saját feladatodhoz tartozó információt add meg. Nem kell programoznod vagy fájlformátumot tanulnod.',steps:[
  'Szöveges feladatnál minden kötelező mezőt tölts ki. A megadott állításokat a segéd nem ellenőrzi külső forrásból.',
  'Listás feladatnál külön mezőbe írd a nevet, az összeget vagy a határidőt. Az Új feladat / Új tétel gomb új beviteli sort ad hozzá.',
  'Ha van már kész táblázatod, a Haladó lehetőségek vagy a Lista betöltése részben fájlból is betöltheted. Csak ennél a módszernél kell az előírt oszlopsorrendet követni.',
  'Dátum: 2026-09-30. Szám: 1250,50 vagy 1250.50; ne írj mellé Ft-jelet. Tizedesvessző mellett pontosvesszős oszlopelválasztót használj.',
  'Fájlbetöltéshez Excelből vagy más táblázatból UTF-8 CSV-t ments. PDF és képfájl nem megfelelő bemenet ezekhez a segédekhez.',
  'Egyszerre legfeljebb 500 adatsor és mezőnként 20 000 karakter adható meg. Ha az adatban pontosvessző vagy sortörés van, a CSV-mező kerüljön kettős idézőjelbe.'
 ],check:'Kezdj 2–3 saját sorral. Ha az eredmény helyes, jöhet a teljes lista. Hiányzó adatot ne helyettesíts kitalált értékkel.'},
 {id:'ellenorzes',title:'4. Ellenőrizd, majd vidd tovább',intro:'Az eredmény akkor hasznos, ha tudod, mire használhatod és milyen formában kell továbbadnod.',steps:[
  'Nézd meg az eredmény alatti megjegyzéseket: itt szerepel például a rendezési szabály, a kerekítés vagy az időzóna kezelése.',
  'Másolás / TXT: levélhez, hirdetéshez vagy dokumentumhoz. A szöveget szerkesztheted; küldés előtt olvasd át a neveket, összegeket és vállalásokat.',
  'CSV: a számított táblázatot viszi tovább Excelbe vagy más táblázatkezelőbe. Az alatta szerkesztett szöveg nem változtatja meg a CSV tartalmát.',
  'JSON: a bemenetet és az eredményt strukturált fájlban őrzi meg. Saját rendszerbe építéshez vagy későbbi visszatöltéshez használható.',
  'Naptárfájl / ICS: a Naptársegéd eredménye. A saját naptárad importálási funkciójával töltsd be. Ellenőrizd az időzónát és ismételt importnál a duplikációkat; a fájl nem küld meghívót.',
  'Ha megváltoztatod a bemenetet, készíts új eredményt. A korábbi eredmény nem frissül magától a kézzel indított segédben.'
 ],check:'Először egy tételt ellenőrizz kézzel. Pénznemeket ne adj össze átváltás nélkül; az összesítők ezért külön kezelik őket.'},
 {id:'mentes',title:'5. Mentés és visszatérés',intro:'Másképp marad meg a munkád a weboldalon és a letöltött offline műhelyben.',steps:[
  'A weboldalon a Mentés és haladó lehetőségek részt lenyitva, bejelentkezve a „Kitöltés mentése” a kitöltést őrzi meg. Adj neki felismerhető nevet, például „Heti irodai beszerzés”.',
  'Az „Eredmény mentése” a bemenetet és a szerkesztett eredményszöveget is elmenti. A „Mentett munkák” oldalon nyithatod meg újra.',
  'Új mentés külön példányt hoz létre. Legfeljebb 100 mentést tarthatsz meg; a már nem szükséges példányokat a munkaterületen törölheted.',
  'Az offline HTML-ben nincs fiókhoz mentés. Nyisd le a Kitöltés mentése és visszatöltése részt. A „Kitöltés mentése fájlba” gombbal ments, később pedig a „Korábbi kitöltés megnyitása” mezőben válaszd ki a fájlt.',
  'Az offline visszatöltés a bemenetet állítja vissza: új eredményt kell készítened. A korábban kézzel szerkesztett szöveget a TXT- vagy eredmény-JSON-fájl őrzi, de nem tölti vissza a szövegszerkesztőbe.',
  'Bezárás előtt mentsd vagy töltsd le, amit meg akarsz tartani. A feldolgozás önmagában nem jelent automatikus mentést.'
 ],check:'Próbáld ki egyszer a mentés–megnyitás folyamatot egy mintával, mielőtt fontos munkát bíznál rá.'},
 {id:'automatizalas',title:'6. Amikor már magától dolgozzon',intro:'A fájlfigyelőhöz a teljes ZIP-csomag kell. A külön offline HTML csak a kézi műhely.',steps:[
  'Először próbáld ki a kiválasztott segédet a saját adataiddal a műhelyben. Csak a már ellenőrzött szabályt automatizáld.',
  'Töltsd le és csomagold ki a teljes agentcsomagot. A fájlfigyelő futtatásához Node.js 22 vagy újabb szükséges; a telepítési hivatkozás és a parancsok az OLVASS-EL.md útmutatóban vannak.',
  'A bemenet mappában cseréld a kiválasztott agent CSV-jének mintasorait a saját listádra. Az oszlopsorrendet tartsd meg.',
  'Windows alatt az Inditas.bat menüből választhatsz. Macen vagy Linuxon a kicsomagolt mappában a node start-menu.mjs paranccsal indul a menü.',
  'A kész konfigurációk percenként ellenőriznek, és induláskor, fájlváltozáskor vagy új napon dolgoznak. A weboldal Fájlfigyelő agentek részén napi időzítést is összeállíthatsz.',
  'Az eredmenyek mappában minden sikeres futás külön almappát kap. A legutobbi.json mutatja a legutóbbi sikeres eredményt. Hibánál nézd meg a terminál jelzését, javítsd a bemenetet; a következő ellenőrzés újra próbálja.',
  'A gépet és a futtatót hagyd bekapcsolva. Alvó vagy kikapcsolt gépen az agent nem dolgozik. Leállítás: Ctrl+C. Konfigurációmódosítás után indítsd újra.'
 ],check:'Az első automatikus futás után módosíts egy tesztsort. Egy percen belül új eredménymappának kell készülnie. A régi eredmény megmarad.'}
];
export const troubleshooting=[
 ['Nem tudom, melyik segédet válasszam.','A kívánt eredményből indulj ki: sorrendhez Feladatrendező, visszahívásokhoz Érdeklődő-rendező, szöveges válaszhoz Ügyfélválasz-készítő, időpontokhoz Naptársegéd. A katalógusban ezekre a szavakra is kereshetsz.'],
 ['„X oszlop szükséges” hiba jelenik meg.','Nézd meg a mező alatti oszlopsorrendet. Egy üres utolsó mezőhöz is kell a záró pontosvessző. Az adatban szereplő pontosvesszőt idézőjelezett CSV-mezőben add meg.'],
 ['Hibás dátumot vagy számot jelez.','A dátum ÉÉÉÉ-HH-NN formátumú, és létező naptári nap legyen. Számhoz ne írj pénzjelet vagy ezreselválasztó pontot; például 1250,50 megfelelő.'],
 ['Letiltódott a letöltés vagy a mentés.','Ha átírtad a bemenetet, előbb kattints az Készítsd el gombra. A webes mentéshez bejelentkezés és legalább kétkarakteres név is szükséges.'],
 ['Nem működik a Másolás gomb.','A böngésző korlátozhatja a vágólapot. Jelöld ki a szöveget, és másold Ctrl+C vagy Cmd+C billentyűvel; a TXT-letöltés is használható.'],
 ['A CSV egyetlen oszlopban nyílik meg.','A táblázatkezelő importálásánál válassz pontosvessző elválasztót és UTF-8 kódolást. Az exportált fájl ezeket használja.'],
 ['Az agent nem készít új fájlt.','Nézd meg, fut-e még a terminál, ébren van-e a gép, és a megfelelő bemeneti CSV-t módosítottad-e. Változatlan fájlnál ugyanazon a napon nem készít új példányt. Napi időzítésnél vár a beállított időre.'],
 ['Zárolás miatt nem indul az agent.','Egy beállításhoz egyszerre egy futtató tartozhat. Állítsd le a másik példányt. Összeomlás után csak akkor töröld a .lock fájlt, ha az előző folyamat már biztosan nem fut.']
];
