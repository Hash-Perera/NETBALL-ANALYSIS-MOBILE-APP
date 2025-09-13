from PIL import Image
import numpy as np
from tensorflow import keras
import tensorflow as tf

# Print versions
print(f"TensorFlow version: {tf.__version__}")
print(f"Keras version: {tf.keras.__version__}")

# Load model
try:
    model = keras.models.load_model("netball_injury_model.keras")
    print("Model loaded successfully!")
    print(f"Model input shape: {model.input_shape}")
    print(f"Model output shape: {model.output_shape}")
except Exception as e:
    print(f"Detailed error: {e}")
    print(f"Error type: {type(e)}")
    import traceback
    traceback.print_exc()


def process_image(image_path):
    """Process an image and return predicted class with probability."""
    img_height, img_width = 224, 224
    class_names = ['abrasions', 'mild_bruises', 'severe_bruise']

    # Load and preprocess image
    image = Image.open(image_path).convert("RGB")  # ensure 3 channels
    image_resized = image.resize((img_width, img_height))
    image_array = np.array(image_resized).astype("float32") / 255.0  # normalize
    image_batch = np.expand_dims(image_array, axis=0)  # shape (1,224,224,3)

    # Predict
    pred = model.predict(image_batch)
    output_class = class_names[np.argmax(pred)]
    probability = float(round(np.max(pred[0]), 6))

    return {"class": output_class, "probability": probability}
