#!/usr/bin/env python3
"""Complete all 52 language translations for PINC i18n."""
import re, os, sys

FILE_PATH = '/home/rachael/pinc-network/src/i18n/index.ts'

ALL_LANGS = ['en','es','fr','de','ja','ko','zh','pt','ru','ar','hi','sw',
    'it','nl','tr','vi','th','id','pl','uk','fa','el','he','sv','da','fi','no',
    'ro','hu','cs','bn','pa','ta','te','mr','ur','gu','ml','kn','ms','fil',
    'am','zu','af','sq','hy','az','eu','be','bs','ca','hr']

LANG_LABELS = {
    'en':('English','English'),'es':('Spanish','Español'),'fr':('French','Français'),
    'de':('German','Deutsch'),'ja':('Japanese','日本語'),'ko':('Korean','한국어'),
    'zh':('Chinese','中文'),'pt':('Portuguese','Português'),'ru':('Russian','Русский'),
    'ar':('Arabic','العربية'),'hi':('Hindi','हिन्दी'),'sw':('Swahili','Kiswahili'),
    'it':('Italian','Italiano'),'nl':('Dutch','Nederlands'),'tr':('Turkish','Türkçe'),
    'vi':('Vietnamese','Tiếng Việt'),'th':('Thai','ไทย'),'id':('Indonesian','Bahasa Indonesia'),
    'pl':('Polish','Polski'),'uk':('Ukrainian','Українська'),'fa':('Persian','فارسی'),
    'el':('Greek','Ελληνικά'),'he':('Hebrew','עברית'),'sv':('Swedish','Svenska'),
    'da':('Danish','Dansk'),'fi':('Finnish','Suomi'),'no':('Norwegian','Norsk'),
    'ro':('Romanian','Română'),'hu':('Hungarian','Magyar'),'cs':('Czech','Čeština'),
    'bn':('Bengali','বাংলা'),'pa':('Punjabi','ਪੰਜਾਬੀ'),'ta':('Tamil','தமிழ்'),
    'te':('Telugu','తెలుగు'),'mr':('Marathi','मराठी'),'ur':('Urdu','اردو'),
    'gu':('Gujarati','ગુજરાતી'),'ml':('Malayalam','മലയാളം'),'kn':('Kannada','ಕನ್ನಡ'),
    'ms':('Malay','Bahasa Melayu'),'fil':('Filipino','Filipino'),
    'am':('Amharic','አማርኛ'),'zu':('Zulu','isiZulu'),'af':('Afrikaans','Afrikaans'),
    'sq':('Albanian','Shqip'),'hy':('Armenian','Հայերեն'),'az':('Azerbaijani','Azərbaycanca'),
    'eu':('Basque','Euskara'),'be':('Belarusian','Беларуская'),'bs':('Bosnian','Bosanski'),
    'ca':('Catalan','Català'),'hr':('Croatian','Hrvatski'),
}

def parse_translations(content):
    """Parse all existing language translations from the TypeScript file."""
    result = {}
    lang_positions = []
    for m in re.finditer(r'^  ([a-z]{2}): \{', content, re.MULTILINE):
        lang_positions.append((m.group(1), m.start()))
    
    for idx, (lang, pos) in enumerate(lang_positions):
        # Find the section between this lang header and the next
        section_start = content.find('{', pos)
        depth = 1
        p = section_start + 1
        while depth > 0 and p < len(content):
            if content[p] == '{': depth += 1
            elif content[p] == '}': depth -= 1
            p += 1
        section = content[section_start:p-1]
        keys = {}
        for km in re.finditer(r"^\s+'([^']+)':\s*'((?:[^'\\]|\\.)*)'\s*,?\s*$", section, re.MULTILINE):
            keys[km.group(1)] = km.group(2)
        result[lang] = keys
    return result

def parse_all_keys(content):
    """Parse English keys in order."""
    lang_positions = []
    for m in re.finditer(r'^  ([a-z]{2}): \{', content, re.MULTILINE):
        lang_positions.append((m.group(1), m.start()))
    
    en_idx = next(i for i, (l, _) in enumerate(lang_positions) if l == 'en')
    next_pos = lang_positions[en_idx+1][1] if en_idx+1 < len(lang_positions) else content.find('\n};', lang_positions[en_idx][1])
    section = content[lang_positions[en_idx][1]:next_pos]
    
    keys = []
    for km in re.finditer(r"^\s+'([^']+)'", section, re.MULTILINE):
        keys.append(km.group(1))
    return keys

