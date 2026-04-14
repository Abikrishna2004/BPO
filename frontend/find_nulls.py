import os

frontend_dir = r'c:\Users\ACER\OneDrive\Desktop\BPO\frontend'
for root, dirs, files in os.walk(frontend_dir):
    if 'node_modules' in dirs:
        dirs.remove('node_modules')
    if '.git' in dirs:
        dirs.remove('.git')
    for file in files:
        path = os.path.join(root, file)
        try:
            with open(path, 'rb') as f:
                content = f.read()
                if b'\x00' in content:
                    print(f"NULL BYTE FOUND: {path}")
        except:
            pass
