export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
  webViewLink?: string;
}

export interface TemplatesResponse {
  files: {
    presentations: DriveFile[];
    images: DriveFile[];
  };
  totalCount: number;
}
