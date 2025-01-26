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
    const missingVars = Object.entries(requiredEnvVars)
      .filter(([key, value]) => !value)
      .map(([key]) => `GOOGLE_SERVICE_ACCOUNT_${key.toUpperCase()}`);

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
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/presentations'
      ]
    });
  }

  // Método para listar arquivos do Drive com tipos específicos
  public async listFiles(folderId: string, mimeTypes: string[]) {
    try {
      const mimeTypeQuery = mimeTypes.map(type => `mimeType='${type}'`).join(' or ');
      const query = `'${folderId}' in parents and (${mimeTypeQuery})`;

      const response = await this.driveClient.files.list({
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
