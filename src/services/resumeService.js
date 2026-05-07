import * as DocumentPicker from "expo-document-picker";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

import { firebaseStorage } from "./firebaseConfig";

export const pickResumePdf = () =>
  DocumentPicker.getDocumentAsync({
    type: "application/pdf",
    copyToCacheDirectory: true
  });

export const uploadResumeAsync = async ({ uri, userId }) => {
  const response = await fetch(uri);
  const blob = await response.blob();
  const storageRef = ref(firebaseStorage, `resumes/${userId}/${Date.now()}.pdf`);

  await uploadBytes(storageRef, blob);

  return getDownloadURL(storageRef);
};
