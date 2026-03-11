
import os

file_path = r"c:\Users\ACER\OneDrive\Desktop\BPO\frontend\src\pages\Dashboard.jsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Define the old block to identify where to replace
# We look for the "NEURAL NETWORK" header which I successfully renamed
marker = 'NEURAL NETWORK'
if marker not in content:
    print("Marker not found!")
    exit(1)

# We need to replace the logic inside the messages.length check
# The block starts around: {messages.length === 0 ? (
# And ends with: )}

start_marker = '{messages.length === 0 ? ('
end_marker = '                                                            )}'

start_idx = content.find(start_marker)
if start_idx == -1:
    print("Start marker not found")
    # Try searching for a substring if exact match fails
    start_marker = 'messages.length === 0 ?'
    start_idx = content.find(start_marker)
    if start_idx == -1:
        print("Start marker still not found")
        exit(1)
    # Adjust start_idx to include the brace? No, let's keep it safe.
    # Actually, we want to replace the WHOLE conditional block?
    # No, just the mapping part?
    # Let's replace the whole { ... } block if possible.
    # It opens at {messages.length ...
    
    # Let's use the layout structure to be safer.
    # The card has `className="... NEURAL NETWORK ..."`
    # We can perform a regex replacement if needed, but simple string replacement is better if we have exact content.
    
    pass

# Let's construct the NEW content for the whole conditional block
new_block = """{messages.length === 0 ? (
                                                                <div className="h-full flex flex-col items-center justify-center text-green-900/40 gap-2">
                                                                    <Activity className="w-6 h-6 animate-spin-slow opacity-20" />
                                                                    <span className="tracking-widest animate-pulse">AWAITING_NEURAL_INPUT...</span>
                                                                </div>
                                                            ) : (
                                                                (() => {
                                                                    const processedMessages = [];
                                                                    if (messages.length > 0) {
                                                                        const displayOrder = messages.slice().reverse();
                                                                        let currentGroup = null;

                                                                        displayOrder.forEach((msgObj) => {
                                                                            const text = typeof msgObj === 'string' ? msgObj : msgObj.message;
                                                                            let time = new Date();
                                                                            if (typeof msgObj !== 'string' && msgObj.created_at) {
                                                                                time = new Date(msgObj.created_at);
                                                                            }
                                                                            
                                                                            if (!currentGroup) {
                                                                                currentGroup = { text, count: 1, time };
                                                                            } else {
                                                                                if (currentGroup.text === text) {
                                                                                    currentGroup.count++;
                                                                                    currentGroup.time = time;
                                                                                } else {
                                                                                    processedMessages.push(currentGroup);
                                                                                    currentGroup = { text, count: 1, time };
                                                                                }
                                                                            }
                                                                        });
                                                                        if (currentGroup) processedMessages.push(currentGroup);
                                                                    }

                                                                    return processedMessages.map((msg, idx) => {
                                                                        let typeColor = "text-gray-400";
                                                                        let borderClass = "border-l-2 border-gray-800";
                                                                        let Icon = Activity;
                                                                        
                                                                        if (msg.text.toLowerCase().includes('task') || msg.text.toLowerCase().includes('assigned')) {
                                                                            typeColor = "text-cyan-400";
                                                                            borderClass = "border-l-2 border-cyan-500/50 bg-cyan-900/5";
                                                                            Icon = FileUp;
                                                                        } else if (msg.text.toLowerCase().includes('present') || msg.text.toLowerCase().includes('online')) {
                                                                            typeColor = "text-emerald-400";
                                                                            borderClass = "border-l-2 border-emerald-500/50 bg-emerald-900/5";
                                                                            Icon = CheckCircle;
                                                                        } else if (msg.text.toLowerCase().includes('absent') || msg.text.toLowerCase().includes('late')) {
                                                                            typeColor = "text-red-400";
                                                                            borderClass = "border-l-2 border-red-500/50 bg-red-900/5";
                                                                            Icon = AlertTriangle;
                                                                        } else if (msg.text.toLowerCase().includes('log')) {
                                                                            typeColor = "text-purple-400";
                                                                            borderClass = "border-l-2 border-purple-500/50 bg-purple-900/5";
                                                                        }

                                                                        return (
                                                                            <motion.div 
                                                                                key={idx}
                                                                                initial={{ opacity: 0, x: -10 }}
                                                                                animate={{ opacity: 1, x: 0 }}
                                                                                transition={{ delay: idx * 0.05 }}
                                                                                className={`flex items-center gap-3 p-1.5 rounded-r ${borderClass} hover:bg-white/5 transition-colors group/msg`}
                                                                            >
                                                                                <span className="opacity-30 text-[9px] w-[50px] whitespace-nowrap font-mono">
                                                                                    {msg.time.toLocaleTimeString([], { hour12: false })}
                                                                                </span>
                                                                                <div className={`flex items-center gap-2 ${typeColor} flex-grow`}>
                                                                                    <Icon className="w-3 h-3 opacity-70 group-hover/msg:opacity-100" />
                                                                                    <span className="break-all leading-tight">
                                                                                        {msg.text} 
                                                                                        {msg.count > 1 && (
                                                                                            <span className="ml-2 text-[9px] bg-white/10 px-1.5 rounded-full text-white/50">
                                                                                                x{msg.count}
                                                                                            </span>
                                                                                        )}
                                                                                    </span>
                                                                                </div>
                                                                            </motion.div>
                                                                        );
                                                                    })
                                                                })()
                                                            )}"""

# Find start and end indices of the OLD block
# The old block starts with {messages.length === 0 ?
# And ends with )} before the closing div which is <div className="absolute inset-x-0

# Let's find the closing div tag location
footer_marker = '<div className="absolute inset-x-0 bottom-0 h-8'
footer_idx = content.find(footer_marker)
if footer_idx == -1:
    print("Footer marker not found")
    exit(1)

# Now iterate backwards from footer_idx to find last )}
# Actually, the block we want to replace is seemingly everything inside the `overflow-y-auto` div?
# <div className="absolute inset-0 overflow-y-auto custom-scrollbar p-3 space-y-1">
container_marker = '<div className="absolute inset-0 overflow-y-auto custom-scrollbar p-3 space-y-1">'
container_idx = content.find(container_marker)
if container_idx == -1:
    print("Container marker not found")
    exit(1)

container_content_start = container_idx + len(container_marker)
container_content_end = footer_idx # Roughly where the next sibling starts relative to parent?
# Wait, footer is SIBLING of container?
# No, footer is sibling of the `overflow-y-auto` div?
# Let's check the code:
# <div className="flex-grow p-0 ... relative">
#    <div className="absolute inset-0 ..."> ... </div>
#    <div className="absolute inset-x-0 ..."> ... </div>
# </div>
# So yes, footer is next sibling.
# But we need to find the CLOSING </div> of the `overflow-y-auto` div.
# Searching for `</div>` before `footer_marker`.

closing_div_idx = content.rfind('</div>', 0, footer_idx)
# This closing div matches the `overflow-y-auto` div.
# So we want to replace everything BETWEEN `container_content_start` and `closing_div_idx`.

old_content = content[container_content_start:closing_div_idx]
# But we need to preserve whitespace?
# We can just inject the new block.

new_content = content[:container_content_start] + "\n" + new_block + "\n" + content[closing_div_idx:]

with open(file_path, "w", encoding="utf-8") as f:
    f.write(new_content)

print("Successfully patched Dashboard.jsx")
