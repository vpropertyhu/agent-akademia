# Kártyák kiválasztása — 2026. szeptember 14.

## A privát műhelyben (`/` és `/proba`)

- Minimum egy AI-kártya: **Megírja** vagy **Teendőket készít**.
- Maximum hét különböző AI-kártya; minden képesség egyszer választható.
- Az **Utánanéz** mellé is szükséges Megírja vagy Teendőket készít.
- Az **Összefoglalja**, **Lefordítja**, **Átnézi** és **Képet készít** előtt készüljön el a szöveg egy Megírja vagy Teendőket készít kártyával.
- Az Utánanéz az első, a Képet készít az utolsó kártya.
- Hozzáadáskor a felület elrendezi a kártyákat. Kézi sorrendváltoztatás után jelzi a hibát, és javítógombot ad.
- Alapkártya kivételekor azonnal megjelenik a hiány és a két pótlási lehetőség. Az összeállítás tovább szerkeszthető.
- A mentés és visszaellenőrzés automatikus; ezekhez nem kell külön kártya.
- A feladat leírása és az AI-kapcsolat külön feltétel. A kártyák megfelelő összeállítása önmagában nem indít AI-hívást.

## A korábbi tervezőben (`/epito`)

Itt a kezdést is kártya jelöli. Példa: **Írd le, mit szeretnél + Szövegírás** — két külön kártya, egy AI-feladat. A katalógus közvetlenül megmutatja az előfeltételeket és a webes próbában nem futtatható elemeket.

Új kártyát 40 látható kártyáig lehet hozzáadni. A korábban mentett, nagyobb tervek megnyithatók és csökkenthetők. Együtt mentett kártyán belül több lépés is lehet; ez nem emeli meg a webes próba hét különböző AI-feladatos határát. A leírás és a dokumentumkártya nem számít külön AI-feladatnak a próbában.

A kipróbálás gombja előtt láthatók a hiányok: nem támogatott képesség, ismétlődés, túl sok AI-feladat, hiányzó szövegíró feladat, rossz sorrend, üres név vagy hiányzó feladatleírás. A kézi átadás lehetősége megmarad a megfelelően összekapcsolt tervekhez.

## Ellenőrzés

- 128 kártyakombináció hozzáadása, alapkártyák kivétele és pótlása, a futtató meglévő szabályai alapján.
- Hibás sorrend, ismétlődés, csoportosított lépések számlálása és javítása, régi tervek kipróbálhatósága.
- A meglévő 15 törlés–visszaillesztés eset sikeres.
- TypeScript-ellenőrzés és teljes webes összeállítás sikeres.

A módosítás nem igényelt API-kulcsot és nem indított AI-hívást. A kulcs beállítása továbbra is külön, függőben lévő feladat. Az oldal hozzáférése kizárólag a tulajdonosé marad.
