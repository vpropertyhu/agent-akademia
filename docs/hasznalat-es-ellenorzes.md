# Az összeállítás használata és ellenőrzése

## Mit kapsz az építés végén?

Az Agent Akadémia az építőmezőben lévő képességeket sorrendbe tett munkautasítássá alakítja. A saját modulok belső lépéseit is kibontja. A fel nem használt saját modulokat nem adja át.

Jelenleg ezt az utasítást kézzel lehet átadni egy ChatGPT- vagy Claude-beszélgetésnek. A feladatot az ott elérhető AI és eszközök végzik. Ez nem automatikusan települő, önállóan futó agent.

## A használat menete

1. Tedd az elemeket az építőmezőbe. Ha a sorrend nem kapcsolódik, javítsd az összegzésnél jelzett hiányt.
2. Kattints az összegzés alatti **Tovább a használathoz** gombra.
3. Válassz **ChatGPT** vagy **Claude** célt. Nézd meg a kiválasztott képességek eszközigényét.
4. Az **Utasítás másolása** gomb után nyisd meg a választott AI-t. Indíts új beszélgetést, illeszd az utasítást az üzenetmezőbe, és küldd el.
5. Másold át a próbafeladatot ugyanabba a beszélgetésbe. Előkészített példát kapsz, de átírhatod. Add meg előre, mitől számít jónak az eredmény.
6. Ha fájlfeldolgozást kértél, a szükséges valódi fájlt az AI-ban külön csatold. Új szöveg írásához a célt és az elvárásokat kell megadnod, nem egy már megírt szöveget.
7. A kapott választ hozd vissza az **Eredmény ellenőrzése** lépésbe. Képet vagy fájlt az AI felületén nyiss meg; itt írd le, mit néztél meg és mit tapasztaltál.
8. Értékeld a három szempontot, majd mentsd vagy töltsd le az ellenőrzést.

## Ha kiveszel egy elemet

Az összeállítás tovább szerkeszthető. A **Visszateszem** gomb azonnal visszaállítja a törlés előtti állapotot. A **Másik elemet választok** gomb a teljes elemtárhoz visz. A Javasolt lista a kivett elem helyéhez ajánl pótlást; az elemtár megnevezi, melyik lépés elé illesztünk.

Ha a törlés miatt megszakadt a lépések kapcsolata, az összegzés megmutatja a hiányt. Ezt a használat előtt javítani kell, de közben szabadon hozzáadhatsz, kivehetsz és mozgathatsz elemeket. A korábbi próba nem igazolja automatikusan a módosított tervet.

## Melyik letöltés hová kerül?

| Művelet | Mit kapsz? | Hová kerül / mire való? |
| --- | --- | --- |
| Utasítás másolása | A kiválasztott lépések teljes munkautasítása | A vágólapra. Te illeszted be az AI üzenetmezőjébe. |
| Használati útmutató letöltése (.txt) | Menet, utasítás, próbafeladat, ellenőrzőlista | A böngésző által beállított letöltési helyre, vagy a választott mappába. |
| Építési terv mentése (.json) | Az itteni szerkeszthető összeállítás és saját modulok | Később az Agent Akadémia Terv visszatöltése gombjával nyitható meg. |
| Ellenőrzés mentése | A próba, eredmény, értékelés, dátum, cél és tervváltozat | Ezen a böngészőn, legfeljebb az utolsó 20 bejegyzés. |
| Ellenőrzés letöltése | Olvasható értékelési jegyzőkönyv | A böngésző letöltései közé vagy a kiválasztott mappába. |

A letöltés egyik esetben sem telepít agentet és nem kapcsol össze fiókokat. A saját gépes moduláris futtatóhoz még nincs telepítő.

## Mit tudunk ellenőrizni?

A műhely a lépések bemeneti és kimeneti típusainak illeszkedését ellenőrzi. Ez nem igazolja, hogy egy külső AI jól oldja meg a feladatot.

Az eredményellenőrzés most **felhasználói értékelés**. A kérdések: tényleg létrejött-e a kért eredmény; betartotta-e a feltételeket; átnézted-e a tartalmat és találtál-e hibát. Részleges ellenőrzés nem kap megfelelt állapotot. Egy jelzett hiba esetén javítás szükséges.

A próbanapló mindig az adott összeállításhoz, célhoz és próbafeladathoz kapcsolódik. Módosítás után a korábbi értékelés csak történeti bejegyzés. Egy sikeres próba nem bizonyítja, hogy minden későbbi feladat is sikerülni fog.

Az AI saját lépésnaplója beszámoló, nem független bizonyíték. Automatikus követéshez bekötött futtató, valódi futásazonosító, lépésállapotok, hibák és eredményfájlok szükségesek. Ez a kapcsolat még nincs bekötve.

## Eszközök és ismételt használat

A szöveges képességek utasításként kérhetők. A kép-, hang- és fájlkezeléshez a célban elérhető eszköz kell. A grafikai szerkesztő, mappába mentés és időzítés külön bekötést igényel. A csomag arra utasítja az AI-t, hogy hiányzó eszköznél álljon meg és nevezze meg az akadályt.

Az utasítást új beszélgetésbe ismét bemásolhatod, vagy a választott AI projektutasításai között mentheted. A hivatalos útmutatók: [ChatGPT használata](https://learn.chatgpt.com/docs/use-chatgpt), [ChatGPT-projektek](https://learn.chatgpt.com/docs/projects), [Claude-projektek](https://support.claude.com/en/articles/9519177-how-can-i-create-and-manage-projects).
