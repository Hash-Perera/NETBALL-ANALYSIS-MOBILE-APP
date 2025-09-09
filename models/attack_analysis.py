import cv2
import mediapipe as mp
import numpy as np
import matplotlib.pyplot as plt
from moviepy.editor import ImageSequenceClip, VideoFileClip, clips_array, ColorClip, CompositeVideoClip
import os
from scipy.spatial.distance import cosine


def calculate_angle(a, b, c):
    """Calculate the angle between three points"""
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

def calculate_shoulder_angle(left_shoulder, right_shoulder):
    """Calculate the angle of shoulders relative to horizontal"""
    horizontal_point = [left_shoulder[0], right_shoulder[1]]
    return calculate_angle(horizontal_point, right_shoulder, left_shoulder)

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
        
        # Get coordinates for angle calculations
        left_shoulder = [landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].x,
                        landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].y]
        right_shoulder = [landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].x,
                         landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].y]
        left_elbow = [landmarks[mp_pose.PoseLandmark.LEFT_ELBOW.value].x,
                     landmarks[mp_pose.PoseLandmark.LEFT_ELBOW.value].y]
        right_elbow = [landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW.value].x,
                      landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW.value].y]
        left_wrist = [landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value].x,
                     landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value].y]
        right_wrist = [landmarks[mp_pose.PoseLandmark.RIGHT_WRIST.value].x,
                      landmarks[mp_pose.PoseLandmark.RIGHT_WRIST.value].y]
        
        # Calculate angles
        angles['shoulder_alignment'] = calculate_shoulder_angle(left_shoulder, right_shoulder)
        angles['left_elbow'] = calculate_angle(left_shoulder, left_elbow, left_wrist)
        angles['right_elbow'] = calculate_angle(right_shoulder, right_elbow, right_wrist)
        
        # Draw angles on frame
        h, w = frame.shape[:2]
        cv2.putText(image, f"Shoulder angle: {angles['shoulder_alignment']:.1f}°",
                    (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        cv2.putText(image, f"Left elbow: {angles['left_elbow']:.1f}°",
                    (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        cv2.putText(image, f"Right elbow: {angles['right_elbow']:.1f}°",
                    (10, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        
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
    shoulder_angles = [frame['shoulder_alignment'] for frame in angles_list]
    left_elbow_angles = [frame['left_elbow'] for frame in angles_list]
    right_elbow_angles = [frame['right_elbow'] for frame in angles_list]
    
    return shoulder_angles, left_elbow_angles, right_elbow_angles

def create_angle_animation(correct_angles, incorrect_angles, fps, similarities):
    """Creates an animated graph comparing three sets of angles over time with similarity metrics"""
    # Create temporary directory for frames
    if not os.path.exists('temp_frames'):
        os.makedirs('temp_frames')
    
    # Extract individual angle data
    correct_shoulder, correct_left, correct_right = extract_angle_data(correct_angles)
    incorrect_shoulder, incorrect_left, incorrect_right = extract_angle_data(incorrect_angles)
    
    # Setup animation frames
    max_frames = max(len(correct_angles), len(incorrect_angles))
    times = list(range(max_frames))
    
    # Generate each frame
    graph_frames = []
    for frame in range(max_frames):
        # Create figure with three subplots
        fig, (ax1, ax2, ax3) = plt.subplots(3, 1, figsize=(10, 12))
        
        # Plot shoulder alignment
        if frame < len(correct_shoulder):
            ax1.plot(times[:frame+1], correct_shoulder[:frame+1], 
                    'g-', linewidth=2, label='Correct Technique')
        if frame < len(incorrect_shoulder):
            ax1.plot(times[:frame+1], incorrect_shoulder[:frame+1], 
                    'r-', linewidth=2, label='Incorrect Technique')
        ax1.set_ylabel('Shoulder Angle (degrees)')
        ax1.set_title(f'Shoulder Alignment Comparison - Similarity: {similarities["shoulder"]:.2f}%')
        ax1.grid(True)
        ax1.legend()
        
        # Plot left elbow angle
        if frame < len(correct_left):
            ax2.plot(times[:frame+1], correct_left[:frame+1], 
                    'g-', linewidth=2, label='Correct Technique')
        if frame < len(incorrect_left):
            ax2.plot(times[:frame+1], incorrect_left[:frame+1], 
                    'r-', linewidth=2, label='Incorrect Technique')
        ax2.set_ylabel('Left Elbow Angle (degrees)')
        ax2.set_title(f'Left Elbow Angle Comparison - Similarity: {similarities["left_elbow"]:.2f}%')
        ax2.grid(True)
        ax2.legend()
        
        # Plot right elbow angle
        if frame < len(correct_right):
            ax3.plot(times[:frame+1], correct_right[:frame+1], 
                    'g-', linewidth=2, label='Correct Technique')
        if frame < len(incorrect_right):
            ax3.plot(times[:frame+1], incorrect_right[:frame+1], 
                    'r-', linewidth=2, label='Incorrect Technique')
        ax3.set_ylabel('Right Elbow Angle (degrees)')
        ax3.set_xlabel('Frame Number')
        ax3.set_title(f'Right Elbow Angle Comparison - Similarity: {similarities["right_elbow"]:.2f}%')
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
    
    # Create video from frames
    clip = ImageSequenceClip(graph_frames, fps=fps)
    return clip, graph_frames

def calculate_similarities(correct_angles, incorrect_angles):
    """Calculate similarity percentages between correct and incorrect angle sequences"""
    # Extract angle data
    correct_shoulder, correct_left, correct_right = extract_angle_data(correct_angles)
    incorrect_shoulder, incorrect_left, incorrect_right = extract_angle_data(incorrect_angles)
    
    # Calculate similarity for each type of angle
    shoulder_similarity = calculate_cosine_similarity(correct_shoulder, incorrect_shoulder) * 100
    left_elbow_similarity = calculate_cosine_similarity(correct_left, incorrect_left) * 100
    right_elbow_similarity = calculate_cosine_similarity(correct_right, incorrect_right) * 100
    
    # Calculate overall similarity (average of all metrics)
    overall_similarity = (shoulder_similarity + left_elbow_similarity + right_elbow_similarity) / 3
    
    return {
        "shoulder": shoulder_similarity,
        "left_elbow": left_elbow_similarity,
        "right_elbow": right_elbow_similarity,
        "overall": overall_similarity
    }

def analyze_movement(correct_video_path, incorrect_video_path, output_path):
    """
    Complete analysis pipeline that generates a single video with landmarks, angles, and graphs
    
    Parameters:
    correct_video_path (str): Path to the video with correct technique
    incorrect_video_path (str): Path to the video with incorrect technique
    output_path (str): Path where the final analysis video will be saved
    
    Returns:
    dict: A dictionary containing the output file path and similarity metrics
    """
    mp_pose = mp.solutions.pose
    mp_drawing = mp.solutions.drawing_utils
    
    # Initialize video captures
    cap1 = cv2.VideoCapture(correct_video_path)
    cap2 = cv2.VideoCapture(incorrect_video_path)
    
    # Get video properties
    width = int(cap1.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap1.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = int(cap1.get(cv2.CAP_PROP_FPS))
    
    # Create temporary directory for video frames
    if not os.path.exists('temp_video_frames'):
        os.makedirs('temp_video_frames')
    
    # Lists to store angle data and frames
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
            
            # Process both frames
            processed1, angles1 = process_frame(frame1, pose, mp_pose, mp_drawing)
            processed2, angles2 = process_frame(frame2, pose, mp_pose, mp_drawing)
            
            # Add labels BEFORE combining frames
            cv2.putText(processed1, "Correct Technique", (10, height - 30),
                       cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 255, 0), 2)
            cv2.putText(processed2, "Incorrect Technique", (10, height - 30),
                       cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 0, 255), 2)
            
            # Store angles for analysis
            if angles1 and angles2:
                correct_angles.append(angles1)
                incorrect_angles.append(angles2)
            
            # Combine frames horizontally AFTER adding labels
            combined_frame = np.hstack((processed1, processed2))
            
            # Save frame
            frame_path = f'temp_video_frames/frame_{frame_count:04d}.png'
            cv2.imwrite(frame_path, combined_frame)
            video_frames.append(frame_path)
            frame_count += 1
    
    # Release video captures
    cap1.release()
    cap2.release()
    
    # Calculate similarity metrics
    similarities = calculate_similarities(correct_angles, incorrect_angles)
    
    # Add overall similarity to the last frame
    last_frame = cv2.imread(video_frames[-1])
    cv2.putText(last_frame, f"Overall Similarity: {similarities['overall']:.2f}%", 
               (width//2 - 150, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
    cv2.imwrite(video_frames[-1], last_frame)
    
    # Create video clip from frames
    video_clip = ImageSequenceClip(video_frames, fps=fps)
    
    # Create graph animation with similarity metrics
    graph_clip, graph_frames = create_angle_animation(correct_angles, incorrect_angles, fps, similarities)
    
    # Resize graph clip to match video width and height
    graph_clip = graph_clip.resize(width=video_clip.w)
    graph_clip = graph_clip.resize(height=video_clip.h)
    
    # Arrange video and graph clips side by side
    combined_clip = clips_array([[video_clip, graph_clip]])
    
    # --- NEW CODE FOR FINAL CLIP RESOLUTION ---
    # Resize combined_clip to fit within 1280x720 while preserving aspect ratio
    orig_w, orig_h = combined_clip.size
    target_w, target_h = 1280, 720
    aspect_ratio = orig_w / orig_h
    target_aspect = target_w / target_h

    if aspect_ratio > target_aspect:
        new_w = target_w
        new_h = target_w / aspect_ratio
    else:
        new_h = target_h
        new_w = target_h * aspect_ratio

    combined_clip_resized = combined_clip.resize(newsize=(int(new_w), int(new_h)))
    
    # Create a white background clip of target resolution and composite the resized clip at center.
    background = ColorClip(size=(target_w, target_h), color=(255, 255, 255), duration=combined_clip.duration)
    final_clip = CompositeVideoClip([background, combined_clip_resized.set_position("center")])
    # --------------------------------------------------
    
    # Write final video
    final_clip.write_videofile(output_path, codec='libx264')
    
    # Clean up temporary files
    for frame in video_frames:
        os.remove(frame)
    for frame in graph_frames:
        os.remove(frame)
    
    # Close clips
    video_clip.close()
    graph_clip.close()
    combined_clip.close()
    final_clip.close()
    
    return {
        "output_filepath": output_path,
        "similarity_metrics": similarities  
    }