import re
import sys

def fix_text_colors(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # The text should be white (#ffffff)
    styles_to_make_white = [
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
        'dashboardTitle',
        'mapHeaderTitle'
    ]

    new_content = content

    for style_name in styles_to_make_white:
        # Regex to find any hex color in single or double quotes for these styles
        regex = r'(' + style_name + r':\s*\{[^}]*color:\s*)[\'"]#[0-9a-fA-F]+[\'"]'
        new_content = re.sub(regex, r"\1'#ffffff'", new_content)

    # Convert any remaining '#283747' text colors to white globally just in case
    # This might catch <Ionicons color="#283747" /> etc.
    new_content = re.sub(r'color:\s*[\'"]#283747[\'"]', "color: '#ffffff'", new_content)
    new_content = re.sub(r'color=[\'"]#283747[\'"]', 'color="#ffffff"', new_content)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        fix_text_colors(sys.argv[1])
