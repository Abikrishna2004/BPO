import re
import os

file_path = r'c:\Users\ACER\OneDrive\Desktop\BPO\backend\routes.py'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern to find conflict blocks
# \s* is to handle potential whitespaces around markers
pattern = re.compile(r'', re.DOTALL)
content = re.sub(pattern, '', content)

# Remove the closing markers
content = re.sub(r'>>>>>>> [a-f0-9]+', '', content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Conflict markers resolved in routes.py")
