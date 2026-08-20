import torch
import numpy as np

class InteriorStylePresetNode:
    """
    Node cung cấp các bộ Preset phong cách thiết kế nội thất chuyên nghiệp
    """
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "style": ([
                    "Luxury Modern Marble",
                    "Scandinavian Warm Wood",
                    "Japandi Minimalist",
                    "Industrial Loft",
                    "Classic Elegant",
                    "Modern Tropical"
                ], {"default": "Luxury Modern Marble"}),
                "room_type": ([
                    "Living Room (Phòng khách)",
                    "Bedroom (Phòng ngủ)",
                    "Kitchen & Dining (Bếp & Phòng ăn)",
                    "Working Office (Phòng làm việc)",
                    "Bathroom (Phòng tắm)"
                ], {"default": "Living Room (Phòng khách)"}),
                "custom_details": ("STRING", {
                    "multiline": True, 
                    "default": "warm ambient lighting, high end furniture, indoor green plants, 8k resolution, architectural photography"
                })
            }
        }

    RETURN_TYPES = ("STRING", "STRING")
    RETURN_NAMES = ("positive_prompt", "negative_prompt")
    FUNCTION = "generate_prompts"
    CATEGORY = "Interior Studio App 🏡"

    def generate_prompts(self, style, room_type, custom_details):
        style_prompts = {
            "Luxury Modern Marble": "photorealistic luxury modern interior architecture, italian marble flooring, gold accent details, warm recessed spotlighting, premium leather and velvet sofa, 8k render, architectural digest photography",
            "Scandinavian Warm Wood": "scandinavian interior design, natural light oak wood finishes, cozy textile sofa, beige neutral tones, bright window light, minimalist aesthetic, highly detailed",
            "Japandi Minimalist": "japandi interior style, wabi-sabi aesthetic, raw wood, linen textures, subtle earth tones, bonsai plant, zen atmosphere, clean lines, high quality render",
            "Industrial Loft": "industrial loft interior design, exposed brick wall, polished concrete floor, matte black metal accents, vintage leather sofa, warm edison bulb lighting, high resolution",
            "Classic Elegant": "classic french interior architecture, wall molding, crystal chandelier, herringbone hardwood floor, elegant fireplace, luxury drapery, photorealistic render",
            "Modern Tropical": "modern tropical interior design, large glass windows with jungle garden view, rattan furniture, lush monstera plants, natural teak wood, airy bright atmosphere"
        }

        base_prompt = style_prompts.get(style, "photorealistic interior design")
        positive = f"{room_type}, {base_prompt}, {custom_details}"
        negative = "blurry, low resolution, ugly, distorted geometry, dark, bad proportion, out of frame, noisy, raw 3d block"

        return (positive, negative)


class InteriorBlockoutProcessorNode:
    """
    Node xử lý hình khối cơ bản (Blockout / Sketch) và chuyển đổi thành Map dẫn đường cho ControlNet
    """
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "image": ("IMAGE",),
                "contrast": ("FLOAT", {"default": 1.2, "min": 0.5, "max": 2.0, "step": 0.1}),
                "invert": ("BOOLEAN", {"default": False})
            }
        }

    RETURN_TYPES = ("IMAGE",)
    RETURN_NAMES = ("processed_blockout",)
    FUNCTION = "process"
    CATEGORY = "Interior Studio App 🏡"

    def process(self, image, contrast, invert):
        # Convert tensor to numpy for image processing if needed
        img = image.clone()
        if invert:
            img = 1.0 - img
        img = torch.clamp((img - 0.5) * contrast + 0.5, 0.0, 1.0)
        return (img,)


NODE_CLASS_MAPPINGS = {
    "InteriorStylePresetNode": InteriorStylePresetNode,
    "InteriorBlockoutProcessorNode": InteriorBlockoutProcessorNode
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "InteriorStylePresetNode": "🏡 Interior Style Presets",
    "InteriorBlockoutProcessorNode": "🧊 Interior Blockout Preprocessor"
}
