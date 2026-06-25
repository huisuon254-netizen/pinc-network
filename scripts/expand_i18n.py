import os
import json
import re
import urllib.request
import urllib.parse
from pathlib import Path

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")

FILE_PATH = '/home/rachael/pinc-network/src/i18n/index.ts'

def translate_batch(texts, target_lang):
    if not GROQ_API_KEY:
        print("Error: GROQ_API_KEY not set")
        return {k: f"[{target_lang}] {v}" for k, v in texts.items()}
        
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    
    prompt = f"Translate the following JSON string values into {target_lang}. Return ONLY valid JSON with the exact same keys. Do not add any markdown formatting or explanations.\n\n"
    prompt += json.dumps(texts, indent=2)
    
    data = {
        "model": "llama-3.1-8b-instant",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.1,
        "response_format": {"type": "json_object"}
    }
    
    req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers=headers, method='POST')
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            return json.loads(result['choices'][0]['message']['content'])
    except Exception as e:
        print(f"Translation error: {e}")
        return {k: f"[{target_lang}] {v}" for k, v in texts.items()}

def run():
    print("Fetching translations via Groq API...")
    with open(FILE_PATH, 'r') as f:
        content = f.read()

    match = re.search(r'en: \{(.*?)\},', content, re.DOTALL)
    if not match:
        print("Could not find English translations")
        exit(1)

    en_block = match.group(1)
    en_dict = {}
    for line in en_block.split('\n'):
        if ':' in line:
            parts = line.split(':', 1)
            key = parts[0].strip().strip("'")
            val = parts[1].strip().strip(",").strip("'")
            if key and val:
                en_dict[key] = val

    # Translate missing languages
    target_langs = ['fr', 'es', 'de', 'zh', 'ja', 'ru']
    
    # Save a locales.json file
    locales = {"en": en_dict}
    for lang in target_langs:
        print(f"Translating {lang}...")
        locales[lang] = translate_batch(en_dict, lang)
        
    with open('/home/rachael/pinc-network/src/i18n/locales.json', 'w') as f:
        json.dump(locales, f, indent=2, ensure_ascii=False)
        
    print("Created locales.json successfully.")

if __name__ == "__main__":
    run()
