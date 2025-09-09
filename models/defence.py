import cv2
import mediapipe as mp
import numpy as np
import matplotlib.pyplot as plt
from moviepy.editor import ImageSequenceClip, VideoFileClip, clips_array, ColorClip, CompositeVideoClip
import os
from scipy.spatial.distance import cosine

def calculate_angle(a, b, c):
    """Calculate angle between three points"""
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

def calculate_hip_knee_distance(left_hip, right_hip, left_knee, right_knee):
    """Calculate the average distance between hips and knees for stance width"""
    left_distance = np.sqrt((left_hip[0] - left_knee[0])**2 + (left_hip[1] - left_knee[1])**2)
    right_distance = np.sqrt((right_hip[0] - right_knee[0])**2 + (right_hip[1] - right_knee[1])**2)
    return (left_distance + right_distance) / 2

def process_frame(frame, pose, mp_pose, mp_drawing):
    """Process a single frame and return angle measurements"""
    image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    image.flags.writeable = False
    
    results = pose.process(image)
    
    image.flags.writeable = True
    image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
    
    angles = {}
    
    if results.pose_landmarks:
        landmarks = results.pose_landmarks.landmark
        
        # Get coordinates for defensive stance analysis
        left_hip = [landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].x,
                   landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].y]
        right_hip = [landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value].x,
                    landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value].y]
        left_knee = [landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value].x,
                    landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value].y]
        right_knee = [landmarks[mp_pose.PoseLandmark.RIGHT_KNEE.value].x,
                     landmarks[mp_pose.PoseLandmark.RIGHT_KNEE.value].y]
        left_ankle = [landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value].x,
                     landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value].y]
        right_ankle = [landmarks[mp_pose.PoseLandmark.RIGHT_ANKLE.value].x,
                      landmarks[mp_pose.PoseLandmark.RIGHT_ANKLE.value].y]
        
        # Calculate key angles for defensive stance
        angles['left_knee'] = calculate_angle(left_hip, left_knee, left_ankle)
        angles['right_knee'] = calculate_angle(right_hip, right_knee, right_ankle)
        angles['hip_stance'] = calculate_angle(left_hip, 
                                            [(left_hip[0] + right_hip[0])/2, 
                                             (left_hip[1] + right_hip[1])/2],
                                            right_hip)
        
        # Calculate stance width (distance between hips and knees)
        angles['stance_width'] = calculate_hip_knee_distance(left_hip, right_hip, left_knee, right_knee)
        
        # Draw angles on frame
        h, w = frame.shape[:2]
        cv2.putText(image, f"Left knee: {angles['left_knee']:.1f}°",
                    (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        cv2.putText(image, f"Right knee: {angles['right_knee']:.1f}°",
                    (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        cv2.putText(image, f"Hip stance: {angles['hip_stance']:.1f}°",
                    (10, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        cv2.putText(image, f"Stance width: {angles['stance_width']:.3f}",
                    (10, 120), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        
        # Draw pose landmarks
        mp_drawing.draw_landmarks(
            image,
            results.pose_landmarks,
            mp_pose.POSE_CONNECTIONS,
            mp_drawing.DrawingSpec(color=(245, 117, 66), thickness=2, circle_radius=2),
            mp_drawing.DrawingSpec(color=(245, 66, 230), thickness=2, circle_radius=2)
        )
    
    return image, angles

def extract_angle_data(angles_list):
    """Extract separate lists for each angle type from the angles data"""
    left_knee_angles = [frame['left_knee'] for frame in angles_list]
    right_knee_angles = [frame['right_knee'] for frame in angles_list]
    hip_stance_angles = [frame['hip_stance'] for frame in angles_list]
    stance_widths = [frame['stance_width'] for frame in angles_list]
    
    return left_knee_angles, right_knee_angles, hip_stance_angles, stance_widths

def calculate_similarities(correct_angles, incorrect_angles):
    """Calculate similarity percentages between correct and incorrect angle sequences"""
    # Extract angle data
    correct_lk, correct_rk, correct_hip, correct_width = extract_angle_data(correct_angles)
    incorrect_lk, incorrect_rk, incorrect_hip, incorrect_width = extract_angle_data(incorrect_angles)
    
    # Calculate similarity for each type of measurement
    left_knee_similarity = calculate_cosine_similarity(correct_lk, incorrect_lk) * 100
    right_knee_similarity = calculate_cosine_similarity(correct_rk, incorrect_rk) * 100
    hip_stance_similarity = calculate_cosine_similarity(correct_hip, incorrect_hip) * 100
    stance_width_similarity = calculate_cosine_similarity(correct_width, incorrect_width) * 100
    
    # Calculate overall similarity (average of all metrics)
    overall_similarity = (left_knee_similarity + right_knee_similarity + 
                         hip_stance_similarity + stance_width_similarity) / 4
    
    return {
        "left_knee": left_knee_similarity,
        "right_knee": right_knee_similarity,
        "hip_stance": hip_stance_similarity,
        "stance_width": stance_width_similarity,
        "overall": overall_similarity
    }

def create_angle_animation(correct_angles, incorrect_angles, fps, similarities):
    """Creates an animated graph comparing defense stance metrics over time with similarity metrics"""
    if not os.path.exists('temp_frames'):
        os.makedirs('temp_frames')
    
    # Extract individual angle data
    correct_lk, correct_rk, correct_hip, correct_width = extract_angle_data(correct_angles)
    incorrect_lk, incorrect_rk, incorrect_hip, incorrect_width = extract_angle_data(incorrect_angles)
    
    max_frames = max(len(correct_angles), len(incorrect_angles))
    times = list(range(max_frames))
    
    graph_frames = []
    for frame in range(max_frames):
        fig, (ax1, ax2, ax3) = plt.subplots(3, 1, figsize=(10, 12))
        
        # Plot knee angles
        if frame < len(correct_lk):
            ax1.plot(times[:frame+1], correct_lk[:frame+1], 
                    'g-', linewidth=2, label='Correct Left Knee')
            ax1.plot(times[:frame+1], correct_rk[:frame+1], 
                    'b-', linewidth=2, label='Correct Right Knee')
        if frame < len(incorrect_lk):
            ax1.plot(times[:frame+1], incorrect_lk[:frame+1], 
                    'r-', linewidth=2, label='Incorrect Left Knee')
            ax1.plot(times[:frame+1], incorrect_rk[:frame+1], 
                    'm-', linewidth=2, label='Incorrect Right Knee')
        ax1.set_ylabel('Knee Angles (degrees)')
        ax1.set_title(f'Knee Bend Comparison - Similarity: L: {similarities["left_knee"]:.2f}%, R: {similarities["right_knee"]:.2f}%')
        ax1.grid(True)
        ax1.legend()
        
        # Plot stance width
        if frame < len(correct_width):
            ax2.plot(times[:frame+1], correct_width[:frame+1], 
                    'g-', linewidth=2, label='Correct Technique')
        if frame < len(incorrect_width):
            ax2.plot(times[:frame+1], incorrect_width[:frame+1], 
                    'r-', linewidth=2, label='Incorrect Technique')
        ax2.set_ylabel('Stance Width')
        ax2.set_title(f'Defensive Stance Width Comparison - Similarity: {similarities["stance_width"]:.2f}%')
        ax2.grid(True)
        ax2.legend()
        
        # Add overall stance quality metric
        if frame < len(correct_lk):
            correct_quality = [(90 - abs(90 - k))/90 * 100 for k in correct_lk[:frame+1]]
            ax3.plot(times[:frame+1], correct_quality, 
                    'g-', linewidth=2, label='Correct Form')
        if frame < len(incorrect_lk):
            incorrect_quality = [(90 - abs(90 - k))/90 * 100 for k in incorrect_lk[:frame+1]]
            ax3.plot(times[:frame+1], incorrect_quality, 
                    'r-', linewidth=2, label='Incorrect Form')
        ax3.set_ylabel('Stance Quality (%)')
        ax3.set_xlabel('Frame Number')
        ax3.set_title('Overall Defensive Stance Quality')
        ax3.grid(True)
        ax3.legend()
        
        # Display overall similarity
        fig.suptitle(f'Overall Movement Similarity: {similarities["overall"]:.2f}%', fontsize=16)
        
        # Adjust layout and save frame
        plt.tight_layout()
        plt.subplots_adjust(top=0.9)  # Make room for the suptitle
        frame_path = f'temp_frames/graph_{frame:04d}.png'
        plt.savefig(frame_path)
        graph_frames.append(frame_path)
        plt.close()
    
    clip = ImageSequenceClip(graph_frames, fps=fps)
    return clip, graph_frames

def analyze_defensive_movement(correct_video_path, incorrect_video_path, output_path):
    """
    Complete analysis pipeline for defensive movement comparison
    
    Parameters:
    correct_video_path (str): Path to video with correct defensive technique
    incorrect_video_path (str): Path to video with incorrect defensive technique
    output_path (str): Path where the final analysis video will be saved
    
    Returns:
    dict: A dictionary containing the output file path and similarity metrics
    """
    mp_pose = mp.solutions.pose
    mp_drawing = mp.solutions.drawing_utils
    
    cap1 = cv2.VideoCapture(correct_video_path)
    cap2 = cv2.VideoCapture(incorrect_video_path)
    
    width = int(cap1.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap1.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = int(cap1.get(cv2.CAP_PROP_FPS))
    
    if not os.path.exists('temp_video_frames'):
        os.makedirs('temp_video_frames')
    
    correct_angles = []
    incorrect_angles = []
    video_frames = []
    frame_count = 0
    
    with mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5) as pose:
        while True:
            ret1, frame1 = cap1.read()
            ret2, frame2 = cap2.read()
            
            if not ret1 or not ret2:
                break
            
            processed1, angles1 = process_frame(frame1, pose, mp_pose, mp_drawing)
            processed2, angles2 = process_frame(frame2, pose, mp_pose, mp_drawing)
            
            if angles1 and angles2:
                correct_angles.append(angles1)
                incorrect_angles.append(angles2)
            
            # Add labels to distinguish correct vs incorrect technique
            cv2.putText(processed1, "Correct Technique", (10, height - 20),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            cv2.putText(processed2, "Incorrect Technique", (10, height - 20),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
            
            combined_frame = np.hstack((processed1, processed2))
            
            frame_path = f'temp_video_frames/frame_{frame_count:04d}.png'
            cv2.imwrite(frame_path, combined_frame)
            video_frames.append(frame_path)
            frame_count += 1
    
    cap1.release()
    cap2.release()
    
    # Calculate similarity metrics
    similarities = calculate_similarities(correct_angles, incorrect_angles)
    
    # Add overall similarity to the last frame
    last_frame = cv2.imread(video_frames[-1])
    cv2.putText(last_frame, f"Overall Similarity: {similarities['overall']:.2f}%", 
               (width//2 - 150, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
    cv2.imwrite(video_frames[-1], last_frame)
    
    video_clip = ImageSequenceClip(video_frames, fps=fps)
    graph_clip, graph_frames = create_angle_animation(correct_angles, incorrect_angles, fps, similarities)
    
    graph_clip = graph_clip.resize(height=video_clip.h)
    combined_clip = clips_array([[video_clip, graph_clip]])
    
    # --- NEW CODE FOR FINAL CLIP RESOLUTION ---
    # First, resize combined_clip while preserving aspect ratio so that it fits within 1280x720.
    orig_w, orig_h = combined_clip.size
    target_w, target_h = 1280, 720
    aspect_ratio = orig_w / orig_h
    target_aspect = target_w / target_h

    if aspect_ratio > target_aspect:
        # Limit by width
        new_w = target_w
        new_h = target_w / aspect_ratio
    else:
        # Limit by height
        new_h = target_h
        new_w = target_h * aspect_ratio

    combined_clip_resized = combined_clip.resize(newsize=(int(new_w), int(new_h)))
    
    # Create a white background clip of target resolution and composite the resized clip at center.
    background = ColorClip(size=(target_w, target_h), color=(255, 255, 255), duration=combined_clip.duration)
    final_clip = CompositeVideoClip([background, combined_clip_resized.set_position("center")])
    # --------------------------------------------------
    
    final_clip.write_videofile(output_path, codec='libx264')
    
    # Clean up temporary files
    for frame in video_frames:
        os.remove(frame)
    for frame in graph_frames:
        os.remove(frame)
    
    video_clip.close()
    graph_clip.close()
    combined_clip.close()
    final_clip.close()
    
    return {
        "output_filepath": output_path,
        "similarity_metrics": similarities
    }