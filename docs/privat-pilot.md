# Agent Akadémia — a privát próba használata

Állapot: 2026. szeptember 12. A tulajdonos számára zárt Sites-próba; a nyilvános weboldal „soon...”. A barna, papír és arany arculat az eredeti grafikai csomagot követi.

## Első feladat

1. Nyisd meg a privát oldalt, és jelentkezz be a tulajdonosi fiókoddal.
2. Válassz egy kész összeállítást, vagy adj elemeket az üres munkamezőhöz. A sorrend fentről lefelé értendő. A nyilakkal változtathatod; minden elem kivehető és visszatehető.
3. Írd le, mit szeretnél elkészíttetni. Nem kész tartalmat kérünk: elég a cél, téma, célközönség és az elvárt eredmény. Például: „Készíts kezdőknek egy rövid útmutatót a hét megtervezéséhez.” Fordításnál add meg a célnyelvet is.
4. Mentsd a tervet. Bekötött AI-hozzáféréssel indítsd el; a felület az aktuális lépést mutatja. Képkészítés előtt külön jóváhagyást kér.
5. A kész anyag a saját munkáid között marad. Töltsd le az `anyag.md` fájlt és — ha készült — a `kep.jpg` képet. A hely kiválasztását támogató böngészőben külön mappába is mentheted.

**A valódi AI-futtatás feltétele:** az üzemeltető biztonságosan beállított OpenAI API-hozzáférése. Ennek hiányában a felület a terv mentését engedi, generálást nem mutat sikeresnek. A webes végfelhasználótól nem kérünk API-kulcsot. Kulcsot ne küldj beszélgetésben és ne tárolj a forráskódban.

## Mit csinálnak az elemek?

| Elem | Tényleges művelet |
| --- | --- |
| Utánanéz | Webes keresést végez, visszakapott forráshivatkozásokat tárol. Első elemként használható. |
| Megírja | Új szöveget készít a cél és az addigi eredmény alapján. |
| Összefoglalja | A korábban elkészített szöveget rövidíti. |
| Teendőkre bontja | Végrehajtható lépésekre bontja a feladatot vagy az addigi anyagot. |
| Lefordítja | A korábban elkészített szöveget a megadott nyelvre fordítja. |
| Átnézi | Külön modellhívással felülvizsgálja az addigi szöveget. Ez nem független tényellenőrzési garancia. |
| Képet készít | Az addigi anyag alapján egy képet generál, jóváhagyás után. Utolsó AI-elem. |

A mentés és a visszaellenőrzés automatikusan a sor végére kerül. Az ellenőrzés a tárolt fájlt újra beolvassa, méretét és SHA-256 lenyomatát összehasonlítja a létrehozottal. A „kész” állapothoz az adatbázisból visszaolvasott eredménynek is egyeznie kell.

## Hol vannak az eredmények?

A terv, az egyes lépések eredménye és az események a privát alkalmazás felhasználóhoz kötött adatbázisában; a fájlok a privát tárhelyen. A letöltés külön művelet: az alkalmazás nem helyez fájlt másik AI-fiókba, Canva-projektbe vagy engedély nélkül a gépedre.

A böngészős mappamentés csak kifejezetten kiválasztott mappába ír, azon belül új munkamappába. Ezután a helyi fájlt is visszaolvassa. Más böngészőben a hagyományos letöltés használható; ekkor a szerveren ellenőrzött fájlt kapod meg, a letöltések mappáját az oldal nem ellenőrzi. A saját Windows/macOS gépes mappamentés gyakorlati próbája még hátravan.

## Hiba, megszakítás, folytatás

- A már befejezett lépéseket hiba után megtartja. Az újrapróbálás a hibás lépéstől folytat; nem generálja újra az egész feladatot.
- A böngészőlap lépteti a munkát. Bezárás után a már elindított szolgáltatói hívás még befejeződhet vagy megszakadhat, de a következő lépésekhez vissza kell térned és folytatnod kell. Nincs időzített háttérfuttató ebben a próbában.
- Megszakításkor a már elküldött szolgáltatói kérés nem biztos, hogy visszavonható. Új munka vagy törlés legfeljebb három percig várakozhat; az esetlegesen felmerült szolgáltatói díj nem fordul vissza automatikusan.
- Az ismeretlen fogyasztást a rendszer ismeretlenként jelzi. Nem ír nulla költséget olyan kéréshez, amelynek eredménye nem érkezett vissza.
- Legfeljebb 20 új terv/fiók és 200 új terv/alkalmazás fogadható be gördülő 24 órán belül, legfeljebb 10 AI-próbálkozással munkánként. A törlés nem adja vissza a keretet. A tartalom nélküli befogadási napló megőrzi a munkaazonosítót, a tulajdonosazonosítót és az időpontot; automatikus teljes fióktörlés nem készült.

## Műszaki ellenőrzés és éles próba

`node tests/pilot.mjs`: a tényleges tervellenőrzőt, AI-lépéskezelőt, szolgáltatást és API-kezelőt teszteli. Valódi SQLite-adatbázison alkalmazza a migrációkat; a külső AI-válaszokat, a hitelesítést és az R2-tárhelyadaptert helyettesíti. Ellenőrzi a hét elem végigfutását, a párhuzamos indítás kizárását, képes jóváhagyást, csak a hibás lépés újrapróbálását, sérült fájl visszaolvasását, megszakítást, törlést, tulajdonosi elkülönítést és kulcshiányt. A típusellenőrzés és a Sites build sikeres.

Felületi próbában ellenőrizve: kész összeállítás kiválasztása, elem kivétele és visszahelyezése, sorrend változtatása és érthető hibaüzenete, cél megadása. A privát bejelentkezés és az élő AI-futtatás közös végigpróbálása a hozzáférés bekötése után következik.

Az első éles próbában egy rövid „Megírja” feladatot indítsunk, majd ellenőrizzük a tartalmat, a mentett fájl újranyitását és az előzményből visszatöltést. Ezután jöhet egy keresés → írás → átnézés → jóváhagyott képkészítés feladatsor. A tartalmi minőséget ember értékeli; a fájl lenyomata csak a mentés épségét bizonyítja.

## A próba határai

Nincs még Gmail-, Canva- vagy más üzleti fiókkapcsolat, automatikus publikálás, fizetés vagy modulvásárlás. Ez a feladatsor-futtató a privát Sites-példányban készült el; nem került át a régebbi Netlify/Render motorba vagy a régi letölthető helyi csomagba. A régi modulépítő a `/epito`, a korábbi kutatófelület a `/kutato` útvonalon marad elérhető. A régi építőből csak a valóban végrehajtható képességeket tartalmazó terv indítható az új próbában.
