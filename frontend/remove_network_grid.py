
lines_to_remove_start = 1221
lines_to_remove_end = 1279
file_path = r"c:\Users\ACER\OneDrive\Desktop\BPO\frontend\src\pages\Dashboard.jsx"

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Adjust to 0-index
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
