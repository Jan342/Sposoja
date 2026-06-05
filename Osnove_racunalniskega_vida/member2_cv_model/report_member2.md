# Model za preverjanje identitete z obrazom

V projektu je uporabljen Face ID kot dodatno preverjanje identitete pri prijavi v
aplikacijo. Uporabnik se najprej prijavi z uporabniskim imenom in geslom, nato pa
aplikacija odpre kamero in preveri se obraz. S tem sistem deluje kot preprost primer
dvofaktorske avtentikacije.

## Uporabljen pristop

Za prepoznavo obraza je uporabljen klasicni pristop racunalniskega vida. Ne gre za
nevronsko mrezo, ampak za kombinacijo zaznave obraza, izracuna znacilk in primerjave
razdalj med obraznimi predlogami.

Postopek deluje tako:

1. Na vhodni sliki se z algoritmom Haar Cascade najprej poisce obraz.
2. Najvecji zaznani obraz se izreze iz slike.
3. Slika obraza se pretvori v sivinsko obliko in izboljsa s postopkom CLAHE.
4. Iz obraza se izracunajo znacilke DCT in regionalni LBP.
5. Znacilke se normalizirajo v enoten vektor.
6. Pri registraciji se vektorji vec slik shranijo kot obrazne predloge uporabnika.
7. Pri prijavi se nov obraz primerja s shranjenimi predlogami.
8. Ce je razdalja do najblizje predloge dovolj majhna, je prijava dovoljena.

Haar Cascade je uporabljen samo za lokacijo obraza. Dejanska prepoznava identitete
temelji na lastni kombinaciji DCT znacilk, LBP teksturnih znacilk in primerjave z
evklidsko razdaljo.

## Razlog za izbiro

Tak pristop je primeren za manjsi studentski projekt, ker ne zahteva velike kolicine
ucnih slik ali dolgega ucenja nevronske mreze. Deluje hitro, je razumljiv in ga je
mogoce neposredno povezati z mobilno aplikacijo in API streznikom.

Prednost tega pristopa je tudi razlozljivost. Jasno je, kateri koraki vplivajo na
rezultat: zaznava obraza, predobdelava, izracun znacilk in izbrani prag oziroma
threshold.

## Registracija oziroma ucenje modela

Model se za posameznega uporabnika izdela ob registraciji. Uporabnik posname vec slik
obraza, iz vsake slike pa se izracuna vektor znacilk. Ti vektorji se shranijo v `.npz`
datoteko in predstavljajo naucene obrazne predloge uporabnika.

V datoteko modela se shranijo:

- obrazne predloge,
- ime uporabnika,
- uporabljen tip znacilk,
- izbrani threshold,
- seznam uporabljenih registracijskih slik.

Pri prijavi sistem iz nove slike ponovno izracuna znacilke in jih primerja z vsemi
shranjenimi predlogami. Uporabi se najmanjsa izmerjena razdalja.

## Hiperparametri

Pri algoritmu so pomembni predvsem naslednji hiperparametri:

- velikost obdelanega obraza: `128 x 128`,
- faktor povecave pri zaznavi obraza: `scaleFactor = 1.1`,
- stevilo sosedov pri Haar detektorju: `minNeighbors = 5`,
- najmanjsa velikost zaznanega obraza: `70 x 70`,
- velikost nizkofrekvencnega DCT dela,
- velikost regionalne LBP mreze,
- threshold za odlocitev, ali obraz pripada uporabniku.

Najpomembnejsi parameter je threshold. Ce je threshold prenizek, sistem zavrne tudi
pravega uporabnika. Ce je previsok, lahko sprejme tudi napacno osebo.

## Optimizacija thresholda

Threshold je izbran na podlagi razdalj med obraznimi predlogami. Pri registraciji se
izracunajo razdalje med shranjenimi obrazi istega uporabnika. Iz teh razdalj se doloci
osnovna meja, ki jo sistem uporabi pri prijavi.

Za bolj zanesljivo nastavitev je treba uporabiti locen validacijski nabor:

- slike pravega uporabnika, ki niso bile uporabljene pri registraciji,
- slike drugih oseb.

Na teh slikah se lahko preizkusi vec thresholdov in izbere tistega, ki ima najboljse
razmerje med varnostjo in uporabnostjo.

## Vrednotenje

Pri vrednotenju Face ID sistema niso dovolj samo pravilne in napacne napovedi. Ker gre
za preverjanje identitete, sta posebej pomembni dve napaki:

- FAR: delez drugih oseb, ki jih sistem napacno sprejme,
- FRR: delez pravih uporabnikov, ki jih sistem napacno zavrne.

Poleg tega se lahko uporabijo tudi:

- tocnost,
- precision,
- recall,
- F1,
- matrika zmede.

Pri testiranju je pomembno, da testne slike niso iste kot registracijske slike. Ce se
preverja ista slika, ki je bila uporabljena za registracijo, je razdalja lahko zelo
nizka in rezultat ni realen pokazatelj delovanja v praksi.

## Priprava za uporabo v aplikaciji

Model je pripravljen za uporabo v API strezniku. Ob registraciji endpoint
`/face/register` prejme uporabnisko ime, geslo in slike obraza. Iz slik se ustvari
`.npz` model uporabnika.

Ob prijavi se najprej preveri geslo. Ce je geslo pravilno, streznik ustvari prijavni
izziv, nato pa endpoint `/face/login` preveri se obraz. Rezultat preverjanja je JSON,
ki vsebuje informacijo, ali je uporabnik potrjen, ter izmerjeno razdaljo in uporabljeni
threshold.

S tem je model neposredno povezan z aplikacijo in uporabljen kot drugi faktor prijave.
