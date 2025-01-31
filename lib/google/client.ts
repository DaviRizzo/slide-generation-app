import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import { generateSlideContent } from '../openai/client';

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

  // Método auxiliar para extrair o estilo do texto
  private getElementStyle(element: any): any {
    if (element.shape?.text?.textElements) {
      // Pega o estilo do primeiro textRun que tiver
      const textRun = element.shape.text.textElements.find((te: any) => te.textRun);
      if (textRun?.textRun?.style) {
        return {
          ...textRun.textRun.style,
          // Remover campos que não queremos copiar
          content: undefined,
          textIndex: undefined
        };
      }
    }
    return null;
  }

  // Método para substituir placeholders de texto em uma apresentação
  public async replaceTextPlaceholders(presentationId: string, prompt: string, slideThemes: Record<string, string>) {
    try {
      console.log('[replaceTextPlaceholders] Iniciando substituição de texto com:', {
        presentationId,
        prompt,
        slideThemes
      });

      // 1. Obter a apresentação
      const presentation = await this.getPresentation(presentationId);
      const slides = presentation.slides || [];
      
      console.log(`[replaceTextPlaceholders] Apresentação obtida com ${slides.length} slides`);

      // 2. Para cada slide, processar seus placeholders de texto
      for (let slideIndex = 0; slideIndex < slides.length; slideIndex++) {
        const slide = slides[slideIndex];
        const slideTheme = slideThemes[slideIndex.toString()] || '';
        
        console.log(`[replaceTextPlaceholders] Processando slide ${slideIndex} com tema: ${slideTheme}`);
        
        if (!slide.pageElements) {
          console.log(`[replaceTextPlaceholders] Slide ${slideIndex} não tem elementos`);
          continue;
        }

        // Identificar placeholders de texto no slide
        const textPlaceholders = slide.pageElements
          .filter(element => {
            const isTextPlaceholder = 
              // Verifica se é um placeholder de texto tradicional
              (element.shape?.placeholder?.type === 'BODY' || 
               element.shape?.placeholder?.type === 'TITLE') ||
              // Verifica se é uma caixa de texto
              (element.shape?.shapeType === 'TEXT_BOX') ||
              // Verifica se tem propriedades de texto
              element.shape?.text?.textElements?.some(textElement => 
                textElement.textRun?.content?.trim()
              );

            console.log(`[replaceTextPlaceholders] Elemento ${element.objectId}: é placeholder? ${isTextPlaceholder}`, {
              shapeType: element.shape?.shapeType,
              placeholderType: element.shape?.placeholder?.type,
              hasText: element.shape?.text?.textElements?.length > 0
            });

            return isTextPlaceholder;
          })
          .map(element => {
            const currentContent = this.getElementText(element) || '';
            const style = this.getElementStyle(element);
            console.log(`[replaceTextPlaceholders] Placeholder ${element.objectId}:`, {
              currentContent,
              style
            });
            return {
              objectId: element.objectId!,
              currentContent,
              maxLength: currentContent?.length || 1000,
              style
            };
          });

        console.log(`[replaceTextPlaceholders] Encontrados ${textPlaceholders.length} placeholders no slide ${slideIndex}`);

        if (textPlaceholders.length === 0) continue;

        // Gerar conteúdo para os placeholders do slide
        console.log('[replaceTextPlaceholders] Gerando conteúdo com OpenAI...');
        const generatedContent = await generateSlideContent(
          prompt,
          slideTheme,
          textPlaceholders
        );
        console.log('[replaceTextPlaceholders] Conteúdo gerado:', generatedContent);

        // Criar requests para atualizar o texto de cada placeholder
        const requests = textPlaceholders.map(placeholder => {
          const text = generatedContent[placeholder.objectId];
          if (!text) return null;

          const requests = [];

          // Primeiro, limpar o texto existente
          requests.push({
            deleteText: {
              objectId: placeholder.objectId,
              textRange: {
                type: 'ALL'
              }
            }
          });

          // Depois, inserir o novo texto
          requests.push({
            insertText: {
              objectId: placeholder.objectId,
              text,
              insertionIndex: 0
            }
          });

          // Se houver estilo, aplicá-lo ao texto
          if (placeholder.style) {
            requests.push({
              updateTextStyle: {
                objectId: placeholder.objectId,
                style: placeholder.style,
                textRange: {
                  type: 'ALL'
                },
                fields: '*'
              }
            });
          }

          return requests;
        }).filter(Boolean).flat();

        // Aplicar as alterações
        if (requests.length > 0) {
          console.log(`[replaceTextPlaceholders] Aplicando ${requests.length} alterações no slide ${slideIndex}`);
          await this.slidesClient.presentations.batchUpdate({
            presentationId,
            requestBody: {
              requests
            }
          });
          console.log(`[replaceTextPlaceholders] Alterações aplicadas no slide ${slideIndex}`);
        }
      }
    } catch (error) {
      console.error('[replaceTextPlaceholders] Erro ao substituir placeholders:', error);
      throw error;
    }
  }

  // Método auxiliar para extrair texto de um elemento
  private getElementText(element: any): string | null {
    if (element.shape?.text?.textElements) {
      return element.shape.text.textElements
        .map((textElement: any) => textElement.textRun?.content || '')
        .join('')
        .trim();
    }
    return null;
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
