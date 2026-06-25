
import re

file_path = '/home/rachael/pinc-network/src/i18n/index.ts'

with open(file_path, 'r') as f:
    lines = f.readlines()

new_lines = []
seen_keys_in_section = set()

for line in lines:
    match = re.search(r"'([^']+)':", line)
    if match:
        key = match.group(1)
        # Reset seen keys when entering a new language section
        if line.strip().endswith('{') and any(lang + ':' in line for lang in ['en', 'es', 'fr', 'de', 'ja', 'ko', 'zh', 'pt', 'ru', 'ar', 'hi', 'sw']):
            seen_keys_in_section = set()
        
        if key in seen_keys_in_section:
            print(f"Removing duplicate key: {key}")
            continue
        seen_keys_in_section.add(key)
    
    new_lines.append(line)

with open(file_path, 'w') as f:
    f.writelines(new_lines)
