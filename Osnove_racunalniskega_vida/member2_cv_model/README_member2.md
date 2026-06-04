# Član 1: Zajem, priprava in augmentacija podatkov ter del aplikacijske logike

## Opis projekta
Projekt implementira sistem za prepoznavo obraza, ki razlikuje uporabnika od nepooblaščene osebe. Sistem deluje na lastnem zajemu podatkov, predobdelavi in augmentaciji za čim višjo natančnost.

Kot član 1 sem zajel več različnih slik obraza. 

## Zajem podatkov
Razvita je bila skripta 'capture.py', ki s pomočjo spletne kamere enostavno usvarja slike za poljubne razrede.

## Obdelava podatkov
V ta namen je bila ustvarjena skripta capture_dataset.py

### Detekcija in segmentacija (ROI)
* Uporaba **haar Casdade** detektorja za lociranje obraza.
* Implementiran dinamični izrez (ROI - Region of Interest) z prilagojenim padding-om, za zajem ključnih obraznih značilnosti.

### Predobdelava
* **CLAHE (Contrast Limited Adaptive Histogram Equalization):** Uporabljeno za lokalno izboljšavo kontrasta, kar omogoča prepoznavo v različnih svetlobnih pogojih.

* **Normalizacija.** Vrednosti pikslov so normalizirane na interval [0, 1].

### Augmnetacija podatkov
Za vsako sliko avtomatsko generiramo nabor transformacij
* **Geometrijske** Zrcaljenje(flip) in rotacije(+/- 15 stopinj).
* **Radiometrične** Spremembe svetlosti (osvetlitev/zatemnitev) in Gaussova zameglitev.

### Organizacija podatkov
Skripta nam ustvari tudi testne datoteke pod imenom 'test', 'train' in 'val' in v njih naključno razporedi slike v določenem številu.
Nad slikami v 'train' se model uči, (70%)
slike v 'val' model nikoli ne vidi in so nam v pomoč, da izvemo ali se model uči na pamet, (15%)
slike v 'test' pa testiramo model, da vidimo kako bo deloval v realnem svetu. (15%)

## Navodila za zagom
**Zajem** Zaženite 'python capture.py' in sledite navodilom v konzoli.
**Obdelava** Zaženite 'python process_data.py' ki bo podatke premaknil v mapo '/dataset/'

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
