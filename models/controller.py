from s3_download import download_s3_file
from ball_handling import create_combined_visualization
from defence import analyze_defensive_movement
from attack_analysis import analyze_movement
import uuid
from pydantic import BaseModel
from fastapi import APIRouter
import os 
from pathlib import Path
import boto3 
from injury_detection import process_image


S3_BUCKET_NAME = os.environ.get("S3_BUCKET_NAME")
AWS_ACCESS_KEY = os.environ.get("AWS_ACCESS_KEY")
AWS_SECRET_KEY = os.environ.get("AWS_SECRET_KEY")


s3_client = boto3.client(
    "s3",
    aws_access_key_id=AWS_ACCESS_KEY,
    aws_secret_access_key=AWS_SECRET_KEY
)


def predict_ball_handling(correct_video_url , wrong_video_url):
    correct_video_path = os.path.join(Path(__file__).parent , "input", "ball_handling" , f"{uuid.uuid4()}_correct_video.mp4" )
    wrong_video_path = os.path.join(Path(__file__).parent , "input", "ball_handling" , f"{uuid.uuid4()}_wrong_video.mp4" )
    
    if download_s3_file(url=correct_video_url , output_path=correct_video_path) and download_s3_file(url=wrong_video_url , output_path=wrong_video_path):
        output_path =os.path.join(Path(__file__).parent , "output", "ball_handling" , f"{uuid.uuid4()}_analysis.mp4")
        video = create_combined_visualization(correct_video_path=correct_video_path , wrong_video_path=wrong_video_path , output_path=output_path)
        
        upload_file_name = f"{os.path.basename(video['output_filepath'])}"
        s3_client.upload_file(video['output_filepath'], S3_BUCKET_NAME, upload_file_name)
        file_url = f"https://{S3_BUCKET_NAME}.s3.amazonaws.com/{upload_file_name}"
        
            
        return {"file_url":file_url , "similarity":video['similarity_value']}

def predict_attack(correct_video_url , wrong_video_url):
    correct_video_path = os.path.join(Path(__file__).parent , "input", "attack" , f"{uuid.uuid4()}_correct_video.mp4" )
    wrong_video_path = os.path.join(Path(__file__).parent , "input", "attack" , f"{uuid.uuid4()}_wrong_video.mp4" )
    if download_s3_file(url=correct_video_url , output_path=correct_video_path) and download_s3_file(url=wrong_video_url , output_path=wrong_video_path):
        
        output_path =os.path.join(Path(__file__).parent , "output", "attack" , f"{uuid.uuid4()}_analysis.mp4")
        video = analyze_movement(correct_video_path=correct_video_path , incorrect_video_path=wrong_video_path , output_path=output_path)
        
        upload_file_name = f"{os.path.basename(video['output_filepath'])}"
        s3_client.upload_file(video['output_filepath'], S3_BUCKET_NAME, upload_file_name)
        file_url = f"https://{S3_BUCKET_NAME}.s3.amazonaws.com/{upload_file_name}"
        
            
        return {"file_url": file_url, "similarity": video['similarity_metrics']}
    
    

def predict_defence(correct_video_url , wrong_video_url):
    correct_video_path = os.path.join(Path(__file__).parent , "input", "defence" , f"{uuid.uuid4()}_correct_video.mp4" )
    wrong_video_path = os.path.join(Path(__file__).parent , "input", "defence" , f"{uuid.uuid4()}_wrong_video.mp4" )
    if download_s3_file(url=correct_video_url , output_path=correct_video_path) and download_s3_file(url=wrong_video_url , output_path=wrong_video_path):
        
        output_path =os.path.join(Path(__file__).parent , "output", "defence" , f"{uuid.uuid4()}_analysis.mp4")
        video = analyze_defensive_movement(correct_video_path=correct_video_path , incorrect_video_path=wrong_video_path , output_path=output_path)
        
        upload_file_name = f"{os.path.basename(video['output_filepath'])}"
        s3_client.upload_file(video['output_filepath'], S3_BUCKET_NAME, upload_file_name)
        file_url = f"https://{S3_BUCKET_NAME}.s3.amazonaws.com/{upload_file_name}"
        
            
        return {"file_url": file_url, "similarity": video['similarity_metrics']}
    


class BallHandling(BaseModel):
    correct_s3_link:str
    wrong_s3_link:str


router = APIRouter()

@router.post("/ball_handling")
async def ball_handling_endpoint(ball_handling:BallHandling):
    predictions = predict_ball_handling(correct_video_url=ball_handling.correct_s3_link , wrong_video_url=ball_handling.wrong_s3_link)
    folders = ["/app/output/ball_handling" , "/app/output/attack" , "/app/output/defence" , "/app/input/attack" , "/app/input/ball_handling" , "/app/input/defence"]
        
    for folder_path in folders:
        if os.path.exists(folder_path) and os.path.isdir(folder_path):
            for filename in os.listdir(folder_path):
                file_path = os.path.join(folder_path, filename)
                if os.path.isfile(file_path):
                    os.remove(file_path)
        else:
            print(f"The folder {folder_path} does not exist or is not a directory.") 
    return {
        "ball_handling_result":predictions
    }

@router.post("/attack_analysis")
async def attack_analysis_endpoint(ball_handling:BallHandling):
    predictions = predict_attack(correct_video_url=ball_handling.correct_s3_link , wrong_video_url=ball_handling.wrong_s3_link)
    folders = ["/app/output/ball_handling" , "/app/output/attack" , "/app/output/defence" , "/app/input/attack" , "/app/input/ball_handling" , "/app/input/defence"]
        
    for folder_path in folders:
        if os.path.exists(folder_path) and os.path.isdir(folder_path):
            for filename in os.listdir(folder_path):
                file_path = os.path.join(folder_path, filename)
                if os.path.isfile(file_path):
                    os.remove(file_path)
        else:
            print(f"The folder {folder_path} does not exist or is not a directory.") 
    return {
        "attack_analysis_result":predictions
    }

@router.post("/defence_analysis")
async def defence_analysis_endpoint(ball_handling:BallHandling):
    predictions = predict_defence(correct_video_url=ball_handling.correct_s3_link , wrong_video_url=ball_handling.wrong_s3_link)
    folders = ["/app/output/ball_handling" , "/app/output/attack" , "/app/output/defence" , "/app/input/attack" , "/app/input/ball_handling" , "/app/input/defence"]
        
    for folder_path in folders:
        if os.path.exists(folder_path) and os.path.isdir(folder_path):
            for filename in os.listdir(folder_path):
                file_path = os.path.join(folder_path, filename)
                if os.path.isfile(file_path):
                    os.remove(file_path)
        else:
            print(f"The folder {folder_path} does not exist or is not a directory.") 
        
    return {
        "defence_analysis_result":predictions
    }


class InjuryImage(BaseModel):
    s3_link:str 

@router.post("/injury-detection")
async def injury_detection(image_path:InjuryImage):
    image = os.path.join(Path(__file__).parent , "input", "injury" , f"{uuid.uuid4()}_injury.png" )
    if download_s3_file(url=image_path.s3_link , output_path=image):
        injury_result = process_image(image_path=image)
        os.remove(image)
        return injury_result