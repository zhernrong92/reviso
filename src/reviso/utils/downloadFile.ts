export function downloadFile(
  data: string | Uint8Array,
  filename: string,
  mimeType: string,
): void {
  const blobData = typeof data === 'string' ? data : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  const blob = new Blob([blobData as BlobPart], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
