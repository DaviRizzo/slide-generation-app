export interface PageElement {
  objectId: string;
  title?: string;
  description?: string;
  shape?: {
    placeholder?: {
      type: string;
      index: number;
    };
  };
  placeholder?: {
    type: string;
    index: number;
  };
  type?: string;
  index?: number;
}

export interface TemplateSlide {
  id: string;
  title: string;
  thumbnail: string;
  pageElements: PageElement[];
}
