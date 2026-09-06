# Cucina Sicura — Gestione HACCP per ristoranti

Applicazione web semplice, pensata per essere venduta ai ristoranti, per la
gestione quotidiana della sicurezza alimentare (HACCP) e la tracciabilità dei
prodotti.

## Funzionalità

- **Cruscotto**: riepilogo giornaliero con avvisi su prodotti in scadenza e
  raffreddamenti non conformi, più azioni rapide.
- **Raffreddamenti / Abbattimenti**: registro giornaliero con controllo
  automatico dei limiti HACCP (positivo ≤ +10 °C in 90 min, negativo ≤ −18 °C
  in 240 min) e segnalazione di conformità.
- **Congelamenti**: tracciabilità dei prodotti congelati con lotto, data di
  congelamento e scadenza (con avvisi di scadenza).
- **Etichette**: creazione e **stampa** di etichette conformi (prodotto, date,
  lotto, conservazione, allergeni) con anteprima dal vivo e archivio riutilizzabile.
- **Ordini fornitori**: ordini collegati ai fornitori con articoli, stato
  (bozza / inviato / ricevuto) e invio via email in un clic.
- **Prodotti**: anagrafica con categoria, fornitore, allergeni, conservazione e
  durata (shelf life).
- **Fornitori**: anagrafica con contatti e prodotti collegati.

## Tecnologia

Vite + React + TypeScript + Tailwind CSS. I dati sono salvati **localmente** sul
dispositivo (localStorage): l'app funziona subito, senza registrazione né backend.

## Comandi

```bash
npm install        # installa le dipendenze
npm run dev        # avvia in sviluppo
npm run build      # build di produzione
npm run build:preview  # build single-file (index.html autonomo) in dist-preview/
```

> Nota: i dati di esempio sono ripristinabili dal menu laterale ("Dati
> dimostrativi"). L'app non richiede chiavi o variabili d'ambiente.
