import re
import sys

def replace_colors(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Define color mappings based on the implementation plan
    color_map = {
        # Backgrounds
        r'(?i)#f4f6fb': '#001D39',
        r'(?i)#ffffff(?!,)': '#0A4174', # Target backgrounds/cards mostly, avoiding rgba(255,255,255,x)
        r'"#ffffff"': '"#0A4174"',
        
        # Text mapping is tricky since white text is #ffffff. 
        # But we want to change old dark text to white, and old gray text to slate.
        # Primary Text
        r'(?i)#1f2c3d': '#ffffff',
        r'(?i)#1e2a3a': '#ffffff',
        r'(?i)#2b3a4d': '#ffffff',

        # Secondary Text / Icons
        r'(?i)#5e6a7a': '#94a3b8',
        r'(?i)#5f6b7d': '#94a3b8',
        r'(?i)#6a7688': '#94a3b8',
        r'(?i)#7b8798': '#94a3b8',
        r'(?i)#4a5b6f': '#94a3b8',
        r'(?i)#a0a9b8': '#94a3b8',
        r'(?i)#3b4657': '#94a3b8',
        r'(?i)#5c6a7e': '#94a3b8',
        r'(?i)#3a4b64': '#94a3b8',
        r'(?i)rgba\(0,\s*0,\s*0,\s*0\.1[0-9]*\)': 'rgba(123, 189, 232, 0.15)',

        # Accents & Links
        r'(?i)#1d6ee5': '#74C5E6',
        r'(?i)#2a6ae3': '#74C5E6',
        r'(?i)#3a7bd5': '#74C5E6',
        r'(?i)#4379ff': '#74C5E6',

        # Borders & Dividers
        r'(?i)#d7deeb': '#1A3B5C',
        r'(?i)#e1e6f0': '#1A3B5C',
        r'(?i)#e3e8f0': '#1A3B5C',

        # Light Badges/Pills/Backgrounds
        r'(?i)#eef2f7': '#113255',
        r'(?i)#f3f6fb': '#113255',
        r'(?i)#eef4ff': '#113255',
        r'(?i)#eef6ff': '#113255',
        r'(?i)#e8f1ff': '#113255',
        r'(?i)#e5f0ff': '#113255',
        r'(?i)#efe7ff': '#113255',
        r'(?i)#e9f8ef': '#113255',
        
        # Specific Brand Gradient Replacement
        r'\["#1d6ee5",\s*"#6a36f5"\]': '["#437D8F", "#6EA2B3"]',
        r'\["#1a2332",\s*"#2f3f5a"\]': '["#437D8F", "#6EA2B3"]',
        
        # Shadow colors
        r'(?i)#1c2d4a': '#000000',
    }

    # First pass: replace all colors
    new_content = content
    for old_color_regex, new_color in color_map.items():
        new_content = re.sub(old_color_regex, new_color, new_content)

    # Manual adjustments for things that shouldn't be #0A4174 but were #ffffff
    # Ex: White text in buttons
    # We'll use regex to target specific styles that we know need white color
    
    # primaryButtonText color should be white
    new_content = re.sub(
        r'(primaryButtonText:\s*\{\s*color:\s*)"#[0-9a-fA-F]+"',
        r'\1"#ffffff"',
        new_content
    )
    
    # landingTitle / text
    new_content = re.sub(
        r'(landingTitle:\s*\{\s*[^}]*color:\s*)"#[0-9a-fA-F]+"',
        r'\1"#ffffff"',
        new_content
    )
    
    new_content = re.sub(
        r'(navTitle:\s*\{\s*color:\s*)"#[0-9a-fA-F]+"',
        r'\1"#ffffff"',
        new_content
    )
    
    new_content = re.sub(
        r'(evacTitle:\s*\{\s*[^}]*color:\s*)"#[0-9a-fA-F]+"',
        r'\1"#ffffff"',
        new_content
    )

    new_content = re.sub(
        r'(settingsTitle:\s*\{\s*[^}]*color:\s*)"#[0-9a-fA-F]+"',
        r'\1"#ffffff"',
        new_content
    )

    new_content = re.sub(
        r'(mapHeaderTitle:\s*\{\s*color:\s*)"#[0-9a-fA-F]+"',
        r'\1"#ffffff"',
        new_content
    )
    
    # Icons that were white should stay white
    new_content = re.sub(r'color="#0A4174"', 'color="#ffffff"', new_content)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        replace_colors(sys.argv[1])
    else:
        print("Usage: python apply_theme.py <path_to_App.js>")
