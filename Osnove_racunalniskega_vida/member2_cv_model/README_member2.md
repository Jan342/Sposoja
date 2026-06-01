# Clan 2: model racunalniskega vida

Ta mapa vsebuje samo prispevek clana 2. Datoteke ne spreminjajo zajema podatkov, priprave podatkov, API-ja ali zagonskega okolja.

## Namen

Model resuje klasifikacijo slik v razrede, ki jih pripravi podatkovni del projekta. Privzeto pricakuje strukturo:

```text
dataset/
  train/
    lopar/
    no_loparji/
    paketnik/
  val/
    lopar/
    no_loparji/
    paketnik/
  test/
    lopar/
    no_loparji/
    paketnik/
```

Ce mapa `val` ne obstaja, skripta samodejno izdela validacijski del iz ucnih slik. Ce `test` ne obstaja, za tehnicni preizkus uporabi validacijski del, vendar je za koncno porocilo priporocen locen testni nabor.

## Izbran pristop

Uporabljen je klasicni algoritem racunalniskega vida:

- predobdelava: resize, glajenje, sivinska slika in izravnava histograma,
- znacilke: HSV barvni histogram, gostota robov Canny in opcijsko HOG,
- klasifikator: k najblizjih sosedov, implementiran z NumPy.

Ta pristop je primeren za manjsi studentski podatkovni nabor, ker ne potrebuje velike kolicine slik ali dolgega ucenja nevronske mreze. Hkrati je razlozljiv: jasno se vidi, katere znacilke so uporabljene in kateri hiperparametri vplivajo na rezultat.

## Zagon ucenja

```powershell
python scripts/member2_train_model.py --dataset dataset
```

Izhodne datoteke:

```text
member2_cv_model/artifacts/member2_model.npz
member2_cv_model/artifacts/metrics.json
member2_cv_model/artifacts/test_predictions.csv
```

## Predikcija ene slike

```powershell
python scripts/member2_predict_model.py samples/lopar2.jpg
```

Skripta izpise JSON z napovedanim razredom in zaupanjem.

## Optimizirani hiperparametri

Skripta preveri kombinacije:

- velikost slike: `96`, `128`,
- stevilo binov v HSV histogramu: `8`, `12`,
- velikost HOG celice: `16`, `32`,
- uporaba HOG znacilk: `true`, `false`,
- stevilo sosedov kNN: `1`, `3`, `5`.

Najboljsi model je izbran po `macro_f1`, nato po tocnosti na validacijskem naboru.

## Metrike

V `metrics.json` se shranijo:

- tocnost,
- macro F1,
- precision, recall in F1 po razredih,
- matrika zmede,
- zgodovina preizkusenih hiperparametrov.
