// User-facing guidance for the current interface; keep paths and steps aligned with the components.
export type HelpAction = 'edit-profile' | 'profile' | 'saved' | 'language' | 'terms';
type HelpArticle = {
  id: string; category: string; title: string; summary: string; keywords: string;
  steps: string[]; note?: string; related: string[]; action?: HelpAction;
};

export const helpArticles: HelpArticle[] = [
  {
    id: 'iniziare', category: 'Primi passi', title: 'Come funziona TempleSale?',
    summary: 'Scopri le attività vicine, guarda le loro foto e contattale direttamente.',
    keywords: 'inizio iniziare guida utilizzo funziona piattaforma cliente visitatore negozi acquisto comprare vendita',
    steps: ['Nella Home trovi le pubblicazioni delle attività. Consenti la posizione per scoprire quelle più vicine a te.', 'Tocca il nome di un’attività per aprire il profilo: trovi foto, descrizione, orari, indirizzo e WhatsApp.', 'Usa la lente per cercare un’attività, un servizio o una città. Per chiedere informazioni, usa il pulsante WhatsApp dell’attività.'],
    note: 'TempleSale non gestisce pagamenti. Prezzi, disponibilità e accordi vanno chiariti direttamente con l’attività.', related: ['cercare', 'posizione', 'whatsapp'],
  },
  {
    id: 'account', category: 'Primi passi', title: 'Come registro la mia attività e inizio a pubblicare?',
    summary: 'Accedi, completa il profilo aziendale e conferma le condizioni richieste.',
    keywords: 'registrazione iscrizione iscriversi registrarsi login accedere accesso email conferma autenticazione azienda negozio aprire creare account',
    steps: ['Tocca Attività oppure Pubblica e segui la procedura di accesso o registrazione.', 'Se viene richiesto, verifica l’email e completa l’accettazione delle condizioni.', 'Compila il profilo: nome dell’azienda, categoria, città, posizione sulla mappa e WhatsApp. Salva il profilo aziendale.', 'Ora puoi pubblicare una foto con Pubblica oppure Pubblica foto nel tuo profilo.'],
    related: ['profilo', 'pubblicare', 'condizioni'], action: 'edit-profile',
  },
  {
    id: 'visitatori', category: 'Primi passi', title: 'Cosa posso fare senza un account?',
    summary: 'Anche i visitatori possono esplorare, commentare, mettere Mi piace e salvare foto.',
    keywords: 'visitatore ospite anonimo senza account senza registrazione commentare piace salvare dispositivo cookie',
    steps: ['Esplora Home, ricerca e profili pubblici senza registrare un’attività.', 'Usa le icone delle pubblicazioni per commentare, mettere Mi piace o salvare. Le interazioni dei visitatori possono comparire come Visitatore.', 'Per rivedere i salvati da visitatore usa il segnalibro nella barra superiore. Per pubblicare foto della tua attività devi accedere e completare il profilo.'],
    note: 'Le interazioni da visitatore dipendono dall’identificazione di questo browser. Cambiando dispositivo o cancellando i dati del sito potresti non ritrovarle.', related: ['salvati', 'mi-piace', 'commentare'],
  },
  {
    id: 'visibilita', category: 'Profilo e visibilità', title: 'Come faccio a farmi trovare da più persone?',
    summary: 'Cura posizione, categoria, parole chiave e foto della tua attività.',
    keywords: 'visibilita visualizzazioni raggiungere persone clienti pubblico apparire trovare scoperta promuovere pubblicizzare crescere profilo azienda',
    steps: ['Apri Modifica profilo e controlla nome dell’azienda, categoria, città e posizione esatta dell’attività.', 'Aggiungi parole chiave che descrivono davvero i servizi o i prodotti offerti. Usa termini che un cliente cercherebbe.', 'Pubblica foto chiare e didascalie utili. Nel profilo scegli con la stella la foto che rappresenta meglio la tua attività nella Home.', 'Mantieni aggiornati orari, descrizione e WhatsApp, così chi ti trova sa come contattarti.'],
    note: 'La Home privilegia la prossimità. Scegliere una foto o ricevere Mi piace non garantisce il primo posto né un numero di visualizzazioni.', related: ['parole-chiave', 'foto-home', 'indirizzo'], action: 'edit-profile',
  },
  {
    id: 'profilo', category: 'Profilo e visibilità', title: 'Come modifico i dati del profilo aziendale?',
    summary: 'Aggiorna nome, categoria, descrizione, orari e recapiti.',
    keywords: 'profilo modifica modificare cambiare azienda nome categoria settore descrizione orari apertura informazioni dati',
    steps: ['Apri il tuo profilo da Attività e tocca Modifica profilo. Puoi aprirlo anche dal menu dell’account in alto.', 'Aggiorna i campi necessari: dati dell’azienda, parole chiave, orari, nome del proprietario, WhatsApp e indirizzo.', 'Controlla la posizione sulla mappa, quindi tocca Salva profilo aziendale in fondo al modulo.'],
    note: 'Se provi a chiudere il modulo con modifiche non salvate, puoi scegliere Salva ed esci, Esci senza salvare oppure continuare a modificare. Aspetta la conferma del salvataggio.', related: ['parole-chiave', 'indirizzo', 'telefono'], action: 'edit-profile',
  },
  {
    id: 'foto-profilo', category: 'Profilo e visibilità', title: 'Come cambio o apro la foto del profilo?',
    summary: 'La foto del profilo identifica l’attività; la foto della Home è una scelta separata.',
    keywords: 'foto profilo immagine logo avatar cambiare sostituire aprire vedere schermo intero',
    steps: ['Apri il tuo profilo e tocca Cambia foto vicino all’immagine del profilo.', 'Scegli un’immagine dal dispositivo e attendi la conferma del caricamento.', 'Per vederla a schermo intero, tocca la foto del profilo oppure Vedi foto. Chiudi con la X in alto.'],
    note: 'Cambiare la foto del profilo non sceglie la pubblicazione della Home. Per quella scelta usa la stella nella griglia delle pubblicazioni.', related: ['foto-home', 'profilo'], action: 'profile',
  },
  {
    id: 'parole-chiave', category: 'Profilo e visibilità', title: 'Come uso le parole chiave per comparire nelle ricerche?',
    summary: 'Indica servizi e prodotti che i clienti cercano, senza modificare il nome dell’azienda.',
    keywords: 'parole chiave keywords tag tags hashtag ricerca trovare servizi prodotti parolechiave termini pizza consegna',
    steps: ['Apri Modifica profilo e cerca Parole chiave.', 'Scrivi termini pertinenti, separati da virgole, poi tocca Aggiungi oppure premi Invio. Puoi anche toccare un suggerimento.', 'Per esempio, una pizzeria può indicare pizza da asporto, consegna a domicilio e forno a legna, se offre questi servizi.', 'Rimuovi una parola con la X del relativo tag e salva il profilo aziendale.'],
    note: 'Le parole chiave aiutano la ricerca insieme a nome, città, categoria e contenuti delle pubblicazioni. Non occorre aggiungere #; una parola nella didascalia non crea una comunità di hashtag.', related: ['visibilita', 'cercare', 'profilo'], action: 'edit-profile',
  },
  {
    id: 'foto-home', category: 'Profilo e visibilità', title: 'Come scelgo la foto da mostrare nella Home?',
    summary: 'Usa la stella nella griglia del tuo profilo per scegliere una pubblicazione.',
    keywords: 'foto home copertina vetrina prima immagine davanti stella evidenza principale fissare scegliere selezionare mostrare',
    steps: ['Apri il tuo profilo da Attività e scorri fino alla griglia delle foto.', 'Tocca la stella sulla foto che vuoi mostrare nella Home. Dopo la conferma, la stella diventa blu e compare Home.', 'Puoi scegliere una sola foto per attività. Per sostituirla, tocca la stella di un’altra foto.', 'Per tornare alla scelta automatica della pubblicazione più recente, tocca di nuovo la stella selezionata.'],
    note: 'La scelta rimane anche se pubblichi nuove foto. Se elimini la foto scelta, torna la più recente disponibile. Data, Mi piace e commenti restano quelli originali; l’ordine per vicinanza non cambia.', related: ['home', 'pubblicare', 'modificare-foto'], action: 'profile',
  },
  {
    id: 'indirizzo', category: 'Profilo e visibilità', title: 'Come imposto la posizione della mia attività?',
    summary: 'Città, indirizzo e punto sulla mappa devono corrispondere alla sede reale.',
    keywords: 'indirizzo sede negozio azienda posizione localizzazione mappa coordinate citta spostare trasferire gps attivita non appare',
    steps: ['Apri Modifica profilo e vai a Posizione dell’azienda.', 'Se sei nella sede dell’attività, usa il comando per la posizione attuale. Altrimenti scegli Mappa e indica la sede corretta.', 'Controlla città, indirizzo e gli altri campi del modulo: scrivere il nome della città da solo non sostituisce il punto sulla mappa.', 'Salva il profilo aziendale. La posizione dell’attività viene usata per mostrarla ai clienti vicini.'],
    note: 'Il GPS del visitatore e la sede dell’attività hanno scopi diversi. Spostarti con il telefono non deve spostare automaticamente l’indirizzo della tua azienda.', related: ['posizione', 'visibilita', 'home'], action: 'edit-profile',
  },
  {
    id: 'telefono', category: 'Profilo e visibilità', title: 'Come inserisco il numero WhatsApp?',
    summary: 'Controlla il prefisso Italia e inserisci il numero corretto dell’attività.',
    keywords: 'telefono numero whatsapp prefisso italia +39 trattino spazi parentesi contatto cellulare',
    steps: ['In Modifica profilo vai a WhatsApp dell’azienda e controlla il prefisso Italia (+39).', 'Inserisci il numero. Spazi, trattini e parentesi vengono normalizzati; sono riconosciuti anche i prefissi espliciti +39 e 0039.', 'Salva il profilo e verifica che il pulsante WhatsApp del profilo apra il contatto corretto.'],
    note: 'Il numero deve essere valido e associato al contatto che vuoi usare. La normalizzazione del formato non verifica che il numero appartenga alla tua attività.', related: ['whatsapp', 'profilo'], action: 'edit-profile',
  },
  {
    id: 'pubblicare', category: 'Foto e pubblicazioni', title: 'Come pubblico una foto?',
    summary: 'Scatta o scegli una foto, preparala e segui l’invio nella Home.',
    keywords: 'pubblicare pubblicazione post foto nuova caricare inviare upload immagine galleria scattare didascalia legenda',
    steps: ['Accedi con l’account dell’attività e tocca Pubblica nella barra inferiore oppure Pubblica foto nel tuo profilo.', 'Scatta una foto oppure scegli Galleria. Se il sito chiede di completare il profilo, inserisci i dati richiesti e salva.', 'Regola la foto, aggiungi eventuali effetti e scrivi la didascalia nella scheda dedicata, fino a 300 caratteri.', 'Tocca Pubblica. Puoi continuare a scorrere la Home mentre la barra in alto indica l’invio. Attendi la conferma prima di considerare pubblicata la foto.'],
    note: 'Ogni pubblicazione contiene una foto. Se c’è già un invio in corso, il pulsante Pubblica ti riporta alla Home per seguirlo.', related: ['editor', 'bozze', 'invio'], action: 'profile',
  },
  {
    id: 'editor', category: 'Foto e pubblicazioni', title: 'Come regolo la foto e aggiungo una didascalia?',
    summary: 'Prepara l’immagine prima di pubblicarla usando i comandi dell’editor.',
    keywords: 'editor modificare foto zoom ritaglio centrare ingrandire filtri effetti luminosita testo scrivere didascalia legenda',
    steps: ['Dopo aver scelto una foto, usa i comandi di zoom e trascinamento per regolare l’inquadratura. Centralizza l’immagine se vuoi riposizionarla.', 'Apri Filtri ed effetti per cambiare l’aspetto della foto.', 'Apri la scheda della didascalia e scrivi il testo. Inserisci informazioni utili su ciò che mostri.', 'Controlla l’anteprima e tocca Pubblica. Per cambiare una foto già pubblicata, usa invece la matita nel tuo profilo.'],
    related: ['pubblicare', 'modificare-foto', 'bozze'],
  },
  {
    id: 'bozze', category: 'Foto e pubblicazioni', title: 'Come riprendo o elimino una bozza?',
    summary: 'Recupera un invio non completato oppure scarta la vecchia foto.',
    keywords: 'bozza bozze rascunho recuperare riprendere ripristinare vecchia foto bloccata cancellare eliminare sostituire',
    steps: ['Se la Home mostra un errore di invio, tocca Riprendi la bozza. Puoi anche riaprire Pubblica.', 'Quando compare la bozza recuperata, controlla foto e didascalia prima di riprovare.', 'Se non vuoi più quella foto, tocca Elimina la bozza e scegli un’altra foto nel messaggio dell’editor, poi segui l’eventuale conferma.'],
    note: 'La bozza viene conservata in questo browser e non è un archivio permanente. Eliminare una bozza non elimina una foto che il server ha già pubblicato: controlla il tuo profilo se un invio aveva esito incerto.', related: ['invio', 'pubblicare', 'modificare-foto'],
  },
  {
    id: 'invio', category: 'Foto e pubblicazioni', title: 'La pubblicazione è lenta o mostra un errore: cosa faccio?',
    summary: 'Controlla la barra nella Home e conserva la bozza finché l’esito non è chiaro.',
    keywords: 'errore invio pubblicazione caricamento lento bloccato fallito load failed server occupato timeout ritentare riprovare attesa barra',
    steps: ['Durante l’invio guarda la barra in alto nella Home. Puoi scorrere le altre pubblicazioni mentre aspetti.', 'Se compare un errore, controlla la connessione e leggi il messaggio. Se viene chiesto di attendere, aspetta prima di riprovare.', 'Se non è chiaro se l’invio sia riuscito, controlla il tuo profilo per vedere se la foto è già presente.', 'Se manca, usa Riprendi la bozza e riprova dallo stesso invio conservato. Evita di avviare più pubblicazioni identiche mentre aspetti.'],
    note: 'Una barra di invio non è ancora una conferma di pubblicazione. Se il problema continua, segnala cosa è successo senza inviare password o codici di accesso.', related: ['bozze', 'assistenza', 'caricamento'],
  },
  {
    id: 'modificare-foto', category: 'Foto e pubblicazioni', title: 'Come modifico o elimino una foto pubblicata?',
    summary: 'Usa matita e cestino nella griglia del tuo profilo.',
    keywords: 'modificare eliminare cancellare rimuovere pubblicazione post foto matita cestino sostituire immagine didascalia',
    steps: ['Apri il tuo profilo e trova la pubblicazione nella griglia delle foto.', 'Tocca la matita per modificare la didascalia o sostituire l’immagine, poi salva le modifiche.', 'Per rimuoverla, tocca il cestino e leggi la richiesta di conferma prima di procedere.'],
    note: 'Puoi gestire le tue pubblicazioni. Eliminare una foto scelta per la Home fa tornare la selezione automatica della foto più recente disponibile.', related: ['foto-home', 'pubblicare'], action: 'profile',
  },
  {
    id: 'guardare-foto', category: 'Foto e pubblicazioni', title: 'Come apro, ingrandisco e scorro le foto?',
    summary: 'Apri il visualizzatore nero e passa ai commenti quando vuoi.',
    keywords: 'aprire vedere guardare foto immagine schermo intero nero zoom ingrandire pizzicare scorrere swipe prossima precedente',
    steps: ['Tocca una foto per aprirla nel visualizzatore con sfondo nero. Usa due dita o un doppio tocco per ingrandire e ridurre.', 'Da lì puoi mettere Mi piace, salvare, condividere o aprire i commenti con le relative icone.', 'Se hai aperto la foto dal profilo di un’attività, scorri verso l’alto o il basso per passare alle altre foto disponibili di quel profilo.', 'Chiudi i commenti per tornare alla foto; poi chiudi il visualizzatore per tornare alla pagina precedente.'],
    note: 'Per leggere una didascalia lunga nella Home, tocca Leggi di più. Anche le foto del profilo possono essere aperte a schermo intero toccando l’immagine del profilo.', related: ['commentare', 'mi-piace', 'salvati'],
  },
  {
    id: 'commentare', category: 'Commenti, Mi piace e salvati', title: 'Come scrivo un commento o una risposta?',
    summary: 'Usa il campo sotto la pubblicazione o apri la scheda Commenti.',
    keywords: 'commento commenti commentare scrivere messaggio risposta rispondere pubblicare inviare conversazione',
    steps: ['Nella Home scrivi nel campo Aggiungi un commento oppure tocca il fumetto per aprire Commenti.', 'Scrivi il testo e usa il pulsante di invio. Per rispondere a una persona, tocca Rispondi sotto il suo commento.', 'Il commento può apparire subito con una piccola barra mentre viene confermato. Se compare un errore, controlla i commenti prima di inviarlo di nuovo.', 'Per leggere altri commenti o risposte, usa il comando per caricarne altri quando disponibile.'],
    note: 'La Home mostra solo un’anteprima: il numero accanto al fumetto indica il totale dei commenti. Anche un visitatore può commentare.', related: ['gestire-commenti', 'visitatori', 'invio'],
  },
  {
    id: 'gestire-commenti', category: 'Commenti, Mi piace e salvati', title: 'Come modifico o elimino un mio commento?',
    summary: 'Apri Commenti e usa i comandi disponibili accanto al tuo testo.',
    keywords: 'modificare eliminare cancellare commento risposta matita cestino proprio testo errore correggere',
    steps: ['Apri la scheda Commenti della pubblicazione e trova il tuo commento.', 'Se compare la matita, toccala, correggi il testo e salva.', 'Se compare il cestino, usalo e conferma solo se vuoi rimuovere il commento. I comandi dipendono dai permessi dell’utente.'],
    note: 'Se hai commentato come visitatore, usa lo stesso browser. Cambiando dispositivo o cancellando i dati del sito potresti non essere più riconosciuto come autore.', related: ['commentare', 'visitatori'],
  },
  {
    id: 'mi-piace', category: 'Commenti, Mi piace e salvati', title: 'Come metto Mi piace e vedo chi ha apprezzato una foto?',
    summary: 'L’icona cambia il tuo Mi piace; il numero apre l’elenco delle persone.',
    keywords: 'mi piace like likes curtida curtir apprezzare elenco persone conteggio numero cuore rimuovere',
    steps: ['Tocca l’icona Mi piace sotto la foto per aggiungere il tuo apprezzamento. Toccala di nuovo per rimuoverlo.', 'Tocca il numero accanto all’icona oppure la scritta Mi piace sotto la foto per vedere chi ha apprezzato.', 'Nella stessa finestra puoi passare tra le schede Commenti e Mi piace, senza tornare alla Home.'],
    note: 'Anche i Mi piace dei visitatori vengono conteggiati. Mettere Mi piace non equivale a salvare la pubblicazione.', related: ['salvati', 'visitatori', 'commentare'],
  },
  {
    id: 'salvati', category: 'Commenti, Mi piace e salvati', title: 'Come salvo una pubblicazione e la ritrovo?',
    summary: 'Tocca il segnalibro per conservare una foto da rivedere.',
    keywords: 'salvare salvati salvo salvare foto segnalibro bookmark preferiti ritrovare raccolta rivedere rimuovere',
    steps: ['Tocca il segnalibro sotto la foto o nel visualizzatore per aggiungerla ai salvati. Toccalo di nuovo per rimuoverla.', 'Se hai un account, apri il menu dall’immagine dell’account in alto e scegli Salvati e preferiti.', 'Da visitatore, apri il segnalibro nella barra superiore per ritrovare le pubblicazioni salvate in questo browser.', 'Tocca una foto salvata per aprirla. Se è stata eliminata dall’autore, potrebbe non essere più disponibile.'],
    note: 'Da visitatore non è garantito il recupero cambiando dispositivo o cancellando i dati del sito.', related: ['mi-piace', 'visitatori'], action: 'saved',
  },
  {
    id: 'whatsapp', category: 'Commenti, Mi piace e salvati', title: 'Come contatto un’attività su WhatsApp?',
    summary: 'Apri una conversazione diretta con il contatto indicato dall’attività.',
    keywords: 'contatto contattare whatsapp messaggio messaggi acquistare comprare prezzo informazioni disponibilita telefono',
    steps: ['Tocca il pulsante WhatsApp nella pubblicazione o nel profilo dell’attività.', 'Si apre WhatsApp o il relativo servizio web con il numero dell’attività e, quando previsto, un messaggio iniziale.', 'Leggi e modifica il testo prima di inviarlo. Chiedi direttamente all’attività prezzi, disponibilità e condizioni.'],
    note: 'La conversazione prosegue su un servizio esterno. Se il contatto non funziona, il titolare deve controllare il numero nel profilo.', related: ['telefono', 'iniziare'],
  },
  {
    id: 'link', category: 'Commenti, Mi piace e salvati', title: 'Come funzionano i link e la condivisione?',
    summary: 'Apri l’anteprima di un link oppure condividi una pubblicazione.',
    keywords: 'link collegamento url sito esterno anteprima condividere condividi condivisione copiare copia indirizzo',
    steps: ['Un indirizzo web riconosciuto nella didascalia o nei commenti diventa un link cliccabile.', 'Toccandolo puoi vedere un’anteprima con le informazioni disponibili. Usa Apri sito per visitare la pagina esterna in una nuova scheda.', 'Per condividere una foto, usa l’icona Condividi. Secondo il browser, si apre il menu di condivisione oppure puoi copiare il link.'],
    note: 'L’anteprima dipende dalle informazioni fornite dal sito esterno: immagine e descrizione possono non essere disponibili. Non è il sito completo dentro TempleSale.', related: ['guardare-foto', 'commentare'],
  },
  {
    id: 'home', category: 'Ricerca e posizione', title: 'Perché nella Home vedo una sola foto per attività?',
    summary: 'La Home è una vetrina delle attività; il profilo raccoglie tutte le loro foto.',
    keywords: 'home feed pagina iniziale ultima foto recente una pubblicazione ordine vicinanza distanza vicine prodotti',
    steps: ['La Home mostra una pubblicazione per attività: quella scelta dal titolare con la stella oppure, in assenza di scelta, la più recente disponibile.', 'Quando la tua posizione è disponibile, le attività vengono ordinate per vicinanza. Una foto precedente può restare visibile se l’attività non ne ha pubblicate di nuove.', 'Per vedere tutte le foto disponibili, tocca il nome dell’attività e apri il suo profilo.'],
    note: 'Per essere mostrata nel feed, l’attività deve essere attiva e avere una posizione valida sulla mappa.', related: ['foto-home', 'posizione', 'visibilita'],
  },
  {
    id: 'cercare', category: 'Ricerca e posizione', title: 'Come cerco un’attività, un servizio o una città?',
    summary: 'Usa una sola barra per cercare nomi, servizi e località insieme.',
    keywords: 'ricerca cercare cerca barra lente nome intero azienda citta servizio pizza ardea risultati trovare',
    steps: ['Tocca la lente nella barra superiore e scrivi quello che cerchi.', 'Puoi combinare città e servizio, per esempio Ardea pizza, oppure scrivere il nome dell’attività.', 'La ricerca considera nome, città, categoria, parole chiave e contenuti collegati all’attività, comprese le didascalie delle pubblicazioni.', 'I risultati si aggiornano mentre scrivi. Premi Cerca o Invio sulla tastiera per inviare la ricerca e chiudere la tastiera. Tocca un risultato per aprire il profilo.'],
    note: 'Una ricerca considera prima la pertinenza dei risultati. Non è necessario che tutte le parole facciano parte del nome dell’azienda; non è però garantito riconoscere ogni sinonimo o errore di scrittura.', related: ['parole-chiave', 'posizione', 'visibilita'],
  },
  {
    id: 'posizione', category: 'Ricerca e posizione', title: 'Perché serve la mia posizione e cosa succede se mi sposto?',
    summary: 'La posizione attuale aiuta a mostrare attività e pubblicazioni vicine.',
    keywords: 'posizione gps localizzazione localita geolocalizzazione permesso autorizzazione consentire vicino vicine spostamento distanza',
    steps: ['Nella Home tocca Usa la mia posizione e conferma la richiesta del browser se compare.', 'Il sito aggiorna il GPS mentre lo usi, anche quando torni alla pagina dopo esserti spostato.', 'Se il GPS non è disponibile, controlla la localizzazione del telefono e il permesso per questo sito nel browser, poi riprova.', 'Puoi comunque usare la ricerca per indicare una città o un servizio.'],
    note: 'Precisione e disponibilità dipendono dal dispositivo e dai permessi del browser. La tua posizione di navigazione non modifica l’indirizzo dell’attività.', related: ['indirizzo', 'cercare', 'home'],
  },
  {
    id: 'mappa', category: 'Ricerca e posizione', title: 'Come vedo un’attività sulla mappa e la raggiungo?',
    summary: 'Apri l’indirizzo dal profilo e usa le indicazioni disponibili.',
    keywords: 'mappa mappe indicazioni percorso strada raggiungere navigare navigazione google maps indirizzo distanza',
    steps: ['Apri il profilo dell’attività e tocca Indirizzo oppure l’icona della posizione.', 'Controlla il punto dell’attività sulla mappa e le indicazioni disponibili.', 'Per proseguire con la navigazione esterna, usa Google Maps. Consenti la posizione se vuoi usare il tuo punto attuale come partenza.'],
    note: 'Se la sede non è corretta, il titolare deve aggiornare la posizione in Modifica profilo.', related: ['posizione', 'indirizzo'],
  },
  {
    id: 'notifiche', category: 'Account e assistenza', title: 'Dove vedo le notifiche?',
    summary: 'La campanella raccoglie le interazioni ricevute dall’account.',
    keywords: 'notifiche notifica campanella avvisi commenti mi piace nuovi leggere letti',
    steps: ['Con il tuo account aperto, tocca la campanella nella barra superiore.', 'Tocca una notifica per aprire il contenuto collegato, per esempio una pubblicazione o un commento.', 'Usa il comando per segnare tutte come lette se vuoi aggiornare l’elenco degli avvisi da leggere.'],
    note: 'La campanella del sito non equivale all’attivazione delle notifiche push del telefono.', related: ['commentare', 'mi-piace'],
  },
  {
    id: 'fotocamera', category: 'Account e assistenza', title: 'La fotocamera non si apre o richiede il permesso: cosa faccio?',
    summary: 'Controlla l’accesso alla fotocamera oppure usa una foto dalla galleria.',
    keywords: 'fotocamera camera permesso autorizzazione safari chrome consentire bloccata scattare galleria',
    steps: ['Apri Pubblica e consenti l’accesso alla fotocamera quando richiesto.', 'Se l’accesso è stato negato, apri le impostazioni del sito nel browser e controlla il permesso Fotocamera. Controlla anche i permessi del telefono.', 'Torna al sito e usa Riprova. Se la fotocamera resta indisponibile, scegli Galleria per caricare una foto.'],
    note: 'TempleSale ricorda l’utilizzo, ma il consenso effettivo è gestito dal browser e dal dispositivo. Il sito non può concedersi da solo l’accesso.', related: ['pubblicare', 'assistenza'],
  },
  {
    id: 'caricamento', category: 'Account e assistenza', title: 'La Home è vuota o le foto non si caricano: cosa controllo?',
    summary: 'Verifica connessione, messaggi di errore e posizione prima di riprovare.',
    keywords: 'home bianca vuota caricamento caricare lento immagini foto mancanti non vedo errore rete internet bloccato',
    steps: ['Controlla che il telefono sia connesso a Internet e leggi gli eventuali messaggi nella Home.', 'Se compare un comando per riprovare, usalo. Puoi anche ricaricare la pagina una volta.', 'Se mancano le attività vicine, controlla il permesso della posizione. Se manca la tua attività, verifica che il profilo sia completo e la posizione aziendale sia stata salvata.', 'Se il problema continua, annota l’orario, il dispositivo, il browser e il messaggio visualizzato per segnalarlo.'],
    related: ['posizione', 'indirizzo', 'assistenza'],
  },
  {
    id: 'lingua', category: 'Account e assistenza', title: 'Come leggo il sito in un’altra lingua?',
    summary: 'La lingua originale è l’italiano; la traduzione è affidata al browser.',
    keywords: 'lingua italiano portoghese inglese traduzione tradurre traduci browser safari chrome app installata',
    steps: ['Apri il menu dell’account dall’immagine in alto e vai a Impostazioni → Traduci questa pagina.', 'Segui le istruzioni mostrate per il tuo browser. Il comando di traduzione e le lingue disponibili dipendono dal dispositivo.', 'Se usi l’app installata e il comando non è disponibile, apri lo stesso indirizzo nel browser.'],
    note: 'Il nome TempleSale rimane il nome della piattaforma e non deve essere tradotto.', related: ['iniziare'], action: 'language',
  },
  {
    id: 'condizioni', category: 'Account e assistenza', title: 'Dove trovo le condizioni e la ricevuta di accettazione?',
    summary: 'Consulta i documenti dal menu delle impostazioni dell’account.',
    keywords: 'condizioni termini ricevuta accettazione consenso privacy dati regole email documento',
    steps: ['Apri il menu dall’immagine dell’account in alto, poi vai a Impostazioni.', 'Tocca Condizioni e ricevuta per leggere il documento e consultare la ricevuta disponibile per il tuo account.', 'Per dubbi sui dati personali o segnalazioni usa il contatto indicato nelle condizioni.'],
    related: ['chiudere-account', 'assistenza'], action: 'terms',
  },
  {
    id: 'chiudere-account', category: 'Account e assistenza', title: 'Come esco, disattivo o elimino l’account?',
    summary: 'Uscire, nascondere l’attività ed eliminare i dati sono azioni diverse.',
    keywords: 'account uscire logout esci disattivare disattiva eliminare elimina cancellare chiudere recuperare ripristinare',
    steps: ['Per uscire dall’accesso attuale usa Esci dall’account nel menu principale: non elimina il profilo.', 'Per disattivare o eliminare, vai a Impostazioni → Disattiva o elimina account.', 'Disattiva e conserva nasconde l’attività e mantiene i dati per il recupero tramite lo stesso account con email verificata.', 'Elimina definitivamente rimuove i dati dal database TempleSale. Leggi le informazioni, digita l’email richiesta e conferma solo se sei sicuro.'],
    note: 'L’eliminazione non è reversibile. Identità di accesso, file esterni e backup seguono le procedure indicate nelle condizioni: non confondere questa azione con una semplice uscita.', related: ['condizioni', 'assistenza'],
  },
  {
    id: 'assistenza', category: 'Account e assistenza', title: 'Come segnalo un problema o un contenuto?',
    summary: 'Usa il contatto nelle condizioni e fornisci gli elementi necessari a capire il problema.',
    keywords: 'aiuto assistenza supporto problema errore segnalare segnalazione contatto reclamo bug sicurezza contenuto',
    steps: ['Apri Impostazioni → Condizioni e ricevuta e usa il contatto indicato nel documento.', 'Spiega cosa volevi fare, quali passaggi hai seguito e quale messaggio è comparso. Indica il profilo o la pubblicazione interessata.', 'Se utile, aggiungi dispositivo, browser, orario e uno screenshot, oscurando i dati personali non necessari.'],
    note: 'Non inviare password, codici di verifica o altre credenziali.', related: ['caricamento', 'invio', 'condizioni'], action: 'terms',
  },
];

