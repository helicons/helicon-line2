import sys

with open('./src/GlobalAudio.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Minimized pill
content = content.replace(
    'className="fixed bottom-8 right-8 z-[9999] flex items-center gap-3 px-5 py-3 rounded-full"',
    'className="fixed top-24 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-5 py-3 rounded-full"'
)

# Minimized chevron
content = content.replace(
    '<ChevronUp className="w-3 h-3 text-gray-400" />',
    '<ChevronDown className="w-3 h-3 text-gray-400" />'
)

# Expanded iPod container
content = content.replace(
    '<div className="fixed bottom-6 right-6 z-[9999]" style={{ width: 260, filter: \'drop-shadow(0 20px 50px rgba(0,0,0,0.7))\'' + ' }}>',
    '<div className="fixed top-24 left-1/2 -translate-x-1/2 z-[9999]" style={{ width: 260, filter: \'drop-shadow(0 20px 50px rgba(0,0,0,0.7))\'' + ' }}>'
)

# Expanded chevron
content = content.replace(
    '<ChevronDown className="w-3 h-3" />',
    '<ChevronUp className="w-3 h-3" />'
)

with open('./src/GlobalAudio.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("GlobalAudio patched!")
