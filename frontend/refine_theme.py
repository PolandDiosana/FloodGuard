import re
import sys

def refine_theme(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Soften the dark theme to match LandingScreen exactly (#1E2A38)
    color_map = {
        r'(?i)#001D39': '#1E2A38', # Backgrounds
        r'(?i)#0A4174': '#283747', # Cards
        r'(?i)#113255': '#34495E', # Badges
        r'(?i)#1A3B5C': '#44566A', # Borders
    }

    new_content = content
    for old_color_regex, new_color in color_map.items():
        new_content = re.sub(old_color_regex, new_color, new_content)

    # 2. Fix text that was mistakenly turned dark (#0A4174 -> #ffffff or #283747 -> #ffffff)
    text_styles_to_fix = [
        'heroText',
        'btnExploreText',
        'btnAdminText',
        'landingPrimaryText',
        'landingSecondaryText',
        'pillBadgeText',
        'primaryButtonText',
        'evacTitle',
        'navEndText',
        'reportStatusVerified',
    ]

    for style_name in text_styles_to_fix:
        # Regex to find `color: "#283747"` (or related) inside the style definition
        # Since we just replaced 0A4174 with 283747, the current color is "#283747"
        regex = r'(' + style_name + r':\s*\{[^}]*color:\s*)"#[0-9a-fA-F]+"'
        new_content = re.sub(regex, r'\1"#ffffff"', new_content)

    # Also fix inline or specific color definitions that were changed incorrectly
    # e.g., <Ionicons name="location" size={26} color="#0A4174" />
    new_content = re.sub(r'color="#283747"', 'color="#ffffff"', new_content)

    # Note: the above rule might accidentally make card backgrounds white if they used `color="#283747"` 
    # but `color=` is usually for text/icons in React Native.

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        refine_theme(sys.argv[1])
    else:
        print("Usage: python refine_theme.py <path_to_App.js>")
