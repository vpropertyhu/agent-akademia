# Egy témából kész anyag

Nyisd meg az oldal **Próbálj ki egy segítőt** gombját, vagy a `/proba` címet.

1. Először az **Előbb megnézek egy kész példát** gombbal nézd meg a cikket, a posztot és a képet. Ez előre elkészített bemutatóanyag.
2. Saját feladathoz lépj be, és írd le, miről készüljön az anyag. Kész szöveget nem kell megírnod.
3. Ha fontos, add meg, kinek szóljon és mit tudjon rólad. A hátteredet az indításkor megjegyzi.
4. A **Készítsd el** gomb után az eredmény ezen az oldalon jelenik meg. A lépések állapota a tényleges feldolgozást követi.
5. A **Szövegek**, **Kép** és **Források** gombokkal nézd át az anyagokat. Letöltheted őket, és a **Korábbi munkáim** között később is megnyithatod.
6. Ha módosítást kérsz, új változat készül. Ez új AI-munkát indít, a korábbi megmarad.

Ha egy lépés hibás, az addig elkészült szöveget továbbra is megnyithatod. A program nem indítja újra automatikusan a fizetős műveletet.

A mentés a webes munkateredbe történik. Másik alkalmazásba nem küld és nem publikál automatikusan. Letöltéskor a böngésződ megszokott letöltési helyére kerülnek a fájlok. A saját gépes általános moduláris futtató ettől még nem készült el.

## A működtetőnek

A központi AI-hozzáférés a működtető feladata. A látogató saját API-kulcs nélkül használhatja a webes változatot, ha a szolgáltatás csatlakoztatva van és van használati keret. A puszta konfiguráció nem igazolja a szolgáltatói számlázási keretet vagy egy valós kérés sikerét.

Netlify: az új útvonal a meglévő hitelesített munkakezelésen és aláírt háttérindításon keresztül fut; az AI Gateway környezeti változóit használhatja. A korábbi Render-útvonal megmarad. Sites: a működtető szerveroldali AI-hozzáférését használja.

## Megvalósításhoz használt dokumentáció

- [Netlify AI Gateway](https://docs.netlify.com/build/ai-gateway/overview/)
- [OpenAI webes keresés](https://developers.openai.com/api/docs/guides/tools-web-search)
- [OpenAI képkészítés](https://developers.openai.com/api/docs/guides/image-generation)
- [A mintacikk kertészeti forrása](https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/growing-herbs)
