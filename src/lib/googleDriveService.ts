export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
  webViewLink?: string;
  iconLink?: string;
  createdTime?: string;
  modifiedTime?: string;
  size?: string;
  owners?: Array<{ displayName: string; emailAddress: string; photoLink?: string }>;
}

export interface DriveQuota {
  limit?: string;
  usage?: string;
  usageInDrive?: string;
  usageInDriveTrash?: string;
}

export interface DriveUser {
  displayName: string;
  emailAddress: string;
  photoLink?: string;
}

export const GoogleDriveService = {
  async getUserInfoAndQuota(token: string): Promise<{ user?: DriveUser; quota?: DriveQuota }> {
    const res = await fetch('https://www.googleapis.com/drive/v3/about?fields=user,storageQuota', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Gagal mengambil info Google Drive');
    }
    const data = await res.json();
    return {
      user: data.user,
      quota: data.storageQuota
    };
  },

  async listFiles(
    token: string,
    options?: { q?: string; pageToken?: string; pageSize?: number; orderBy?: string }
  ): Promise<{ files: DriveFileItem[]; nextPageToken?: string }> {
    const params = new URLSearchParams();
    params.append('fields', 'nextPageToken, files(id, name, mimeType, thumbnailLink, webViewLink, iconLink, createdTime, modifiedTime, size, owners)');
    params.append('pageSize', (options?.pageSize || 30).toString());
    params.append('orderBy', options?.orderBy || 'folder,modifiedTime desc');
    
    // Filter out trashed files by default
    let query = "trashed = false";
    if (options?.q) {
      query += ` and ${options.q}`;
    }
    params.append('q', query);

    if (options?.pageToken) {
      params.append('pageToken', options.pageToken);
    }

    const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Gagal memuat berkas dari Google Drive');
    }

    return await res.json();
  },

  async createFolder(token: string, folderName: string, parentFolderId?: string): Promise<DriveFileItem> {
    const metadata: any = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder'
    };
    if (parentFolderId) {
      metadata.parents = [parentFolderId];
    }

    const res = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,mimeType,webViewLink', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(metadata)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Gagal membuat folder di Google Drive');
    }

    return await res.json();
  },

  async uploadFile(
    token: string,
    file: File | Blob,
    fileName: string,
    mimeType?: string,
    parentFolderId?: string
  ): Promise<DriveFileItem> {
    const metadata: any = {
      name: fileName,
      mimeType: mimeType || file.type || 'application/octet-stream'
    };
    if (parentFolderId) {
      metadata.parents = [parentFolderId];
    }

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const fileReader = new FileReader();
    const fileDataPromise = new Promise<ArrayBuffer>((resolve, reject) => {
      fileReader.onload = () => resolve(fileReader.result as ArrayBuffer);
      fileReader.onerror = reject;
      fileReader.readAsArrayBuffer(file);
    });

    const fileData = await fileDataPromise;

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${metadata.mimeType}\r\n\r\n`;

    const blob = new Blob([multipartRequestBody, new Uint8Array(fileData), closeDelimiter], {
      type: `multipart/related; boundary="${boundary}"`
    });

    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,size,createdTime', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary="${boundary}"`
      },
      body: blob
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Gagal mengunggah berkas ke Google Drive');
    }

    return await res.json();
  },

  async uploadJsonBackup(token: string, data: any, fileName: string, parentFolderId?: string): Promise<DriveFileItem> {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    return this.uploadFile(token, blob, fileName, 'application/json', parentFolderId);
  },

  async deleteFile(token: string, fileId: string): Promise<boolean> {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok && res.status !== 204) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Gagal menghapus berkas dari Google Drive');
    }

    return true;
  }
};
