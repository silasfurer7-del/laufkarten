"""Trainingsplan für die Web-App: liest den Kalender (geheime iCal-Adresse im Secret KALENDER_ICS)
und schreibt nur die Trainings-Termine nach plan.json. Ohne Secret gilt web/plan-start.json."""
import datetime as dt, json, os, re, urllib.request
from zoneinfo import ZoneInfo

TRAINING = re.compile(r'lauf|interval|\brun\b|jog|push|pull|beine|\bleg|gym|kraft|oberk|unterk|ganzk', re.I)


def aus_kalender(url, tz, von, bis):
    import icalendar, recurring_ical_events
    roh = urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'laufkarten'}), timeout=30).read()
    kal = icalendar.Calendar.from_ical(roh)
    aus = []
    for e in recurring_ical_events.of(kal).between(von, bis):
        start = e.get('DTSTART').dt
        titel = str(e.get('SUMMARY') or '')
        if not isinstance(start, dt.datetime) or not TRAINING.search(titel):
            continue  # ganztägige und private Termine bleiben draussen
        start = (start if start.tzinfo else start.replace(tzinfo=tz)).astimezone(tz)
        text = re.sub(r'<[^>]+>', ' ', str(e.get('DESCRIPTION') or '')).strip()
        aus.append({'id': f"{e.get('UID')}_{start:%Y%m%dT%H%M}", 'summary': titel, 'description': text,
                    'start': {'dateTime': start.isoformat(timespec='seconds')}})
    return sorted(aus, key=lambda x: x['start']['dateTime'])


def schreibe(ziel, web, zeitzone='Europe/Zurich'):
    tz = ZoneInfo(zeitzone)
    jetzt = dt.datetime.now(tz)
    montag = (jetzt - dt.timedelta(days=jetzt.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
    url = os.environ.get('KALENDER_ICS', '').strip()
    quelle, events = 'startplan', json.load(open(os.path.join(web, 'plan-start.json'), encoding='utf-8'))['events']
    if url:
        try:
            events, quelle = aus_kalender(url, tz, montag - dt.timedelta(days=7), montag + dt.timedelta(days=42)), 'kalender'
        except Exception as fehler:  # Adresse nie ausgeben
            print('Kalender nicht lesbar, Startplan bleibt:', type(fehler).__name__)
    json.dump({'stand': jetzt.isoformat(timespec='seconds'), 'quelle': quelle, 'events': events},
              open(ziel, 'w', encoding='utf-8'), ensure_ascii=False)
    print('Plan:', quelle, len(events), 'Termine')
