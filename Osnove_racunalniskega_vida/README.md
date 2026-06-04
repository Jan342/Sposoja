Osnove računalniškega vida

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

## Navodila za zagon
**Zajem** Zaženite 'python capture.py' in sledite navodilom v konzoli.
**Obdelava** Zaženite 'python process_data.py' ki bo podatke premaknil v mapo '/dataset/'