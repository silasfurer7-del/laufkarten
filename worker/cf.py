"""Findet mit dem Cloudflare-Token das Konto und die workers.dev-Adresse des Vermittlers.
Ausgabe für GitHub Actions: account=<id> und url=https://sport-garmin.<subdomain>.workers.dev.
Ohne Token (Secret CLOUDFLARE_API_TOKEN fehlt) kommt nichts zurück."""
import json, os, re, sys, urllib.error, urllib.request

API = 'https://api.cloudflare.com/client/v4'
NAME = 'sport-garmin'


def ruf(pfad, token, methode='GET', daten=None):
    req = urllib.request.Request(API + pfad, method=methode, data=json.dumps(daten).encode() if daten else None,
                                 headers={'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json'})
    try:
        return json.load(urllib.request.urlopen(req, timeout=30))
    except urllib.error.HTTPError as e:
        try:
            return json.load(e)
        except Exception:
            return {'success': False, 'errors': [{'message': f'HTTP {e.code}'}]}
    except Exception as e:
        return {'success': False, 'errors': [{'message': type(e).__name__}]}


def finde(token=None):
    token = (token or os.environ.get('CLOUDFLARE_API_TOKEN', '')).strip()
    if not token:
        return None, None
    konto = os.environ.get('CLOUDFLARE_ACCOUNT_ID', '').strip()
    if not konto:
        a = ruf('/accounts?per_page=5', token)
        if not a.get('result'):
            print('Cloudflare: kein Konto lesbar:', a.get('errors'), file=sys.stderr)
            return None, None
        konto = a['result'][0]['id']
    sub = (ruf(f'/accounts/{konto}/workers/subdomain', token).get('result') or {}).get('subdomain')
    if not sub:  # neues Konto: Adresse einmal anlegen
        wunsch = re.sub(r'[^a-z0-9-]', '-', os.environ.get('GITHUB_REPOSITORY_OWNER', 'sport').lower()).strip('-') + '-sport'
        r = ruf(f'/accounts/{konto}/workers/subdomain', token, 'PUT', {'subdomain': wunsch})
        sub = (r.get('result') or {}).get('subdomain') or (ruf(f'/accounts/{konto}/workers/subdomain', token).get('result') or {}).get('subdomain')
        if not sub:
            print('Cloudflare: keine workers.dev-Adresse:', r.get('errors'), file=sys.stderr)
            return konto, None
    return konto, f'https://{NAME}.{sub}.workers.dev'


if __name__ == '__main__':
    konto, url = finde()
    if konto:
        print('account=' + konto)
    if url:
        print('url=' + url)
