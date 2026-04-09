
import os

file_path = r"c:\Users\ACER\OneDrive\Desktop\BPO\frontend\src\pages\Dashboard.jsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Define the start and end markers
# Start: {/* 5. Neural Network Logs */}
# End is the closing </motion.div> for that card.
# The card has `className="... NEURAL NETWORK ..."` (wait, class doesn't have text, header does)
# The header has `NEURAL NETWORK` (which I renamed)

start_marker = '{/* 5. Neural Network Logs */}'
header_marker = 'NEURAL NETWORK'

start_idx = content.find(start_marker)
if start_idx == -1:
    print("Start marker not found!")
    exit(1)

# Verify header exists after start to be sure
if content.find(header_marker, start_idx) == -1:
    print("Header marker not found after start marker!")
    exit(1)

# Find the matching closing tag.
# Since it's nested, simple search for </motion.div> might encounter internal ones (row items).
# But this is the LAST item in the grid?
# Let's count braces or indentations? No.
# The `view_file` showed it ends at line 1258.
# The NEXT line (1260) is `</motion.div >` (closing the container?).
# Let's look for the specific footer div to anchor.
# <div className="absolute inset-x-0 bottom-0 h-8 ... pointer-events-none" />
# Then 2 closing divs </div ></div>
# Then closing </motion.div>

footer_marker = '<div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#030303] to-transparent pointer-events-none" />'
footer_idx = content.find(footer_marker, start_idx)

if footer_idx == -1:
    print("Footer marker not found!")
    exit(1)

# After footer, we expect:
# </div> (closing main content area)
# </div> (closing card internal div?)
# </motion.div> (closing card)

# Let's verify the content after footer_idx
# We can search for the next `</motion.div>` after footer_idx?
# The footer is inside `div class="flex-grow..."`, which is inside `div class="flex-grow relative z-10..."`, which is inside `motion.div`.
# So we need to pass 2 `</div>` then `</motion.div>`.

end_block_idx = footer_idx
found_divs = 0
found_motion = 0
current_idx = footer_idx

while True:
    close_div = content.find('</div>', current_idx)
    close_motion = content.find('</motion.div>', current_idx)
    
    if close_div == -1 and close_motion == -1:
        print("Could not find closing tags")
        exit(1)
        
    # Check which comes first
    if close_div != -1 and (close_motion == -1 or close_div < close_motion):
        found_divs += 1
        current_idx = close_div + 6
        # We need to close 2 divs?
        # Let's checking indents from view_file:
        # 1256: </div>
        # 1257: </div>
        # 1258: </motion.div>
    else:
        # Found motion div
        end_idx = close_motion + 13 # len('</motion.div>')
        print(f"Found closing motion div at {close_motion}")
        break

# So we remove from start_idx to end_idx
new_content = content[:start_idx] + content[end_idx:]

with open(file_path, "w", encoding="utf-8") as f:
    f.write(new_content)

print("Successfully removed Neural Network section")
