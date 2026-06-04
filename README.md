# Sposoja
📦 Pametni paketnik – projektna naloga
👤 User Story

Projekt Pametni paketnik temelji na konceptu izposoje predmetov med uporabniki.

Uporabnik lahko odda predmet v paketnik, drugi uporabnik pa ga lahko prevzame, uporablja in nato vrne.
Če si uporabnik predmet izposodi in ga ne vrne pravočasno, sistem pošlje obvestilo lastniku preko aplikacije.

🛠️ Razdelitev dela
Uroš – implementacija odpiranja paketnika
Jan – sistem obveščanja uporabnikov (npr. ob zamudi pri vračilu)
Dejan – logika izposoje (vmesni del sistema)
📅 Časovni načrt
2. teden – implementacija prijave (login)
4. teden – implementacija sistema izposoje
6. teden – obvestila in odpravljanje napak (bug fixing)


# Namestitev
## Zahteve

Za delovanje celotnega projekta potrebujete:
- Mongodb
- Docker (opcijsko, vendar priporočljivo)

Projekt je mogoče namestiti na dva načina:

1. **Z uporabo Dockerja in Docker Compose**
2. **Ročnim zagonom posameznih komponent**

## Namestitev z Dockerjem

Za uporabo Dockerja in Docker Compose odprite terminal v korenski mapi projekta in zaženite naslednji ukaz:

```bash
docker compose up --build
```
Ukaz najprej zgradi vse potrebne Docker slike, nato pa samodejno zažene vse komponente projekta. Po uspešnem zagonu je aplikacija pripravljena za uporabo.

Po zagonu bodo posamezni servisi dostopni na naslednjih vratih:

- MongoDb (27017)
- Backend (3001)
- Python server (3002)
- Frontend (5173)

## Ročni zagon komponent

Alternativno lahko posamezne komponente projekta zaženete ročno.

### Razvoj aplikacij za internet
Najprej se premaknite v mapo ```frontend``` in namestite odvisnosti z ukazom:

```bash
npm install
```
Ukaz ustvari mapo ```node_modules```, ki vsebuje vse potrebne knjižnice za delovanje aplikacije.

Isto naredite za mapo ```backend```

Zagon te aplikacije je potrebno zagnati ločeno v mapi ```frontend``` in ločeno v mapi ```backend```

### Razvojni način
```bash
npm run dev
```
### Navaden način

```bash
npm start
```


# Namestitev sistema za osnove računalniškega vida
## Zahteve
Za delovanje sistema potrebujete program miniconda na povezavi: https://www.anaconda.com/download/success
 - Conda okolje

# Namestitev okolja
Okolje namestimo z ukazom v terminalu:

```bash
conda install --file environment.yml
```

# Aktiviramo z
Za vstop v to okolje

```bash
conda activate LoparGO
```

# Za vzpostavitev serverja
Teče server z ukazom:

```bash
uvicorn server:app --reload --host 0.0.0.0 --port 3002
```

Po zagonu dobimo informacijo o 'uspešnosti'
- INFO:     Uvicorn running on http://0.0.0.0:3002 (Press CTRL+C to quit)

Na linku http://localhost:3002 preverimo delovanje.

# Uporaba mobilne aplikacije
Za delovanje mobilne aplikacije potrebujemk
- android studio
- emulator ali fizični android telefon, ki ga povežemo na računalnik z USB kablom. 

Za emulator gremo v android studiu na desni strani pod zavihek "device manager", kliknemo na +, nato "create virtual device" in izberemo željen emulator. Bolje manjši in osnovni model. Po izboru kliknemo next in finish.

Zaženemo aplikacijo ko kliknemo zgoraj na zelen trikotnik.