export const helpCategories = [...new Set(helpArticles.map(article => article.category))];
const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const stopWords = new Set('a ad al alla alle allo ai agli anche che chi ci come con cosa da dal dalla dei del della delle dello di e ed gli i il in io la le lo ma me mi mia mie miei mio nel nella nelle nello non o per posso possiamo quale quali quanto questa queste questi questo se si su sul sulla un una uno usare uso voglio vorrei fare faccio far'.split(' '));
// Small, explicit vocabulary for help intents, independent of the business search.
const concepts = [
  ['visibil', 'visualizz', 'raggiung', 'trovar', 'trovat', 'scopert', 'pubblicizz', 'promuov'],
  ['pubblic', 'post', 'caricar', 'upload', 'inviar', 'invio'],
  ['salvat', 'salvar', 'segnalibr', 'bookmark'], ['piace', 'like', 'curtid', 'curtir'],
  ['posizion', 'localizz', 'geolocalizz', 'gps'], ['ricerc', 'cercar', 'cerca'],
  ['fotocamer', 'camera'], ['bozz', 'rascunh'], ['elimin', 'cancell', 'rimuov'],
  ['modific', 'cambiar', 'corregg'], ['didascali', 'legenda', 'caption'],
  ['parole chiave', 'keyword', 'parolechiave'], ['lent', 'lento', 'lentissim'],
];
const stem = (word: string) => word.length > 4 ? word.replace(/[aeio]$/, '') : word;
const indexedArticles = helpArticles.map(article => ({
  article,
  title: normalize(article.title),
  summary: normalize(article.summary),
  keywords: normalize(article.keywords),
  body: normalize([...article.steps, article.note ?? ''].join(' ')),
}));
export function searchHelp(query: string) {
  const phrase = normalize(query.slice(0, 120));
  const terms = [...new Set(phrase.split(' ').filter(word => word.length > 1 && !stopWords.has(word)))].slice(0, 12);
  if (!terms.length) return [];
  return indexedArticles.map(({ article, title, summary, keywords, body }) => {
    let matched = 0;
    const score = terms.reduce((total, term) => {
      const group = concepts.find(words => words.some(word => term.startsWith(word)));
      const variants = group ?? [stem(term)];
      const matches = (text: string) => text.split(' ').some(word => variants.some(variant => word.startsWith(variant)));
      const value = (matches(title) ? 8 : 0) + (matches(keywords) ? 5 : 0) + (matches(summary) ? 3 : 0) + (matches(body) ? 1 : 0);
      if (value) matched += 1;
      return total + value;
    }, 0);
    return { article, matched, score: score + (title.includes(phrase) ? 16 : 0) };
  }).filter(result => result.matched >= Math.ceil(terms.length / 2))
    .sort((a, b) => b.matched - a.matched || b.score - a.score).map(result => result.article);
}
