# Prispevek clana 2

Clan 2 je odgovoren za model oziroma algoritem racunalniskega vida. V tem projektu je pripravljen locen modul `member2_cv_model`, ki vsebuje ucenje, optimizacijo hiperparametrov, vrednotenje in predikcijo.

## Uporabljen model oziroma algoritem

Uporabljen je klasicni pristop racunalniskega vida: iz slike se izracunajo znacilke, nato se slika klasificira z algoritmom k najblizjih sosedov. Znacilke so:

- HSV barvni histogram,
- gostota robov, izracunana z detektorjem Canny,
- opcijske HOG znacilke.

## Razlog za izbiro

Pristop je primeren za manjsi podatkovni nabor, ker ne zahteva velikega stevila ucnih slik. Prav tako je razlozljiv: pri porocilu se lahko jasno predstavi, kako barvne, robne in gradientne znacilke vplivajo na klasifikacijo. To je dobra izbira, kadar ekipa se zbira podatke in zeli hitro preveriti, ali so razredi vizualno dovolj locljivi.

## Ucenje oziroma nastavljanje

Postopek ucenja poteka v skripti `scripts/member2_train_model.py`. Slike se preberejo iz map `dataset/train`, `dataset/val` in `dataset/test`. Vsaka slika se pomanjsa na izbrano velikost, zgladi, pretvori v sivinsko obliko za robne in HOG znacilke ter v HSV prostor za barvni histogram. Nato se znacilke normalizirajo in shranijo kot vektorji.

Klasifikator kNN pri predikciji izracuna razdaljo med znacilkami nove slike in znacilkami ucnih slik. Razred je dolocen z glasovanjem najblizjih sosedov.

## Hiperparametri

Optimizirani so naslednji hiperparametri:

- velikost slike: 96 ali 128 pikslov,
- stevilo binov HSV histograma: 8 ali 12,
- velikost HOG celice: 16 ali 32,
- uporaba HOG znacilk: da ali ne,
- stevilo sosedov kNN: 1, 3 ali 5.

Optimizacija poteka z iskanjem po mrezi. Vsaka kombinacija hiperparametrov se ovrednoti na validacijskem naboru. Najboljsa kombinacija je tista z najvisjim `macro_f1`, pri izenacenju pa se uposteva se tocnost.

## Vrednotenje

Za vrednotenje se uporabljajo:

- tocnost,
- precision po razredih,
- recall po razredih,
- F1 po razredih,
- macro F1,
- matrika zmede.

Rezultati se shranijo v `member2_cv_model/artifacts/metrics.json`, napovedi za testne slike pa v `member2_cv_model/artifacts/test_predictions.csv`.

## Priprava za aplikacijo

Nauceni model se shrani v `member2_cv_model/artifacts/member2_model.npz`. Datoteka vsebuje ucne znacilke, pripadajoce oznake razredov, imena razredov in izbrane hiperparametre. Skripta `scripts/member2_predict_model.py` prikaze, kako lahko kasneje API ali aplikacija nalozi model in klasificira novo sliko.
