import cv2
import mediapipe as mp
import numpy as np
import matplotlib.pyplot as plt
from moviepy.editor import ImageSequenceClip, VideoFileClip, clips_array
import os
from scipy.spatial.distance import cosine

def calculate_angle(a, b, c):
    a = np.array(a)
    b = np.array(b)
    c = np.array(c)

    radians = np.arctan2(c[1]-b[1], c[0]-b[0]) - np.arctan2(a[1]-b[1], a[0]-b[0])
    angle = np.abs(radians*180.0/np.pi)

    if angle > 180.0:
        angle = 360-angle

    return angle

def calculate_cosine_similarity(list1, list2):
    """
    Calculate cosine similarity between two lists.
    If lists have different lengths, truncate the longer one.
    """
    # Ensure lists are numpy arrays
    list1 = np.array(list1)
    list2 = np.array(list2)
    
    # Truncate the longer list to match the shorter one
    min_length = min(len(list1), len(list2))
    list1 = list1[:min_length]
    list2 = list2[:min_length]
    
    # Calculate cosine similarity
    # Cosine similarity = 1 - cosine distance
    # Higher value (closer to 1) means more similar
    if np.all(list1 == 0) or np.all(list2 == 0):
        return 0  # Handle all-zero vectors
    
    similarity = 1 - cosine(list1, list2)
    return similarity

def process_video(video_path, output_path, title=None):
    angles = []
    frames = []
    cap = cv2.VideoCapture(video_path)
    mp_pose = mp.solutions.pose
    mp_drawing = mp.solutions.drawing_utils
    
    frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = int(cap.get(cv2.CAP_PROP_FPS))

    with mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5) as pose:
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = pose.process(image)

            if results.pose_landmarks:
                # Draw pose landmarks
                mp_drawing.draw_landmarks(
                    image,
                    results.pose_landmarks,
                    mp_pose.POSE_CONNECTIONS)

                landmarks = results.pose_landmarks.landmark

                shoulder = [landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].x,
                          landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].y]
                elbow = [landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW.value].x,
                        landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW.value].y]
                wrist = [landmarks[mp_pose.PoseLandmark.RIGHT_WRIST.value].x,
                        landmarks[mp_pose.PoseLandmark.RIGHT_WRIST.value].y]

                angle = calculate_angle(shoulder, elbow, wrist)
                angles.append(angle)
                
                # Add angle text to frame
                cv2.putText(image, f"Angle: {angle:.1f}", 
                          (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
                
                # Add title if provided
                if title:
                    cv2.putText(image, title,
                              (50, image.shape[0] - 30), cv2.FONT_HERSHEY_SIMPLEX, 
                              1.5, (255, 255, 255), 2)

            frames.append(image)

    cap.release()
    
    # Save processed video
    out = cv2.VideoWriter(output_path,
                         cv2.VideoWriter_fourcc(*'mp4v'),
                         fps,
                         (frame_width, frame_height))
    
    for frame in frames:
        out.write(cv2.cvtColor(frame, cv2.COLOR_RGB2BGR))
    out.release()
    
    return angles, frames

def create_combined_visualization(correct_video_path, wrong_video_path, output_path):
    # Create a temporary directory for frames
    temp_dir = 'temp_frames'
    if not os.path.exists(temp_dir):
        os.makedirs(temp_dir)
    
    # Process the two videos and get their angle sequences
    processed_correct_path = os.path.join(temp_dir, 'processed_correct.mp4')
    processed_wrong_path = os.path.join(temp_dir, 'processed_wrong.mp4')
    
    correct_angles, correct_frames = process_video(correct_video_path, processed_correct_path, "Correct")
    wrong_angles, wrong_frames = process_video(wrong_video_path, processed_wrong_path, "Wrong")
    
    # Calculate cosine similarity between the angle sequences
    similarity = calculate_cosine_similarity(correct_angles, wrong_angles)
    similarity_percentage = similarity * 100
    
    # Create graph frames to visualize angle progression
    max_frames = max(len(correct_angles), len(wrong_angles))
    correct_times = list(range(len(correct_angles)))
    wrong_times = list(range(len(wrong_angles)))
    
    for frame in range(max_frames):
        plt.figure(figsize=(8, 6))
        
        if frame < len(correct_angles):
            plt.plot(correct_times[:frame+1], correct_angles[:frame+1], 'g-',
                     linewidth=2, label='Correct Technique')
        
        if frame < len(wrong_angles):
            plt.plot(wrong_times[:frame+1], wrong_angles[:frame+1], 'r-',
                     linewidth=2, label='Wrong Technique')
        
        plt.xlim(0, max_frames)
        plt.ylim(0, 180)
        plt.xlabel('Frame Number')
        plt.ylabel('Arm Angle (degrees)')
        plt.title(f'Arm Angle Comparison\nSimilarity: {similarity_percentage:.2f}%')
        plt.grid(True)
        plt.legend()
        
        graph_frame_path = os.path.join(temp_dir, f'graph_{frame:04d}.png')
        plt.savefig(graph_frame_path)
        plt.close()
    
    # Create video clips from the processed videos and graph frames
    correct_clip = VideoFileClip(processed_correct_path)
    wrong_clip = VideoFileClip(processed_wrong_path)
    
    graph_frames = [os.path.join(temp_dir, f'graph_{frame:04d}.png') for frame in range(max_frames)]
    graph_clip = ImageSequenceClip(graph_frames, fps=correct_clip.fps)
    
    # Resize each clip to a uniform height of 720
    correct_clip = correct_clip.resize(height=720)
    wrong_clip = wrong_clip.resize(height=720)
    graph_clip = graph_clip.resize(height=720)
    
    # Combine clips side by side: [Correct | Wrong | Graph]
    composite_clip = clips_array([[correct_clip, wrong_clip, graph_clip]])
    
    # Resize composite to fit within 1280x720 while preserving aspect ratio
    scale_factor = min(1280 / composite_clip.w, 720 / composite_clip.h)
    composite_resized = composite_clip.resize(scale_factor)
    
    # Place the resized composite on a white background of size 1280x720
    final_clip = composite_resized.on_color(size=(1280, 720), color=(255, 255, 255), pos='center')
    
    # Write final output video with the desired resolution and background
    final_clip.write_videofile(output_path, codec='libx264')
    
    # Clean up: close video clips and remove temporary graph frames
    correct_clip.close()
    wrong_clip.close()
    graph_clip.close()
    
    for frame_path in graph_frames:
        os.remove(frame_path)
    # Optionally remove the temporary processed video files:
    # os.remove(processed_correct_path)
    # os.remove(processed_wrong_path)
    
    print("Final similarity percentage:", similarity_percentage)
    return {"output_filepath": output_path, "similarity_value": similarity_percentage}
