from PIL import Image
import os

def crop_and_resize_favicon(input_path, output_path):
    try:
        img = Image.open(input_path)
        img = img.convert("RGBA")
        
        # Get the bounding box of the non-transparent area
        bbox = img.getbbox()
        if bbox:
            img = img.crop(bbox)
            print(f"Cropped to {bbox}")
            
            # Make it square by pasting on a transparent background
            width, height = img.size
            max_dim = max(width, height)
            
            # Create a new square image with transparent background
            square_img = Image.new("RGBA", (max_dim, max_dim), (0, 0, 0, 0))
            
            # Paste the cropped image centered
            offset_x = (max_dim - width) // 2
            offset_y = (max_dim - height) // 2
            square_img.paste(img, (offset_x, offset_y))
            
            # Resize slightly if needed (optional, but 512x512 is good for app icons)
            # keeping original resolution max is usually best for quality
            
            square_img.save(output_path)
            print(f"Saved optimized favicon to {output_path}")
        else:
            print("Image is fully transparent!")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    input_logo = r"c:\xampp\htdocs\FloodGuard\FloodGuard\frontend\admin\web-admin\assets\logo.png"
    output_favicon = r"c:\xampp\htdocs\FloodGuard\FloodGuard\frontend\admin\web-admin\assets\favicon.png"
    
    crop_and_resize_favicon(input_logo, output_favicon)
