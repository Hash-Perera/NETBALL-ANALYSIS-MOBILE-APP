from PIL import Image
import numpy as np
from tensorflow import keras

model = keras.models.load_model("netball_injury_model.keras")


def process_image(image_path):
    
    image = Image.open(image_path)
    img_height, img_width = 224, 224
    image_resized = image.resize((img_width, img_height))
    
    image_array = np.array(image_resized)
   
    image = np.expand_dims(image_array, axis=0)

    pred = model.predict(image)
    class_names = ['abrasions', 'mild_bruises', 'severe_bruise']
    output_class = class_names[np.argmax(pred)]
    probability = float(str(round(max(pred[0]), 6)))
    return {"class": output_class, "probability": probability}
