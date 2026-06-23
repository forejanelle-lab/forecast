export function getAuditionMaterialApiUrl(auditionId: string, fileName: string): string {
  return `/api/auditions/${auditionId}/role-materials?fileName=${encodeURIComponent(fileName)}`;
}

export async function fetchAuditionMaterialBlob(
  auditionId: string,
  fileName: string,
): Promise<Blob | null> {
  try {
    const response = await fetch(getAuditionMaterialApiUrl(auditionId, fileName));
    if (!response.ok) return null;
    return response.blob();
  } catch {
    return null;
  }
}
