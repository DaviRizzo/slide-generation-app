import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

// Interface para as credenciais da conta de serviço
interface ServiceAccountCredentials {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
  universe_domain: string;
}

// Classe para gerenciar a autenticação e os clientes do Google
class GoogleAPIClient {
  private static instance: GoogleAPIClient;
  private auth: JWT;
  private driveClient;
  private slidesClient;

  private constructor() {
    const credentials = this.getCredentials();
    this.auth = this.initializeAuth(credentials);
    this.driveClient = google.drive({ version: 'v3', auth: this.auth });
    this.slidesClient = google.slides({ version: 'v1', auth: this.auth });
  }

  // Implementação do Singleton para garantir uma única instância
  public static getInstance(): GoogleAPIClient {
    if (!GoogleAPIClient.instance) {
      GoogleAPIClient.instance = new GoogleAPIClient();
    }
    return GoogleAPIClient.instance;
  }

  // Obtém e valida as credenciais do ambiente
  private getCredentials(): ServiceAccountCredentials {
    const requiredEnvVars = {
      type: process.env.GOOGLE_SERVICE_ACCOUNT_TYPE,
      project_id: process.env.GOOGLE_SERVICE_ACCOUNT_PROJECT_ID,
      private_key_id: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_ID,
      private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL,
      client_id: process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_ID,
      auth_uri: process.env.GOOGLE_SERVICE_ACCOUNT_AUTH_URI,
      token_uri: process.env.GOOGLE_SERVICE_ACCOUNT_TOKEN_URI,
      auth_provider_x509_cert_url: process.env.GOOGLE_SERVICE_ACCOUNT_AUTH_PROVIDER_X509_CERT_URL,
      client_x509_cert_url: process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_X509_CERT_URL,
      universe_domain: process.env.GOOGLE_SERVICE_ACCOUNT_UNIVERSE_DOMAIN
    };

    // Verifica se todas as variáveis necessárias estão definidas
    const missingVars = Object.keys(requiredEnvVars)
      .filter(key => !requiredEnvVars[key as keyof ServiceAccountCredentials])
      .map(key => `GOOGLE_SERVICE_ACCOUNT_${key.toUpperCase()}`);

    if (missingVars.length > 0) {
      throw new Error(`As seguintes variáveis de ambiente são necessárias mas não estão definidas: ${missingVars.join(', ')}`);
    }

    return requiredEnvVars as ServiceAccountCredentials;
  }

