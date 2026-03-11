import re

file_path = r"c:\Users\ACER\OneDrive\Desktop\BPO\backend\routes.py"
with open(file_path, "r", encoding="utf-8") as f:
    code = f.read()

# Replace condition `current_user.role == "agent"` with `current_user.role not in ["admin", "manager"]`
code = re.sub(r'current_user\.role\s*==\s*["\']agent["\']', 'current_user.role not in ["admin", "manager"]', code)

# Replace condition `current_user.role != "agent"` with `current_user.role in ["admin", "manager"]`
code = re.sub(r'current_user\.role\s*!=\s*["\']agent["\']', 'current_user.role in ["admin", "manager"]', code)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(code)

print("Roles fixed!")
