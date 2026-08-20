import os
from PIL import Image, ImageDraw

def generate_sample_blockout(output_path="/home/neito/Documents/comfyui/input_blockout.png"):
    width, height = 768, 512
    img = Image.new("RGB", (width, height), color=(220, 220, 225))
    draw = ImageDraw.Draw(img)

    # Wall background grid / perspective lines
    draw.polygon([(0, 0), (width, 0), (width-100, 100), (100, 100)], fill=(200, 205, 210), outline=(150, 150, 160)) # Back wall
    draw.polygon([(0, 0), (100, 100), (100, height-80), (0, height)], fill=(180, 185, 195), outline=(140, 140, 150)) # Left wall
    draw.polygon([(width, 0), (width-100, 100), (width-100, height-80), (width, height)], fill=(190, 195, 205), outline=(140, 140, 150)) # Right wall
    draw.polygon([(100, height-80), (width-100, height-80), (width, height), (0, height)], fill=(160, 165, 175), outline=(120, 120, 130)) # Floor

    # Large Window Box on back wall
    draw.rectangle([250, 140, 518, 280], fill=(130, 180, 220), outline=(80, 120, 160), width=3)

    # Sofa 3D Block (Foreground left)
    draw.polygon([(140, 320), (380, 320), (380, 420), (140, 420)], fill=(120, 120, 130), outline=(60, 60, 70))
    draw.polygon([(140, 270), (380, 270), (380, 320), (140, 320)], fill=(140, 140, 150), outline=(60, 60, 70)) # Backrest

    # Coffee Table 3D Block (Center)
    draw.polygon([(420, 380), (580, 380), (560, 440), (400, 440)], fill=(90, 80, 70), outline=(40, 40, 40))

    # Floor Lamp Box (Right)
    draw.rectangle([620, 200, 640, 400], fill=(100, 100, 100), outline=(50, 50, 50))
    draw.rectangle([600, 160, 660, 200], fill=(230, 210, 160), outline=(150, 130, 80))

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    img.save(output_path)
    print(f"✅ Đã tạo ảnh blockout khối cơ bản tại: {output_path}")

if __name__ == "__main__":
    generate_sample_blockout()
