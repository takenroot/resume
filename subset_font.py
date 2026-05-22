import json, base64, tempfile, os, sys

# 1. Extract all chars from resume data + pdfmake-export.js (hardcoded strings)
data = json.load(open('/home/saltedfish/project/cv/example/resume-data.json'))
text = json.dumps(data, ensure_ascii=False)
js_code = open('/home/saltedfish/project/cv/site/pdfmake-export.js').read()
text += js_code
chars = sorted(set(c for c in text))
print(f'Unique chars to subset: {len(chars)}')
with open('/tmp/resume_chars.txt', 'w') as f:
    f.write(''.join(chars) + '\n')

# 2. Extract TTF from TTC (first font = SC)
# Using fontTools to subset
try:
    from fontTools.ttLib import TTCollection, TTFont
    from fontTools.subset import Subsetter
except ImportError:
    print('Need fonttools: pip install fonttools')
    sys.exit(1)

ttc_path = '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'
print(f'Reading TTC: {ttc_path}')
ttc = TTCollection(ttc_path)
font = ttc.fonts[0]  # index 0 = SC

# Subset
subsetter = Subsetter()
subsetter.populate(text=''.join(chars))
subsetter.subset(font)

# Save subset TTF
out_path = '/home/saltedfish/project/cv/site/NotoSansSC-Regular.subset.ttf'
font.save(out_path)
print(f'Subset font saved: {os.path.getsize(out_path)} bytes')

# Also bold
ttc_bold = TTCollection('/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc')
bold = ttc_bold.fonts[0]
subsetter.subset(bold)
bold_path = '/home/saltedfish/project/cv/site/NotoSansSC-Bold.subset.ttf'
bold.save(bold_path)
print(f'Bold subset: {os.path.getsize(bold_path)} bytes')
