from PIL import Image
import sys

def process_image(input_path, output_path):
    print(f"Processing {input_path} -> {output_path}")
    img = Image.open(input_path).convert("RGBA")
    data = img.getdata()

    new_data = []
    for item in data:
        r, g, b, a = item
        # Targeting Cyan background (#00FFFF)
        # Low red, high green, high blue
        is_cyan = (r < 140 and g > 160 and b > 160)
        # Targeting Solid White background
        is_white = (r > 235 and g > 235 and b > 235)
        
        if is_cyan or is_white:
            new_data.append((255, 255, 255, 0)) # Fully transparent
        else:
            new_data.append(item)

    img.putdata(new_data)
    img.save(output_path, "PNG")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        pass
    else:
        process_image(sys.argv[1], sys.argv[2])
