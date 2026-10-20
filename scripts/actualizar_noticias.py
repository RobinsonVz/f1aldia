"""Actualiza exclusivamente las cuatro tarjetas de noticias del último GP.
Sin dependencias externas; conserva HTML anterior si la selección es insuficiente.
"""
import argparse
import datetime as dt
from html.parser import HTMLParser
from gnews_decoder import decode_many
import email.utils
import html
import json
import hashlib
import os
import unicodedata
import re
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
CALENDAR = [
 ('2026-03-08','Australia','Melbourne'),('2026-03-15','China','Shanghái'),
 ('2026-03-29','Japón','Suzuka'),('2026-05-03','Miami','Miami'),
 ('2026-05-24','Canadá','Montreal'),('2026-06-07','Mónaco','Montecarlo'),
 ('2026-06-14','Barcelona-Catalunya','Barcelona'),('2026-06-28','Austria','Spielberg'),
 ('2026-07-05','Gran Bretaña','Silverstone'),('2026-07-19','Bélgica','Spa'),
 ('2026-07-26','Hungría','Budapest'),('2026-08-23','Países Bajos','Zandvoort'),
 ('2026-09-06','Italia','Monza'),('2026-09-13','España','Madrid'),
 ('2026-09-27','Azerbaiyán','Bakú'),('2026-10-11','Singapur','Singapur'),
 ('2026-10-25','Estados Unidos','Austin'),('2026-11-01','México','México'),
 ('2026-11-08','Brasil','Interlagos'),('2026-11-21','Las Vegas','Las Vegas'),
 ('2026-11-29','Catar','Lusail'),('2026-12-06','Abu Dabi','Yas Marina')]
HEADERS = {'User-Agent':'Mozilla/5.0 (compatible; F1AlDiaNews/1.0)'}

def get(url, limit=1_500_000):
    req=urllib.request.Request(url,headers=HEADERS)
    with urllib.request.urlopen(req,timeout=18) as r:
        return r.read(limit)

def clean(s):
    return re.sub(r'\s+',' ',html.unescape(re.sub(r'<[^>]*>',' ',s or ''))).strip()

def feed(query):
    url='https://news.google.com/rss/search?'+urllib.parse.urlencode({'q':query,'hl':'es-419','gl':'MX','ceid':'MX:es-419'})
    root=ET.fromstring(get(url))
    out=[]
    for item in root.findall('./channel/item'):
        title=clean(item.findtext('title'))
        source=clean(item.findtext('source'))
        date=email.utils.parsedate_to_datetime(item.findtext('pubDate'))
        link=item.findtext('link') or ''
        if title and link:
            out.append(dict(title=title,source=source,date=date,link=link))
    return out

class ArticleMetadata(HTMLParser):
    def __init__(self):
        super().__init__()
        self.meta = {}
    def handle_starttag(self, tag, attrs):
        if tag.lower() != 'meta':
            return
        d = dict(attrs)
        key = (d.get('property') or d.get('name') or '').lower()
        if key and d.get('content'):
            self.meta.setdefault(key, clean(d['content']))

def spanish_summary(value):
    """Conservative Spanish check: do not publish English metadata as Spanish."""
    value=clean(value)
    if not 75 <= len(value) <= 480:
        return None
    tokens=re.findall(r"[a-záéíóúñü]+", value.casefold())
    spanish={'el','la','los','las','de','del','en','que','con','para','por','una','un','tras','fue','carrera','piloto','equipo','gran','premio','victoria','segundo','tercero','desde','hasta','sobre','su','sus','se','al'}
    english={'the','and','with','from','after','race','driver','team','won','finished','his','their','was','were','which','that'}
    es=sum(t in spanish for t in tokens)
    en=sum(t in english for t in tokens)
    if es < 5 or en >= es:
        return None
    return value

def image_is_relevant(image_url, image_alt, headline):
    """Reject obvious site logos and explicitly unrelated image descriptions."""
    path=urllib.parse.urlparse(image_url).path.casefold()
    if re.search(r'(?:^|[/_.-])(logo|avatar|placeholder|default-image|favicon|sprite)(?:[/_.-]|$)',path):
        return False
    if not image_alt:
        return True  # Article og:image is the publisher's primary article image.
    stop={'the','and','from','with','para','sobre','tras','gran','premio','formula','fórmula','singapur','singapore','carrera','race','f1','2026','del','las','los','una','uno','que','por','con','este','esta'}
    def words(s):
        return {x for x in re.findall(r'[a-záéíóúñ]{3,}',s.casefold()) if x not in stop}
    title_words=words(headline)
    alt_words=words(image_alt)
    # Explicit captions for a different driver/team must not be accepted.
    return not (len(title_words)>=2 and len(alt_words)>=2 and not title_words.intersection(alt_words))

