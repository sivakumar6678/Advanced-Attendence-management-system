import numpy as np

def verify_face(stored_descriptor, new_descriptor):
    """
    Compares stored face descriptor with the newly captured face descriptor.
    Uses Euclidean distance for comparison.
    """
    # ✅ Ensure the descriptors are NumPy arrays before computing distance
    stored_array = np.array(list(stored_descriptor.values())) if isinstance(stored_descriptor, dict) else np.array(stored_descriptor)
    new_array = np.array(list(new_descriptor.values())) if isinstance(new_descriptor, dict) else np.array(new_descriptor)

    distance = np.linalg.norm(stored_array - new_array)  # ✅ Fix subtraction issue
    return distance < 0.5  # ✅ Threshold for matching
