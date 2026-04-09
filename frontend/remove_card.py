
lines_to_remove_start = 1004
lines_to_remove_end = 1036
file_path = r"c:\Users\ACER\OneDrive\Desktop\BPO\frontend\src\pages\Dashboard.jsx"

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Adjust to 0-index
# Line 1004 is index 1003.
# Line 1036 is index 1035.
# We want to remove lines[1003] up to lines[1035] inclusive.

start_idx = lines_to_remove_start - 1
end_idx = lines_to_remove_end - 1

# Verify content before deleting (optional but good practice)
print(f"Deleting lines {lines_to_remove_start}-{lines_to_remove_end}")
print(f"Start content: {lines[start_idx].strip()}")
print(f"End content: {lines[end_idx].strip()}")

# Slice out the lines
new_lines = lines[:start_idx] + lines[end_idx+1:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Successfully removed lines.")