def article_details(url, headline=''):

    """Read real publisher metadata. Do not synthesize a summary."""
    try:
        parsed=urllib.parse.urlparse(url)
        if parsed.scheme != 'https' or not parsed.netloc or parsed.netloc.endswith('google.com'):
            return None
        raw=get(url,750_000).decode('utf-8','ignore')
        parser=ArticleMetadata();parser.feed(raw)
        m=parser.meta
        image=m.get('og:image:secure_url') or m.get('og:image') or m.get('twitter:image')
        summary=spanish_summary(m.get('og:description') or m.get('twitter:description') or m.get('description') or '')
        if image: image=urllib.parse.urljoin(url,image)
        alt=m.get('og:image:alt') or m.get('twitter:image:alt') or ''
        if not image or not image.startswith('https://') or not summary or not image_is_relevant(image,alt,headline):
            return None
        return {'image':image,'summary':summary,'url':url}
    except Exception:
        return None

def fetch_image(url):
    """Validate a real image response; never accept HTML or a tiny tracking pixel."""
    parsed=urllib.parse.urlparse(url)
    if parsed.scheme != 'https' or not parsed.hostname:
        return None
    try:
        req=urllib.request.Request(url,headers={**HEADERS,'Accept':'image/avif,image/webp,image/jpeg,image/png'})
        with urllib.request.urlopen(req,timeout=18) as response:
            final=urllib.parse.urlparse(response.geturl())
            if final.scheme != 'https': return None
            content_type=response.headers.get('Content-Type','').split(';')[0].lower()
            ext={'image/jpeg':'.jpg','image/png':'.png','image/webp':'.webp'}.get(content_type)
            if not ext: return None
            data=response.read(4_000_001)
            if not 10_000 <= len(data) <= 4_000_000: return None
            signatures={'.jpg':data.startswith(b'\xff\xd8\xff'),'.png':data.startswith(b'\x89PNG\r\n\x1a\n'),'.webp':data.startswith(b'RIFF') and data[8:12]==b'WEBP'}
            if not signatures[ext]: return None
            return data,ext
    except Exception:
        return None

def prepare_images(chosen):
    """Download all four before changing any live HTML or asset files."""
    prepared=[]
    for a in chosen:
        result=fetch_image(a['image'])
        if not result: return None
        data,ext=result
        name=hashlib.sha256(data).hexdigest()[:20]+ext
        prepared.append((name,data))
    return prepared

