import * as DocumentPicker from "expo-document-picker";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

import { firebaseStorage } from "./firebaseConfig";

export const MAX_RESUME_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export const validateResumePdfAsset = (asset) => {
  if (!asset) {
    throw new Error("No resume file was selected.");
  }

  const fileName = asset.name || "";
  const mimeType = asset.mimeType || asset.type || "";
  const isPdf = mimeType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf");

  if (!isPdf) {
    throw new Error("Please upload a PDF resume only.");
  }

  if (typeof asset.size === "number") {
    if (asset.size <= 0) {
      throw new Error("This PDF appears to be empty. Please choose another file.");
    }

    if (asset.size > MAX_RESUME_FILE_SIZE_BYTES) {
      throw new Error("Resume PDF must be 5MB or smaller.");
    }
  }
};

export const pickResumePdf = () =>
  DocumentPicker.getDocumentAsync({
    type: "application/pdf",
    copyToCacheDirectory: true
  });

export const uploadResumeAsync = async ({ asset, uri, userId }) => {
  validateResumePdfAsset(asset || { name: uri });

  const response = await fetch(uri);
  const blob = await response.blob();

  if (!blob.size) {
    throw new Error("This PDF appears to be empty. Please choose another file.");
  }

  if (blob.size > MAX_RESUME_FILE_SIZE_BYTES) {
    throw new Error("Resume PDF must be 5MB or smaller.");
  }

  const storageRef = ref(firebaseStorage, `users/${userId}/resumes/${Date.now()}.pdf`);

  await uploadBytes(storageRef, blob);

  return getDownloadURL(storageRef);
};
