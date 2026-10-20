"""Pruebas locales sin acceso a internet ni modificaciones de index.html."""
import importlib.util
import sys
import types
import unittest
from unittest.mock import patch
from pathlib import Path

# El decodificador externo se sustituye solamente durante estas pruebas.
sys.modules.setdefault('gnews_decoder', types.SimpleNamespace(decode_many=lambda urls, timeout=18: {}))
SCRIPT = Path(__file__).resolve().parents[1] / 'scripts' / 'actualizar_noticias.py'
spec = importlib.util.spec_from_file_location('actualizar_noticias', SCRIPT)
news = importlib.util.module_from_spec(spec)
spec.loader.exec_module(news)

class NoticiasTests(unittest.TestCase):
    def test_extrae_metadatos_reales(self):
        page = b'''<html><head><meta property="og:image" content="https://example.org/foto.jpg"><meta property="og:description" content="La carrera termin\xc3\xb3 con una intensa batalla entre los pilotos que disputaron el podio hasta la \xc3\xbaltima vuelta."></head></html>'''
        with patch.object(news, 'get', return_value=page):
            result = news.article_details('https://example.org/noticia')
        self.assertEqual(result['image'], 'https://example.org/foto.jpg')
        self.assertIn('intensa batalla', result['summary'])
    def test_rechaza_articulo_sin_imagen(self):
        with patch.object(news, 'get', return_value=b'<meta name="description" content="Texto largo que describe una carrera con suficiente detalle y mas de sesenta y cinco caracteres.">'):
            self.assertIsNone(news.article_details('https://example.org/noticia'))
    def test_rechaza_url_no_segura(self):
        self.assertIsNone(news.article_details('http://example.org/noticia'))
    def test_rechaza_resumen_demasiado_corto(self):
        with patch.object(news, 'get', return_value=b'<meta property="og:image" content="https://example.org/i.jpg"><meta property="og:description" content="Muy corto">'):
            self.assertIsNone(news.article_details('https://example.org/noticia'))
    def test_rechaza_logo_generico(self):
        self.assertFalse(news.image_is_relevant('https://medio.com/assets/logo.png','','Verstappen gana Singapur'))
    def test_rechaza_foto_con_descripcion_ajena(self):
        self.assertFalse(news.image_is_relevant('https://medio.com/foto.jpg','Fernando Alonso en Mónaco','Max Verstappen consigue victoria'))
    def test_acepta_foto_relacionada(self):
        self.assertTrue(news.image_is_relevant('https://medio.com/foto.jpg','Max Verstappen en Singapur','Verstappen logra victoria de Singapur'))
    def test_estructura_html_conservada(self):
        html = (SCRIPT.parents[1] / 'index.html').read_text(encoding='utf-8')
        self.assertIn('<div class="news-grid">', html)
        self.assertEqual(html.count('<article class="news-card">'), 4)

if __name__ == '__main__':
    unittest.main()