def main():
    parser = argparse.ArgumentParser(description='Actualizar noticias F1')
    parser.add_argument('--gp-date', help='Fecha del GP a probar, YYYY-MM-DD (ej. 2026-10-11)')
    args = parser.parse_args()
    now=dt.datetime.now(ZoneInfo('America/Lima'))
    if args.gp_date:
        try:
            target=dt.date.fromisoformat(args.gp_date)
        except ValueError:
            parser.error('--gp-date debe tener formato YYYY-MM-DD')
        matches=[(dt.date.fromisoformat(d),n,p) for d,n,p in CALENDAR if d == args.gp_date]
        if not matches:
            parser.error('El GP solicitado no existe en el calendario configurado')
        if target > now.date():
            parser.error('No se puede probar un GP futuro')
        day,name,place=matches[0]
        # Ventana histórica limitada al GP y los 7 días siguientes.
        end_date=min(day + dt.timedelta(days=7),now.date())
        print(f'MODO PRUEBA: GP de {name} ({day}); noticias hasta {end_date}. Sin publicar en GitHub.')
    else:
        races=[(dt.date.fromisoformat(d),n,p) for d,n,p in CALENDAR if dt.date.fromisoformat(d) < now.date()]
        if now.weekday()!=0 or not races or (now.date()-races[-1][0]).days not in (1,2,3):
            print('No es lunes posterior a un GP; sin cambios.');return
        day,name,place=races[-1]
        end_date=now.date()
    queries=[f'"Gran Premio de {name}" Fórmula 1 carrera after:{day.isoformat()}',
             f'F1 {place} carrera resultados sanción after:{day.isoformat()}']
    candidates=[];seen=set()
    for q in queries:
        for a in feed(q):
            if not day <= a['date'].date() <= end_date:continue
            title=a['title'].split(' - ')[0].strip()
            norm=re.sub(r'\W+','',title.casefold())
            if norm in seen or len(title)<35:continue
            seen.add(norm)
            a['title']=title
            candidates.append(a)
    print(f"Candidatos RSS encontrados: {len(candidates)}")
    # Decode RSS wrappers before fetching publisher pages.
    urls=[a['link'] for a in candidates[:40]]
    resolved=decode_many(urls,timeout=18)
    articles=[]
    for a in candidates[:40]:
        target=resolved.get(a['link'])
        if not target:continue
        details=article_details(target,a['title'])
        if not details:continue
        a.update(details)
        articles.append(a)
    print(f"Artículos con metadatos de imagen y resumen en español: {len(articles)}")
    # Selección heurística, no verificación editorial de relevancia.
    words=('ganó','gana','victoria','resultado','podio','sanción','penalización','accidente','abandono','campeonato','investigación')
    articles.sort(key=lambda a:(sum(w in a['title'].lower() for w in words),a['date']),reverse=True)
    if len(articles)<4:
        print(f'Solo {len(articles)} noticias con imagen verificable: se conservan tarjetas existentes.');return
    # Four complete images are required; try alternate articles when downloads fail.
    chosen=[]; prepared=[]; seen_image_hashes=set()
    for a in articles:
        result=fetch_image(a['image'])
        if not result: continue
        data,ext=result
        name=hashlib.sha256(data).hexdigest()[:20]+ext
        if name in seen_image_hashes: continue
        seen_image_hashes.add(name)
        a['local_image']='imagenes/noticias/'+name
        chosen.append(a)
        prepared.append((name,data))
        if len(chosen)==4: break
    print(f"Fotografías distintas descargadas: {len(chosen)}")
    if len(chosen)!=4:
        print(f'Solo {len(chosen)} noticias con imágenes descargables; se conservan tarjetas anteriores.')
        return
    cards=[]
    for a in chosen:
        title=html.escape(a['title']);link=html.escape(a['url'],quote=True)
        image=html.escape(a['local_image'],quote=True)
        date=a['date'].astimezone(ZoneInfo('America/Lima')).strftime('%d/%m/%Y')
        # Use publisher-provided description; no generated or invented claims.
        excerpt=html.escape(a['summary'])
        cards.append(f'''      <article class="news-card">
        <span class="news-card__tag news-card__tag--carrera">Actualidad</span>
        <img src="{image}" alt="Noticia del GP de {html.escape(name)}" class="news-card__img" loading="lazy">
        <div class="news-card__body">
          <p class="news-card__meta">GP de {html.escape(name)} · {date}</p>
          <h3 class="news-card__title">{title}</h3>
          <p class="news-card__excerpt">{excerpt} <a href="{link}" target="_blank" rel="noopener noreferrer">Leer noticia completa ↗</a></p>
        </div>
      </article>''')
    path=ROOT/'index.html';original=path.read_text(encoding='utf-8')
    pattern=r'(<div class="news-grid">).*?(\n    </div>\n  </section>\n\n  <!-- ===== CALENDARIO)'
    replacement=lambda m:m.group(1)+'\n\n'+'\n\n'.join(cards)+m.group(2)
    updated,count=re.subn(pattern,replacement,original,count=1,flags=re.S)
    if count!=1:raise RuntimeError('No se encontró la sección exacta de noticias; no se modificó el HTML.')
    asset_dir=ROOT/'imagenes'/'noticias'
    asset_dir.mkdir(parents=True,exist_ok=True)
    for image_name,data in prepared:
        target=asset_dir/image_name
        if not target.exists():
            tmp=target.with_suffix(target.suffix+'.tmp')
            tmp.write_bytes(data)
            os.replace(tmp,target)
    path.write_text(updated,encoding='utf-8')
    print(f'Actualizadas cuatro tarjetas para GP de {name} ({day}).')

if __name__=='__main__':main()
