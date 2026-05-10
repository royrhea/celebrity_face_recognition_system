import joblib
import base64
from wavelet import w2d
import numpy as np
import cv2
import json

__class_name_to_number={}
__class_number_to_name={}
__model=None


def classify_image(img_base64_data,file_path=None):
    imgs=get_cropped_images_if_2_eyes(file_path,img_base64_data)
    result = []
    for img in imgs:
        scaled_raw_img = cv2.resize(img, (48,48))

        img_har = w2d(img=scaled_raw_img, mode='db1', level=5)
        scaled_img_har = cv2.resize(img_har, (48,48))

        combined_img = np.concatenate((
            scaled_raw_img.reshape(48 * 48 * 3,),
            scaled_img_har.reshape(48 * 48,)
        ))
        final=combined_img.reshape(1,-1).astype(float)
        result.append({
            'class':class_number_to_name(__model.predict(final)[0]),
            'confidence':float(round(max(__model.predict_proba(final)[0]) * 100, 2))   
        })
    return result

def load_saved_artifacts():
    print("loading saved artifacts...start")
    global __class_name_to_number
    global __class_number_to_name
    with open("./artifacts/class_dictionary.json","r") as f:
        __class_name_to_number=json.load(f)
        __class_number_to_name={v:k for k,v in __class_name_to_number.items()}

    global __model
    if __model is None:
        with open("./artifacts/saved_model.pkl","rb") as f:
            __model=joblib.load(f)
    print("loading saved artifacts...done")

def class_number_to_name(class_num):
    return __class_number_to_name[class_num]

def get_cv2_img_from_base64_string(b64str):
    if b64str is None:
        return None
    if ',' in b64str:
        encoded_data = b64str.split(',')[1]
    else:
        encoded_data = b64str
    nparr = np.frombuffer(base64.b64decode(encoded_data), np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    return img

def get_cropped_images_if_2_eyes(img_path,img_base64_data):
    face_cascade=cv2.CascadeClassifier('./opencv/haarcascades/haarcascade_frontalface_default.xml')
    eye_cascade=cv2.CascadeClassifier('./opencv/haarcascades/haarcascade_eye.xml')
    if img_path:
        img = cv2.imread(img_path)
    else:
        img=get_cv2_img_from_base64_string(img_base64_data)
    
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.3, 5)
    cropped_faces = []
    for (x, y, w, h) in faces:
        roi_gray = gray[y:y+h, x:x+w]
        roi_color = img[y:y+h, x:x+w]
        eyes = eye_cascade.detectMultiScale(roi_gray)
        if len(eyes) >= 2:
            cropped_faces.append(roi_color) 
    return cropped_faces

def get_b64_test_img_for_jeniffer():
    with open("b64.txt") as f:
       return f.read()

if __name__=="__main__":
    load_saved_artifacts()
    print(classify_image(img_base64_data=get_b64_test_img_for_jeniffer(),file_path=None))
    