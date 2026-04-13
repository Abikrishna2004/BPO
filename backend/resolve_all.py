import re
import os

backend_dir = r'c:\Users\ACER\OneDrive\Desktop\BPO\backend'

for filename in os.listdir(backend_dir):
    if filename.endswith('.py'):
        file_path = os.path.join(backend_dir, filename)
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        if '', re.DOTALL)
            content = re.sub(pattern, '', content)
            content = re.sub(r'>>>>>>> [a-f0-9]+', '', content)

            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)

print("Conflict resolution complete.")