  // Inicializa o cliente de autenticação
  private initializeAuth(credentials: ServiceAccountCredentials): JWT {
    return new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: [
        'https://www.googleapis.com/auth/drive',  // Permissão completa para acessar todos os arquivos
        'https://www.googleapis.com/auth/presentations'
      ]
    });
  }

  // Verifica se um arquivo existe e é acessível
  private async checkFileExists(fileId: string) {
    try {
      const response = await this.driveClient.files.get({
        fileId,
        fields: 'id, name, mimeType',
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao verificar arquivo:', error);
      return null;
    }
  }

  // Método para listar arquivos do Drive com tipos específicos
  public async listFiles(folderId: string, mimeTypes: string[]) {
    try {
      const drive = google.drive({ version: 'v3', auth: this.auth });
      const mimeTypeQuery = mimeTypes.map(type => `mimeType='${type}'`).join(' or ');
      const query = `'${folderId}' in parents and (${mimeTypeQuery})`;

      const response = await drive.files.list({
        q: query,
        fields: 'files(id, name, mimeType, thumbnailLink, webViewLink)',
        spaces: 'drive',
        pageSize: 50,
        orderBy: 'name'
      });

      return response.data.files;
    } catch (error) {
      console.error('Erro ao listar arquivos:', error);
      throw error;
    }
  }

  // Método para obter detalhes de uma apresentação
  public async getPresentation(presentationId: string) {
    try {
      const response = await this.slidesClient.presentations.get({
        presentationId
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao obter apresentação:', error);
      throw error;
    }
  }

  // Método para obter thumbnail de alta qualidade do primeiro slide
  public async getFirstSlideThumbnail(presentationId: string) {
    try {
      const presentation = await this.getPresentation(presentationId);
      if (!presentation.slides || presentation.slides.length === 0) {
        return null;
      }

      const firstSlide = presentation.slides[0];
      const response = await this.slidesClient.presentations.pages.getThumbnail({
        presentationId,
        pageObjectId: firstSlide.objectId,
      });

      return response.data.contentUrl;
    } catch (error) {
      console.error('Erro ao obter thumbnail:', error);
      return null;
    }
  }

  // Método para obter thumbnails de todos os slides de uma apresentação
  public async getPresentationThumbnails(presentationId: string) {
    try {
      const presentation = await this.getPresentation(presentationId);
      if (!presentation.slides || presentation.slides.length === 0) {
        return [];
      }

      const thumbnailPromises = presentation.slides.map(async (slide) => {
        const response = await this.slidesClient.presentations.pages.getThumbnail({
          presentationId,
          pageObjectId: slide.objectId!,
        });
        return {
          thumbnailUrl: response.data.contentUrl,
        };
      });

      return await Promise.all(thumbnailPromises);
    } catch (error) {
      console.error('Erro ao obter thumbnails:', error);
      throw error;
    }
  }

  // Copia uma apresentação e reordena/remove slides conforme especificado
  public async copyPresentation(templateId: string, activeSlideIndexes: number[]) {
    try {
      // 1. Verifica se o arquivo existe e é acessível
      const file = await this.checkFileExists(templateId);
      if (!file) {
        throw new Error(`Arquivo não encontrado ou sem permissão de acesso: ${templateId}`);
      }

      console.log('Arquivo encontrado:', file);

      // 2. Copia a apresentação usando a API do Drive
      const copyResponse = await this.driveClient.files.copy({
        fileId: templateId,
        requestBody: {
          name: `Cópia de apresentação ${new Date().toISOString()}`,
          parents: ['1FpLdf9JsjQZpP-3-WJDLIa5lMV_Ad9Ma'], // ID da pasta de destino
        },
        supportsAllDrives: true,
      });

      const newPresentationId = copyResponse.data.id;

      // 3. Busca os slides da nova apresentação
      const presentation = await this.slidesClient.presentations.get({
        presentationId: newPresentationId,
      });

      const slides = presentation.data.slides || [];
      console.log(`Total de slides na apresentação: ${slides.length}`);
      console.log('Slides ativos:', activeSlideIndexes);

      // 4. Identifica slides para remover (aqueles que não estão no activeSlideIndexes)
      const deleteRequests = slides
        .map((slide, index) => ({ slide, index }))
        .filter(({ index }) => !activeSlideIndexes.includes(index + 1))
        .map(({ slide }) => ({
          deleteObject: {
            objectId: slide.objectId!,
          },
        }));

      // 5. Cria requests para reordenar os slides ativos
      const updateRequests = activeSlideIndexes
        .map((originalIndex, newIndex) => {
          const slide = slides[originalIndex - 1];
          if (!slide) return null;
          
          return {
            updateSlidesPosition: {
              slideObjectIds: [slide.objectId!],
              insertionIndex: newIndex,
            },
          };
        })
        .filter((request): request is NonNullable<typeof request> => request !== null);

      console.log(`Removendo ${deleteRequests.length} slides`);
      console.log(`Reordenando ${updateRequests.length} slides`);

      // 6. Aplica as alterações se houver
      if (deleteRequests.length > 0 || updateRequests.length > 0) {
        await this.slidesClient.presentations.batchUpdate({
          presentationId: newPresentationId,
          requestBody: {
            requests: [...deleteRequests, ...updateRequests],
          },
        });
      }

      // 7. Retorna os detalhes da nova apresentação
      const driveFile = await this.driveClient.files.get({
        fileId: newPresentationId,
        fields: 'id, name, webViewLink',
      });

      return {
        presentationId: newPresentationId,
        name: driveFile.data.name,
        webViewLink: driveFile.data.webViewLink,
      };

    } catch (error) {
      console.error('Erro ao copiar apresentação:', error);
      throw error;
    }
  }

  // Getter para o cliente do Drive
  public get drive() {
    return this.driveClient;
  }

  // Getter para o cliente do Slides
  public get slides() {
    return this.slidesClient;
  }
}

// Exporta uma instância única do cliente
export const googleAPIClient = GoogleAPIClient.getInstance();
